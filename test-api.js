const dotenv = require('dotenv');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function test() {
    console.log("--- Test Script Started ---");

    // Check Gemini Keys
    const geminiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY_1;
    console.log("Gemini Key Present:", !!geminiKey);

    // Check Search Keys
    const searchKey = process.env.GOOGLE_SEARCH_API_KEY || process.env.GOOGLE_SEARCH_API_KEY_1;
    const searchCx = process.env.GOOGLE_SEARCH_CX || process.env.GOOGLE_SEARCH_CX_1;
    console.log("Search Key Present:", !!searchKey);
    console.log("Search CX Present:", !!searchCx);

    if (geminiKey) {
        try {
            const genAI = new GoogleGenerativeAI(geminiKey);
            // Try standard model first
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent("Hello");
            console.log("Gemini 1.5-flash Test Success:", !!result.response.text());
        } catch (e) {
            console.error("Gemini 1.5-flash Test Failed:", e.message);
        }

        // Try user's requested model name
        try {
            const genAI = new GoogleGenerativeAI(geminiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await model.generateContent("Hello");
            console.log("Gemini 2.5-flash Test Success:", !!result.response.text());
        } catch (e) {
            console.error("Gemini 2.5-flash Test Failed (Expected if beta name is wrong):", e.message);
        }
    }
}

test();
