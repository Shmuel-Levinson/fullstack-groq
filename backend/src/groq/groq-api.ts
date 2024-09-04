import {Groq} from 'groq-sdk';
import dotenv from 'dotenv'
import {log} from "console";


dotenv.config();
const groq = new Groq({apiKey: process.env.GROQ_API_KEY});
export type ChatMessage = { role: "assistant" | "system" | "user"; content: string };

export async function getGroqResponse(prompt: string) {
    const chatCompletion = await groq.chat.completions.create({
        "messages": [
            {
                "role": "user",
                "content": prompt
            }],
        "model": "llama3-8b-8192",
        "temperature": 0,
        "max_tokens": 1024,
        "top_p": 1,
        "stream": false,
        "stop": null
    });
    const response = chatCompletion.choices[0].message.content;
    return {
        response: response,
        history: []
    }
}

export async function getGroqResponseWithMessages({prompt, messages}:{prompt?: string, messages: ChatMessage[]}) {
    const fullMessages: ChatMessage[] = [...messages]
    if(prompt){
        fullMessages.push(        {
            "role": "user",
            "content": prompt
        })
    }
    const chatCompletion = await groq.chat.completions.create({
        "messages": fullMessages,
        "model": "llama3-8b-8192",
        "temperature": 0,
        "max_tokens": 1024,
        "top_p": 1,
        "stream": false,
        "stop": null
    });
    const response = chatCompletion.choices[0].message.content;
    fullMessages.push({role: "assistant", content: "" + response})
    return {
        response: response,
        messages: fullMessages
    }
}

export async function generateConversationWithRepeatedUserPrompt(params: {
    initialMessages: ChatMessage[],
    repeatedUserPrompt: string,
    numRepetitions: number
}): Promise<ChatMessage[]> {
    const {initialMessages, repeatedUserPrompt} = params;
    const numRepetitions = params.numRepetitions || 1;
    let conversation: ChatMessage[] = [...initialMessages];
    let res = await getGroqResponseWithMessages({messages:conversation})
    for (let i = 0; i < numRepetitions; i++) {
        conversation = res.messages;
        res = await getGroqResponseWithMessages({prompt:repeatedUserPrompt, messages: conversation})
    }

    return conversation
}

// export async function generateConversationWithPredefinedUserResponses(params: {
//     initialUserPrompt: string,
//     userResponses: string[],
// }): Promise<ChatMessage[]> {
//     const {initialUserPrompt, userResponses} = params;
//     const numRepetitions = params.userResponses.length || 1;
//     let conversation: ChatMessage[] = [];
//     let res = await getGroqResponseWithMessages(initialUserPrompt, conversation)
//     for (let i = 0; i < numRepetitions; i++) {
//         conversation = res.messages;
//         res = await getGroqResponseWithMessages(userResponses[i], conversation)
//     }
//     return conversation
// }
