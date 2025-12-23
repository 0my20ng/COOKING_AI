import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(req: NextRequest) {
    try {
        const { ingredients } = await req.json();

        if (!ingredients || ingredients.length === 0) {
            return NextResponse.json({ error: 'Ingredients are required' }, { status: 400 });
        }

        if (!apiKey || !genAI) {
            // Fallback for demo without API key
            return NextResponse.json({
                recommendations: [
                    { name: '김치찌개', reason: '김치가 있어 만들기 좋습니다.', difficulty: '쉬움', time: '20분' },
                    { name: '된장찌개', reason: '기본적인 재료로 만들 수 있습니다.', difficulty: '보통', time: '30분' },
                    { name: '계란말이', reason: '계란이 없어도 추천해봅니다.', difficulty: '쉬움', time: '10분' }
                ]
            });
        }

        // Candidate models to try in order
        const candidateModels = [
            'gemini-3-flash-preview',
            'gemini-3-pro-preview',
        ];

        let result = null;
        let usedModelName = '';

        for (const modelName of candidateModels) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
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

                result = await model.generateContent(prompt);
                usedModelName = modelName;
                break;
            } catch (e) {
                console.warn(`Model ${modelName} failed:`, e);
                continue;
            }
        }

        if (!result) {
            throw new Error('All Gemini models failed');
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
