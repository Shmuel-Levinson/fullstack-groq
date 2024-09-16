import {Groq} from 'groq-sdk';
import GroqClient from 'groq-sdk'
import dotenv from 'dotenv'
import {log} from "console";
import {generateTestAgentPrompt} from "./base-prompts";


dotenv.config();
const groq = new Groq({apiKey: process.env.GROQ_API_KEY});
// const groq = new GroqClient(process.env.GROQ_API_KEY, {rejectUnauthorized: false})
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

export async function getGroqResponseWithMessages({prompt, messages}: { prompt?: string, messages: ChatMessage[] }) {
    const fullMessages: ChatMessage[] = [...messages]
    if (prompt) {
        fullMessages.push(generateUserMessage(prompt))
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
    if (response) {
        fullMessages.push(generateAssistantMessage(response))
    }
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
    let res = await getGroqResponseWithMessages({messages: conversation})
    for (let i = 0; i < numRepetitions; i++) {
        conversation = res.messages;
        res = await getGroqResponseWithMessages({prompt: repeatedUserPrompt, messages: conversation})
    }

    return conversation
}

export function generateAssistantMessage(content: string): ChatMessage {
    return generateMessage('assistant', content)
}

export function generateUserMessage(content: string): ChatMessage {
    return generateMessage('user', content)
}

export function generateMessage(role: 'assistant' | 'user', content: string): ChatMessage {
    return {
        role, content
    }
}

export async function generateConversationWithPredefinedUserResponses(params: {
    initialMessages: ChatMessage[],
    userResponses: string[],
}): Promise<ChatMessage[]> {
    const {initialMessages, userResponses} = params;
    const numRepetitions = params.userResponses.length || 0;
    let conversation: ChatMessage[] = [...initialMessages];
    let res = await getGroqResponseWithMessages({messages: conversation})
    for (let i = 0; i < numRepetitions; i++) {
        conversation = res.messages;
        res = await getGroqResponseWithMessages({prompt: userResponses[i], messages: conversation})
    }
    conversation = res.messages;
    return conversation
}

export async function  generateTestCases(taskAgentDefinitionPrompt: string, numTestCases: number) {
    const testCaseGeneratorAgentDefinitionPrompt = generateTestAgentPrompt(taskAgentDefinitionPrompt)

    const initialMessages = [generateUserMessage(testCaseGeneratorAgentDefinitionPrompt)]
    const userResponses = []
    for (let i = 0; i < numTestCases-1; i++) {
        userResponses.push("generate one more please")
    }
    const testCasesConversation = await generateConversationWithPredefinedUserResponses({initialMessages, userResponses});
    return (testCasesConversation.filter(m => m.role === 'assistant').map(m => (m.content)));
}
