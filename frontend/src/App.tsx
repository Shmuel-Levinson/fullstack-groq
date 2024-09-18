import './App.css'
import axios from 'axios'
import {useState} from "react";
import {ExampleTaskAgentDefinitionPrompts} from "./example-prompts.ts";

const emptyTestingResults = {input: "", output: "", evaluation: {}}

interface IEvaluation {
    accuracy?: number
    clarity?: number
    completeness?: number
    explanation?: string
    overall_score?: number;
    relevance?: number;
}

interface TestingResult {
    input: string;
    output: string;
    evaluation: IEvaluation
}

function EvalTriplet({input, output, evaluation}: { input: string, output: string, evaluation: IEvaluation }) {
    return <div style={{display: "flex", flexDirection: "row", gap: "10px", justifyContent: "space-evenly"}}>
        <div style={{flex: 1}}><TitledTextArea title={"Test Case"} value={input}/></div>
        <div style={{flex: 1}}>
            <div style={{fontWeight: "bold"}}>Output</div>
            <div title={"Agent output"}>{output}</div>
        </div>
        <div style={{flex: 1}}>

            <div style={{fontWeight: "bold"}}>Evaluation</div>
            <div title={"Assessment"}>{evaluation.explanation}</div>
        </div>
    </div>;
}

function App() {
    const [taskAgentDefinitionPrompt, setTaskAgentDefinitionPrompt] = useState(ExampleTaskAgentDefinitionPrompts.detailsExtractor)
    const [testingResults, setTestingResults] = useState<TestingResult[]>([emptyTestingResults])
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
                <button onClick={() => testAndEvaluate({
                    taskAgentDefinitionPrompt: taskAgentDefinitionPrompt,
                    // testCases: ["Moon is big. John is fat", "Mark will meet marry at 2pm"],
                    numTestCases: 1
                })}> {"Test it!"} </button>
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 30
                }}>{testingResults.map((testingResult, i) => {
                    return <EvalTriplet key={`eval_triplet_${i}`} input={testingResult.input}
                                        output={testingResult.output}
                                        evaluation={testingResult.evaluation}/>
                })}</div>
            </div>

        </>
    )

    async function testAndEvaluate({taskAgentDefinitionPrompt, testCases, numTestCases = 2}: {
        taskAgentDefinitionPrompt: string,
        testCases?: string[]
        numTestCases?: number
    }) {
        setTestingResults([emptyTestingResults])
        const data: { taskAgentDefinitionPrompt: string, numTestCases: number, testCases?: string[] } = {
            taskAgentDefinitionPrompt: taskAgentDefinitionPrompt,
            numTestCases: numTestCases

        }
        if (testCases) {
            data.testCases = testCases
            data.numTestCases = testCases.length
        }
        const res = await axios.post("http://localhost:5000/testAndEvaluate", data)
        const testingResults: TestingResult[] = res.data.map((d: {
            input: string,
            output: string,
            evaluation: string
        }) => {
            return ({
                input: d.input,
                output: d.output,
                evaluation: JSON.parse(d.evaluation)
            })
        })
        setTestingResults(testingResults)
        console.log(res.data)
        const evaluations = res.data.map((d: { evaluation: string }) => {
            try {
                return JSON.parse(d.evaluation)
            } catch {
                console.warn("Could not parse evaluation object :(")
                return d.evaluation
            }

        })
        console.log(evaluations)

    }
}

// async function ping() {
//     const res = await axios.get("http://localhost:5000/ping")
//     console.log(res.data)
// }

function TitledTextArea({title, value, onChange, rows = 15}: {
    title?: string,
    value?: string,
    onChange?: Function,
    rows?: number
}) {
    return (<div>
        <div>{title}</div>
        <textarea
            value={value}
            onChange={e => {
                if (onChange && typeof onChange === "function") {
                    onChange(e)
                }
                console.log(value)
            }}
            style={{resize: "none", width: "90%", margin: 0}} rows={rows}/>
    </div>)
}

export default App
