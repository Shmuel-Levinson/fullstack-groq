import './App.css'
import axios from 'axios'
import {useState} from "react";
import {ExampleTaskAgentDefinitionPrompts} from "./example-prompts.ts";
const emptyTestingResults = {input:"",output:"",evaluation:""}

function EvalTriplet({input, output, evaluation}: { input: string, output: string, evaluation: string }) {
    return <div style={{display: "flex", flexDirection: "row", gap: "10px"}}>
        <TitledTextArea title={"Test Case"} value={input}/>
        <TitledTextArea title={"Agent output"} value={output}/>
        <TitledTextArea title={"Assessment"} value={evaluation}/>
    </div>;
}

function App() {
    const [taskAgentDefinitionPrompt, setTaskAgentDefinitionPrompt] = useState(ExampleTaskAgentDefinitionPrompts.detailsExtractor)
    const [testingResults, setTestingResults] = useState<{input:string,output:string,evaluation:string}[]>([emptyTestingResults])
    return (
        <>
            <div style={{
                // display: "flex",
                gap: 10,
                width: "100%",
                // border: "1px solid black",
                alignItems: "center",
                justifyContent: "center"
            }}>
                <TitledTextArea title={"Your Agent Definition Prompt"}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTaskAgentDefinitionPrompt(e.target.value)}
                                value={taskAgentDefinitionPrompt}

                />
                <button onClick={testAndEvaluate}> {"Test it!"} </button>
                <div style={{display:"flex",flexDirection:"column", gap:30}}>{testingResults.map((testingResult, i) => {
                    return <EvalTriplet key={`eval_triplet_${i}`} input={testingResult.input}
                                        output={testingResult.output}
                                        evaluation={testingResult.evaluation}/>
                })}</div>
            </div>

        </>
    )

    async function testAndEvaluate() {
        setTestingResults([emptyTestingResults])
        const res = await axios.post("http://localhost:5000/testAndEvaluate", {
            taskAgentDefinitionPrompt: taskAgentDefinitionPrompt,
            numTestCases: 3
        })
        setTestingResults(res.data)
        console.log(res.data)

    }
}

// async function ping() {
//     const res = await axios.get("http://localhost:5000/ping")
//     console.log(res.data)
// }

function TitledTextArea({title, value, onChange, rows = 15}: { title?: string, value?: string,onChange?: Function, rows?: number }) {
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
            style={{resize: "none", width:"100%"}} rows={rows} cols={50}/>
    </div>)
}

export default App
