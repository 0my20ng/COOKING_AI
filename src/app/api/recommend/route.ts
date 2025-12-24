import { NextRequest, NextResponse } from 'next/server';
import { geminiClient, GEMINI_MODELS } from '@/lib/gemini';

export async function POST(req: NextRequest) {
    try {
        const { ingredients } = await req.json();

        if (!ingredients || ingredients.length === 0) {
            return NextResponse.json({ error: 'Ingredients are required' }, { status: 400 });
        }

        // Specific model for Recommendation as requested
        const modelsToTry = ['gemini-2.5-flash'];

        let result = null;
        let usedModelName = '';

        // Try models sequentially (Key rotation is handled inside geminiClient)
        for (const modelName of modelsToTry) {
            try {
                const prompt = `
          User Ingredients: ${ingredients.join(', ')}
          
          Task:
          Recommend 3-5 distinct Korean dishes (or globally popular dishes) that can be best made using these ingredients. 
          Prioritize dishes where the user has the main ingredients.
          
          Output JSON format (Array of objects):
          [
            { 
              "name": "Dish Name (Korean)", 
              "reason": "Brief reason in Korean why this is recommended based on ingredients",
              "difficulty": "쉬움" | "보통" | "어려움",
              "time": "Estimated cooking time (e.g., 20분)"
            }
          ]
        `;
                result = await geminiClient.generateContent(prompt, { modelName });
                usedModelName = modelName;
                break; // Success!
            } catch (e) {
                console.warn(`Model ${modelName} failed with all keys:`, e);
                continue;
            }
        }

        if (!result) {
            // Fallback for demo/error
            return NextResponse.json({
                recommendations: [
                    { name: '김치찌개', reason: '추천 시스템이 일시적으로 바쁩니다.', difficulty: '쉬움', time: '20분' },
                    { name: '된장찌개', reason: '잠시 후 다시 시도해주세요.', difficulty: '보통', time: '30분' },
                    { name: '계란말이', reason: '기본적인 메뉴를 추천합니다.', difficulty: '쉬움', time: '10분' }
                ]
            });
        }
        const responseText = result.response.text();

        // Clean code block markers if present
        const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        let recommendations;
        try {
            recommendations = JSON.parse(jsonString);
        } catch (e) {
            console.error("Failed to parse recommendation JSON", responseText);
            return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
        }

        return NextResponse.json({ recommendations });

    } catch (error) {
        console.error('Recommendation API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
