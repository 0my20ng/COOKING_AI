import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';
import axios from 'axios';

// Initialize SDK only if key is present
const apiKey = process.env.GOOGLE_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const SEARCH_CX = process.env.GOOGLE_SEARCH_CX;

export async function POST(req: NextRequest) {
    // 🔍 [DEBUG 로그] API 키가 잘 들어왔는지 확인합니다. 터미널을 봐주세요.
    console.log("==============================================");
    console.log("🔍 API KEY DEBUGGING");
    console.log("GOOGLE_API_KEY Loaded:", !!apiKey);
    console.log("GOOGLE_API_KEY Length:", apiKey ? apiKey.length : 0);
    console.log("GOOGLE_SEARCH_API_KEY Loaded:", !!SEARCH_API_KEY);
    console.log("GOOGLE_SEARCH_CX Loaded:", !!SEARCH_CX);
    console.log("==============================================");

    try {
        const { ingredients, dish, mode } = await req.json();

        if (!ingredients || ingredients.length === 0) {
            return NextResponse.json({ error: 'Ingredients are required' }, { status: 400 });
        }

        // [Fallback Mock Logic Definition]
        const runMockFallback = (reason: string) => {
            console.warn(`Running Mock Fallback due to: ${reason}`);
            // Create plausible items based on basic ingredients
            const mockItems = [
                {
                    title: `[예시] ${dish || '김치찌개'} 황금레시피 (API 키 확인 필요)`,
                    link: 'https://www.10000recipe.com/',
                    snippet: `API 연동에 문제가 있어 예시 결과를 보여드립니다. .env.local 설정을 확인해주세요. (${reason})`,
                    source: '만개의레시피',
                    missingIngredients: ['예시 재료 1', '예시 재료 2'],
                    thumbnail: 'https://via.placeholder.com/150/orange/white?text=MockResult'
                },
                {
                    title: `[예시] 초간단 ${ingredients[0] || '재료'} 활용 요리`,
                    link: 'https://m.blog.naver.com/',
                    snippet: '냉장고 파먹기 딱 좋은 레시피입니다. 이 결과는 실제 검색 결과가 아닙니다.',
                    source: '네이버 블로그',
                    missingIngredients: ['추가 재료 A'],
                }
            ];
            return NextResponse.json({ results: mockItems });
        };

        // Check configuration
        if (!apiKey || !genAI) {
            return runMockFallback('GOOGLE_API_KEY is missing');
        }

        // Candidate models to try in order
        const candidateModels = [
            'gemini-3-flash-preview',
            'gemini-3-pro-preview',
        ];

        let model = null;
        let result = null;
        let usedModelName = '';

        // Step 1: Generate Search Plan with Gemini
        // Try models sequentially
        for (const modelName of candidateModels) {
            try {
                const candidate = genAI.getGenerativeModel({ model: modelName });
                const prompt = `
          User Ingredients: ${ingredients.join(', ')}
          Target Dish: ${dish || 'Any dish matching ingredients'}
          
          Task:
          1. Recommend 3 specific search queries for finding recipes (preferably Naver Blog or Korean recipe sites).
          2. For each query, accurately INFER the additional ingredients that are typically required for this dish but are NOT in the User Ingredients list.
          
          Output JSON format (Array of objects):
          [
            { "query": "korean query string", "inferredMissingIngredients": ["ingredient1", "ingredient2"] }
          ]
        `;
                result = await candidate.generateContent(prompt);
                usedModelName = modelName;
                model = candidate; // Keep the working model for the second step (analysis)
                break; // If successful, exit loop
            } catch (e: any) {
                console.warn(`Model ${modelName} failed:`, e.message);
                // Continue to next model
            }
        }

        // If Gemini completely fails, fallback to Mock
        if (!result || !model) {
            return runMockFallback('All Gemini models failed (404/Error). Check API Key permissions.');
        }

        console.log(`Using Gemini Model: ${usedModelName}`);

        const text = result.response.text();
        // Clean JSON markdown if present
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        let plan;
        try {
            plan = JSON.parse(jsonString);
        } catch (e) {
            console.error("JSON Parse Error", text);
            return runMockFallback('AI Response JSON Parse Failed');
        }

        // Step 2: Google Search Execution
        // If Search Key is missing, we can't search. Fallback to mock BUT we could potentially return just the AI inferred queries if we wanted.
        // For now, full mock fallback is safer UI-wise.
        if (!SEARCH_API_KEY || !SEARCH_CX) {
            return runMockFallback('Google Search API Keys missing');
        }

        const searchPromises = plan.map(async (item: any) => {
            try {
                const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${SEARCH_API_KEY}&cx=${SEARCH_CX}&q=${encodeURIComponent(item.query)}&num=2`;
                const searchRes = await fetch(searchUrl);
                const searchData = await searchRes.json();

                if (!searchData.items) return [];

                return searchData.items.map((result: any) => ({
                    title: result.title,
                    link: result.link,
                    snippet: result.snippet,
                    thumbnail: result.pagemap?.cse_thumbnail?.[0]?.src || result.pagemap?.cse_image?.[0]?.src,
                    source: result.displayLink,
                    queryUsed: item.query,
                    missingIngredients: item.inferredMissingIngredients // Default to inference
                }));
            } catch (e) {
                console.error('Search error', e);
                return [];
            }
        });

        const nestedResults = await Promise.all(searchPromises);
        let flattenedResults = nestedResults.flat();

        // Step 3: [Detailed Mode Logic] - Scrape and Analyze
        if (mode === 'detailed' && flattenedResults.length > 0) {
            const topResults = flattenedResults.slice(0, 3);

            const analysisPromises = topResults.map(async (res: any) => {
                try {
                    // Fetch page HTML
                    const pageRes = await axios.get(res.link, { timeout: 5000 });
                    const $ = cheerio.load(pageRes.data);

                    $('script').remove();
                    $('style').remove();
                    const bodyText = $('body').text().replace(/\s+/g, ' ').substring(0, 10000);

                    const analysisPrompt = `
                Analyze this recipe text.
                User's Current Ingredients: ${ingredients.join(', ')}
                Recipe Text: ${bodyText}
                Task:
                1. Output a list of ACTUAL ingredients mentioned in the text that are MISSING from the user's list.
                2. If the text is NOT a recipe (e.g. login page, spam), return "INVALID".
                Output JSON: { "valid": boolean, "actualMissingIngredients": ["ing1", "ing2"] }
              `;

                    const analysisRes = await model!.generateContent(analysisPrompt);
                    const analysisJson = JSON.parse(analysisRes.response.text().replace(/```json/g, '').replace(/```/g, '').trim());

                    if (analysisJson.valid) {
                        return { ...res, missingIngredients: analysisJson.actualMissingIngredients, analyzed: true };
                    } else {
                        return null;
                    }
                } catch (e) {
                    console.error('Scraping/Analysis failed for', res.link, e);
                    return { ...res, analyzed: false, analysisError: true };
                }
            });

            const analyzedResults = await Promise.all(analysisPromises);
            flattenedResults = analyzedResults.filter(r => r !== null);
        }

        if (flattenedResults.length === 0) {
            return runMockFallback('No search results found');
        }

        return NextResponse.json({ results: flattenedResults });

    } catch (error) {
        console.error('Search Logic Error:', error);
        // Even global catch falls back to mock to keep UI alive
        return NextResponse.json({
            results: [
                {
                    title: '오류가 발생했지만 결과 예시를 보여드립니다',
                    snippet: '서버 에러가 발생하여 실제 결과를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.',
                    link: '#',
                    source: 'System',
                    missingIngredients: []
                }
            ]
        });
    }
}
