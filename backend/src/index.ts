import express, {Request, Response, NextFunction} from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import {getGroqResponse} from "./groq/groq-api";
import {log} from "console";


dotenv.config();
const app = express();
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
    const prompt = body.prompt;
    const history = body.history;
    const response = await getGroqResponse(prompt, history);
    res.send(response);
    log('asked');
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
