require('dotenv').config();
const { generateInterviewReport } = require('./src/services/ai.service');

async function test() {
    console.log("Testing ai.service.js generateInterviewReport...");
    try {
        const result = await generateInterviewReport("", "I am a MERN stack developer", "MERN Stack Developer, React, Node.js");
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (err) {
        console.error("Test failed with exception:", err);
    }
}
test();
