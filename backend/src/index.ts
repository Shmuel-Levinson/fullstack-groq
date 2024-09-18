import express, {Request, Response, NextFunction} from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import {
    generateAssistantMessage,
    generateConversationWithPredefinedUserResponses,
    generateConversationWithRepeatedUserPrompt, generateTestCases, generateUserMessage,
    getGroqResponse,
    getGroqResponseWithMessages
} from "./groq/groq-api";
import {log} from "console";
import {
    generateTaskAgentPrompt,
    generateTestAgentPrompt,
    generateEvaluationAgentDefinitionPrompt,
    generateEvaluationAgentPrompt
} from "./groq/base-prompts";
import cors from 'cors';

dotenv.config();
const app = express();
const corsOptions = {
    origin: process.env.ENV === 'PROD' ? 'https://www.my-app.com' : 'http://localhost:5173',
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true
};
app.use(cors(corsOptions));
app.use(helmet()); // Security middleware
app.use(cookieParser()); // Parse cookies
app.use(bodyParser.json()); // Parse JSON request bodies
app.use(bodyParser.urlencoded({extended: true})); // Parse URL-encoded request bodies


app.get('/ping', async (req: Request, res: Response, next: NextFunction) => {
    res.send('pong');
    log('pinged');
});

app.post('/prompt', async (req: Request, res: Response, next: NextFunction) => {
    const body = req.body;
    const initialPrompt = body.prompt;
    const history = body.history;
    const testAgentPrompt = generateTestAgentPrompt(initialPrompt)
    const testCases = await getGroqResponse(testAgentPrompt)
    const taskAgentPrompt = generateTaskAgentPrompt(initialPrompt, JSON.parse(testCases.response!).testCases)
    const taskAgentOutput = await getGroqResponse(taskAgentPrompt)
    const validationAgentPrompt = generateEvaluationAgentPrompt(initialPrompt, testCases.response!, taskAgentOutput.response!)
    const assessment = await getGroqResponse(validationAgentPrompt)
    const ret = {
        taskAgentPrompt: taskAgentPrompt,
        testAgentPrompt: testAgentPrompt,
        testCases: testCases.response!,
        taskAgentOutput: taskAgentOutput.response!,
        validationAgentPrompt: validationAgentPrompt,
        assessment: assessment.response,
        // history: taskAgentOutput.history
    }
    res.send(ret);
    console.log(ret);
});

app.post('/chat', async (req, res) => {
    const body = req.body;
    const prompt = body.prompt;
    const messages = body.messages;
    const ret = await getGroqResponseWithMessages({prompt, messages})
    res.send(ret)
    console.log(ret);
})

app.post('/repeatedConversation', async (req, res) => {
    const body = req.body;
    const {prompt, repeatedUserResponse, numRepetitions} = body

    const ret = await generateConversationWithRepeatedUserPrompt({
        initialMessages: [{content: prompt, role: "user"}],
        repeatedUserPrompt: repeatedUserResponse,
        numRepetitions: numRepetitions
    })
    res.send(ret)
    console.log(ret);
})

app.post('/generateConversation', async (req, res) => {
    const body = req.body;
    const {initialMessages, userResponses} = body;
    const conversation = await generateConversationWithPredefinedUserResponses({initialMessages, userResponses});
    res.send(conversation.filter(m => m.role === 'assistant').map(m => m.content));
    console.log(conversation);
})

async function generateTaskAgentOutputs(taskAgentDefinitionPrompt: string, testCases: string[]) {
    const conv = await generateConversationWithPredefinedUserResponses({
        initialMessages: [
            generateUserMessage(taskAgentDefinitionPrompt + "\nYou will receive your inputs now."),
            generateUserMessage(testCases.length > 0 ? testCases[0] : "")
        ], userResponses: testCases.slice(1)
    })
    const taskAgentOutputs: string[] = conv.filter(m => m.role === 'assistant').map(m => m.content)
    return taskAgentOutputs;
}

async function generateEvaluationAgentOutputs(taskAgentDefinitionPrompt: string, evaluationPairs: string[]) {
    const conv = await generateConversationWithPredefinedUserResponses({
        initialMessages: [
            generateUserMessage(generateEvaluationAgentDefinitionPrompt(taskAgentDefinitionPrompt) + "\nYou will receive your inputs now."),
            generateUserMessage(evaluationPairs.length > 0 ? evaluationPairs[0] : "")
        ], userResponses: evaluationPairs.slice(1)
    })
    const evaluationAgentOutputs: string[] = conv.filter(m => m.role === 'assistant').map(m => m.content)
    return evaluationAgentOutputs;
}

app.post('/testAndEvaluate', async (req, res) => {
    const body = req.body;
    const {taskAgentDefinitionPrompt, numTestCases, testCases} = body;
    const finalTestCases: string[] = testCases || await generateTestCases(taskAgentDefinitionPrompt, numTestCases)
    const taskAgentOutputs = await generateTaskAgentOutputs(taskAgentDefinitionPrompt, finalTestCases);
    const r = await getGroqResponse("Generate some random nonsense")
    taskAgentOutputs[0] = "" + r.response
    const evaluationObjects = []
    for (let i = 0; i < finalTestCases.length; i++) {
        evaluationObjects.push({
            input: finalTestCases[i],
            output: taskAgentOutputs[i],
            evaluation: ""
        })
    }
    const evaluationAgentOutputs = await generateEvaluationAgentOutputs(taskAgentDefinitionPrompt, evaluationObjects.map(obj => {
        return `Input: ${obj.input} \n\n Output: ${obj.output}`
    }))
    evaluationObjects.forEach((o, i) => {
        o.evaluation = evaluationAgentOutputs[i]
    })
    res.send(evaluationObjects);
    console.log(evaluationObjects);
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
