// src/index.js
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { log } from "console";
import { Client } from "pg";
import sql from 'sql-bricks'
dotenv.config();
const client = new Client(process.env.DATABASE_URL);

async function sanityCheck () {
	const results = await client.query("SELECT NOW()");
	console.log(results.rows);
};
const initDb = async () => {
	await client.connect();

	try {
		await sanityCheck();
		// await populateWithUsers()
		// await createUsersTable();
		// const testUser = await createUser("test", "<EMAIL>", "1234567890");
		// log(testUser)
		const allUsers = await getAllUsers();
		log(allUsers);

	} catch (err) {
		console.error("error executing query:", err);
	} finally {
		client.end();
	}
};

initDb();


const app: Express = express();
const port = process.env.PORT || 3000;
app.use(express.json());
app.use((req: Request, res: Response, next: Function) => {
	// const token = req.header("Authorization");
	// log("intercepted!");
	// req.body.date = fullDateTime();
	// log(token);
	next();
});
async function createUser(
	username: string,
	email: string,
	password: string,
	fullName?: string,
	birthdate?: Date
) {
	try {
		const query = `
      INSERT INTO users (username, email, password, full_name, birthdate)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING user_id, created_at`;
		const values = [username, email, password, fullName, birthdate];
		const result = await client.query(query, values);
		return result.rows[0];
	} catch (err) {
		console.error("Error creating user:", err);
		throw err;
	}
}

const dummyUsers = [
	{
		username: "jsmith123",
		email: "john.smith@example.com",
		password: "password1",
		fullName: "John Smith",
		birthdate: new Date("1990-01-01"),
	},
	{
		username: "janedoe456",
		email: "jane.doe@example.com",
		password: "password2",
		fullName: "Jane Doe",
		birthdate: new Date("1985-05-15"),
	},
	{
		username: "bobwilson789",
		email: "bob.wilson@example.com",
		password: "password3",
		fullName: "Bob Wilson",
		birthdate: new Date("1992-09-20"),
	},
	{
		username: "alicejones012",
		email: "alice.jones@example.com",
		password: "password4",
		fullName: "Alice Jones",
		birthdate: new Date("1988-03-10"),
	},
	{
		username: "charliedavis345",
		email: "charlie.davis@example.com",
		password: "password5",
		fullName: "Charlie Davis",
		birthdate: new Date("1995-11-30"),
	},
];
async function populateWithUsers() {
	for (const user of dummyUsers) {
		await createUser(
			user.username,
			user.email,
			user.password,
			user.fullName,
			user.birthdate
		);
	}
}

async function getAllUsers() {
	try {
		// const query = `SELECT * FROM users`;
		const query = sql.select().from('users').toString()
		const result = await client.query(query);
		return result.rows;
	} catch (err) {
		console.error("Error getting users:", err);
		throw err;
	}
}

app.post("/add", (req: Request, res: Response) => {
	log("body", req.body);
	log("query", req.query);
	const u = req.body;
	res.send(`User ${u.name} added!`);
});



app.listen(port, () => {
	console.log(`[server]: Server is running at http://localhost:${port}`);
});
