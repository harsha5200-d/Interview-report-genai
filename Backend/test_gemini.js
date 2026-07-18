require('dotenv').config();
const { GoogleGenAI } = require("@google/genai");

async function test() {
    console.log("Testing API Key:", process.env.GOOGLE_GENAI_API_KEY ? "Loaded" : "Missing");
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Say hello!"
        });
        console.log("SUCCESS:", response.text);
    } catch (err) {
        console.error("ERROR from Google Gemini:", err.message || err);
    }
}
test();
