import './App.css'
import axios from 'axios'
import {useState} from "react";

function App() {
    const [prompt, setPrompt] = useState(`You are a tool that receives a text and returns a list of the people mentioned in the text. your response should only be a list without any additional text. You should return a JSON in this exact format: {output:output-text}. Do not add any text to your response besides the JSON.`)
    const [apiResponse, setApiResponse] = useState<{testCases?:string,taskAgentOutput?:string,assessment?:string}>({})
    return (
        <>
            <div style={{
                display: "flex",
                gap: 10,
                width: "100%",
                border: "1px solid black",
                alignItems: "center",
                justifyContent: "center"
            }}>
                <TitledTextArea title={"Your Agent Definition Prompt"}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
                                value={prompt}
                />
                <button onClick={testPrompt}> {"Test it!"} </button>
                <TitledTextArea title={"Test Cases"} value={apiResponse?.testCases}/>
                <TitledTextArea title={"Agent output"} value={apiResponse?.taskAgentOutput}/>
                <TitledTextArea title={"Assessment"} value={apiResponse?.assessment}/>
            </div>
        </>
    )

    async function testPrompt() {
        const res = await axios.post("http://localhost:5000/prompt", {prompt: prompt, history: []})
        setApiResponse(res.data)
        console.log(res.data)

    }
}

// async function ping() {
//     const res = await axios.get("http://localhost:5000/ping")
//     console.log(res.data)
// }

function TitledTextArea({title, value, onChange}: { title?: string, value?: string,onChange?: Function }) {
    return (<div style={{border: "1px solid green"}}>
        <div>{title}</div>
        <textarea
            value={value}
            onChange={e => {
                if (onChange && typeof onChange === "function") {
                    onChange(e)
                }
                console.log(value)
            }}
            style={{resize: "none"}} rows={30}/>
    </div>)
}

export default App
