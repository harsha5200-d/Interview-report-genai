require('dotenv').config();
const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

async function test() {
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });
    const schema = zodToJsonSchema(z.object({ answer: z.string() }), { target: "openApi3" });
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Say hello!",
            config: { responseMimeType: "application/json", responseJsonSchema: schema }
        });
        console.log("SUCCESS:", response.text);
    } catch (err) {
        console.error("ERROR:", err.message || err);
    }
}
test();
