const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// 1. .env.local 파일 읽기
console.log("🔍 Reading .env.local...");
let apiKey = '';
try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        const lines = envConfig.split('\n');
        for (const line of lines) {
            if (line.startsWith('GOOGLE_API_KEY=')) {
                apiKey = line.split('=')[1].trim();
                break;
            }
        }
    } else {
        console.error("❌ .env.local file not found at:", envPath);
        process.exit(1);
    }
} catch (e) {
    console.error("❌ Error reading .env.local:", e.message);
    process.exit(1);
}

if (!apiKey) {
    console.error("❌ GOOGLE_API_KEY could not be found in .env.local");
    process.exit(1);
}

// 2. 키 정보 출력 (보안을 위해 일부 마스킹)
const maskedKey = apiKey.substring(0, 5) + "..." + apiKey.substring(apiKey.length - 5);
console.log(`🔑 Key found: ${maskedKey} (Length: ${apiKey.length})`);

// 3. API 호출 테스트
async function testConnection() {
    console.log("📡 Testing Connection to Gemini API...");
    const genAI = new GoogleGenerativeAI(apiKey);

    // 테스트할 모델 목록
    const modelsToTry = ["gemini-1.5-flash", "gemini-pro"];

    for (const modelName of modelsToTry) {
        console.log(`\n👉 Trying model: ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello, are you working?");
            const response = result.response.text();
            console.log(`✅ SUCCESS! Model ${modelName} responded:`);
            console.log(`   "${response.trim()}"`);
            return; // 성공하면 종료
        } catch (e) {
            console.error(`❌ FAILED (${modelName}):`);
            console.error(`   Error Message: ${e.message}`);
            if (e.message.includes("404")) {
                console.error("   (Tip: 404 means the Key is valid but the Project doesn't have access to this Model, OR the API Service is disabled.)");
            }
            if (e.message.includes("403")) {
                console.error("   (Tip: 403 means the Key is invalid or blocked.)");
            }
        }
    }
    console.log("\n❌ All connection attempts failed.");
}

testConnection();
