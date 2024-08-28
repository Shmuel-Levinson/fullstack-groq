// src/index.js
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { log } from "console";
import OpenAI from "openai";

type User = {
	id: number;
	name: string;
	email: string;
};

type DataBase = {
	users: User[];
	messages: ChatMessage[];
	expenses: Expence[];
};

type Expence = {
	id: number;
	date: string;
	amount: number;
	description: string;
};

const actions = {
	$$CREATE_EXPENSE$$: async function (expence: Expence) {
		db.expenses.push(expence);
	},
};

const directives: string[] = [
	// "You should follow these rules throught the entire conversation:",

	// "1) If the message doesn't seem to pertain to expenses or analysis thereof proceed as usual with the conversation.",

	// "2) If the message implies the creation of a new expense object, then your response should contain " +
	// 	"the exact string $$CREATE_EXPENSE$$ and " +
	// 	"an object with the following properties: id, date, amount, description. " +
	// 	"and their values sohuld be the new expense object's properties as you have inferred them from the users message.",

	// "3) Only if the user seems to request analysis of his expenses you should respond with the exact string 'Please provide the data.' without any other words and without quotation moarks. "+
	// "Analysis questions may include: 'How much did I spend on food?', 'How much did I spend on rent?', 'How much did I spend on groceries?', 'How much did I spend on transport?', 'How much did I spen last month', 'What did i spend most on?'."
	// "If the user seems to request any kind of analysis of his expenses and he did NOT provide any data then your response should be " +
	// 	"the exact string 'Please provide the data.' without any other words and without quotation moarks.",
];

type ChatMessage = { role: "assistant" | "system" | "user"; content: string };
dotenv.config();

function fullDateTime() {
	const now = new Date();

	const date = now.toISOString().slice(0, 10);
	const time = now.toTimeString().slice(0, 8);
	const milliseconds = now.getMilliseconds();

	return `${date} ${time}.${milliseconds}`;
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app: Express = express();
app.use(express.json());
app.use((req: Request, res: Response, next: Function) => {
	// const token = req.header("Authorization");
	// log("intercepted!");
	// req.body.date = fullDateTime();
	// log(token);
	next();
});

const port = process.env.PORT || 3000;
const db: DataBase = {
	users: [],
	messages: directives.map((d) => ({ role: "system", content: d })),
	expenses: [],
};
app.post("/add", (req: Request, res: Response) => {
	log("body", req.body);
	log("query", req.query);
	const u: User = req.body as User;
	db.users.push(u);
	res.send(`User ${u.name} added!`);
});

// app.post("/ask_old", async (req: Request, res: Response) => {
// 	let finalAnswer = "";
// 	const { query } = req;
// 	const initialQuestion: string = query.question as string;
//
// 	const initialQuestionWithData =
// 		initialQuestion +
// 		"\n\n (if the beginning of this message seems like a creation request then create the expense above and only for reference here is the historical data so far: \n\n" +
// 		JSON.stringify(db.expenses) +
// 		")";
//
// 	db.messages.push({ role: "user", content: initialQuestionWithData });
//
// 	const completion = await openai.chat.completions.create({
// 		messages: db.messages,
// 		model: "gpt-3.5-turbo",
// 	});
// 	const initialAnswer =
// 		completion.choices[0].message.content ||
// 		"there was no answer for some reason";
// 	finalAnswer = initialAnswer;
// 	log("initialAnswer", initialAnswer);
// 	if (initialAnswer.includes("$$CREATE_EXPENSE$$")) {
// 		log("CREATE_EXPENSE!!");
// 		const expence = JSON.parse(
// 			initialAnswer.split("$$CREATE_EXPENSE$$")[1]
// 		) as Expence;
// 		db.expenses.push(expence);
// 		log("created expence", expence);
// 		// finalAnswer = "Expense created successfully \n\n" + JSON.stringify(expence);
// 		finalAnswer = "Got it!";
// 	} else if (initialAnswer.includes("Please provide the data")) {
// 		log("ANALYSIS!!");
// 		db.messages.push({
// 			role: "assistant",
// 			content: "Please provide the data.",
// 		});
// 		db.messages.push({
// 			role: "user",
// 			content: `Here is the data: \n\n ${JSON.stringify(db.expenses)}`,
// 		});
//
// 		const analysisCompletion = await openai.chat.completions.create({
// 			messages: db.messages,
// 			model: "gpt-3.5-turbo",
// 		});
// 		const analysisAnswer =
// 			analysisCompletion.choices[0].message.content ||
// 			"there was no answer for some reason";
//
// 		finalAnswer = analysisAnswer;
// 	}
//
// 	db.messages.push({ role: "assistant", content: finalAnswer });
// 	res.send({
// 		answer: finalAnswer,
// 		messages: db.messages.reverse(),
// 		expenses: db.expenses,
// 	});
// });

app.post("/ask", async (req: Request, res: Response) => {
	const { query } = req;
	const initialQuestion: string = query.question as string;
	const clear: boolean = query.clear === "true"
	if(clear) db.messages = [];
	if(!initialQuestion) return;
	let finalAnswer = "";
	db.messages.push({ role: "user", content: initialQuestion });

	const completion = await openai.chat.completions.create({
		messages: db.messages,
		model: "gpt-3.5-turbo",
	});
	const initialAnswer =
		completion.choices[0].message.content ||
		"there was no answer for some reason";
	finalAnswer = initialAnswer;
	db.messages.push({ role: "assistant", content: finalAnswer });
	res.send({
		answer: finalAnswer,
		messages: db.messages.slice(),
		// expenses: db.expenses,
	});
})

// async function main() {
// 	const completion = await openai.chat.completions.create({
// 		messages: [{ role: "system", content: "How are you?" }],
// 		model: "gpt-3.5-turbo",
// 	});
// 	console.log(completion.choices[0].message.content);
// }

// main()

app.listen(port, () => {
	console.log(`[server]: Server is running at http://localhost:${port}`);
});
