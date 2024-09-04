export function generateTaskAgentPrompt(taskAgentPrompt: string, testCases: []): string {
    return `
    ${taskAgentPrompt}\n\n
    These are the test cases:\n
    ${testCases.map((testCase) => {
        return `* "${testCase}"`
    }).join("\n\n")}
    `
}


export function generateTestAgentPrompt(taskAgentPrompt: string): string {
    return `
    You are a test case generator version ${Math.floor(1000*Math.random())}
Generate 1 test case for a Task AI whose prompt was: 

"${taskAgentPrompt}". 

Return a JSON with a single field that contains test cases case. Don't include an expected output.
Use this exact json format: 
{"testCases": ["this is test case 1"]}
Don't add anything else to your response besides the JSON.
    `
}

export function generateValidationAgentPrompt(taskAgentPrompt: string, input: string, output: string): string {
    return `
    A Task Agent AI was prompted with this: "${taskAgentPrompt}".
    It was given this input: "${input}" and returned this output: "${output}".
    Your response should be only a brief assessment of the output's correctness.
    Use this exact json format: 
    {"assessment": "This is a brief assessment of the output's correctness", "score": 0 - 1}
    `
}