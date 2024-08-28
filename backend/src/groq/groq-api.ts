import {Groq} from 'groq-sdk';
import dotenv from 'dotenv'
import {log} from "console";


dotenv.config();
const groq = new Groq({apiKey: process.env.GROQ_API_KEY});
export type ChatMessage = { role: "assistant" | "system" | "user"; content: string };

export async function getGroqResponse(prompt: string, history: ChatMessage[]) {
    const chatCompletion = await groq.chat.completions.create({
        "messages": [
            {
                "role": "user",
                "content": prompt
            }],
        "model": "llama3-8b-8192",
        "temperature": 1,
        "max_tokens": 1024,
        "top_p": 1,
        "stream": false,
        "stop": null
    });
    log('tested groq')
    const response = chatCompletion.choices[0].message.content;
    history.push({role: "user", content: prompt})
    history.push({role: "assistant", content: "" + response?.toString()})

    return {
        response: response,
        history: history
    }
}