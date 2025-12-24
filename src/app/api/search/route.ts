import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { geminiClient, GEMINI_MODELS } from '@/lib/gemini';

// Initialize Search Keys (Check for common variations)
const SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY || process.env.GOOGLE_SEARCH_API_KEY_1;
const SEARCH_CX = process.env.GOOGLE_SEARCH_CX || process.env.GOOGLE_SEARCH_CX_1;

export async function POST(req: NextRequest) {
    console.log("--- Search API Request Start ---");
    console.log("SEARCH_API_KEY present:", !!SEARCH_API_KEY);
    console.log("SEARCH_CX present:", !!SEARCH_CX);

    try {
        const { ingredients, dish, mode } = await req.json();

        if (!ingredients || ingredients.length === 0) {
            console.warn("Search API: Missing ingredients");
            return NextResponse.json({ error: 'Ingredients are required' }, { status: 400 });
        }

        // [Fallback Mock Logic Definition]
        const runMockFallback = (reason: string) => {
            console.warn(`Running Mock Fallback due to: ${reason}`);
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

        // Select model based on mode
        // Fast (Default) -> gemini-2.5-flash
        // Detailed -> gemini-2.5-pro
        // Standard fallbacks added for reliability
        const selectedModel = mode === 'detailed' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
        const candidateModels = [selectedModel, 'gemini-2.0-flash-exp'];

        let result = null;
        let usedModelName = '';

        console.log(`[Search API] Mode: ${mode}, Dish: ${dish}, Model: ${selectedModel}`);

        // Step 1: Generate Search Plan with Gemini
        for (const modelName of candidateModels) {
            try {
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
                result = await geminiClient.generateContent(prompt, { modelName });
                usedModelName = modelName;
                break; // If successful, exit loop
            } catch (e: any) {
                console.warn(`Model ${modelName} failed:`, e.message);
                // Continue to next model
            }
        }

        // If Gemini completely fails, fallback to Mock
        if (!result) {
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
            const topResults = flattenedResults.slice(0, 3); // Analyze top 3

            const analysisPromises = topResults.map(async (res: any) => {
                try {
                    console.log(`[Detailed Mode] Scraping: ${res.link}`);
                    // Fetch page HTML with User-Agent to avoid blocking
                    const pageRes = await axios.get(res.link, {
                        timeout: 5000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                        }
                    });

                    console.log(`[Detailed Mode] Scrape success: ${res.link} (Status: ${pageRes.status})`);
                    const $ = cheerio.load(pageRes.data);

                    $('script').remove();
                    $('style').remove();
                    // Reduced from 10000 to 3000 to save tokens (TPM quota)
                    const bodyText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 3000);

                    const analysisPrompt = `
                Analyze this recipe text for ingredients.
                User's Current Ingredients: ${ingredients.join(', ')}
                Recipe Text Snippet: ${bodyText}
                Task:
                1. Identify ACTUAL ingredients mentioned that are NOT in the user's list.
                2. If the text is NOT a recipe, return "INVALID".
                Output JSON: { "valid": boolean, "actualMissingIngredients": ["ing1", "ing2"] }
              `;

                    // Detailed mode fallback sequence
                    const analysisModels = [usedModelName, 'gemini-2.0-flash-exp'];

                    let analysisRes;
                    let lastAnalysisError;

                    for (const mName of analysisModels) {
                        try {
                            console.log(`[Detailed Mode] Requesting AI Analysis for ${res.link} using model ${mName}`);
                            analysisRes = await geminiClient.generateContent(analysisPrompt, { modelName: mName });
                            break;
                        } catch (err: any) {
                            console.warn(`[Detailed Mode] Model ${mName} failed for analysis: ${err.message}`);
                            lastAnalysisError = err;
                        }
                    }

                    if (!analysisRes) throw lastAnalysisError;

                    const analysisText = analysisRes.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                    const analysisJson = JSON.parse(analysisText);

                    if (analysisJson.valid) {
                        console.log(`[Detailed Mode] Analysis valid for ${res.link}. Missing: ${analysisJson.actualMissingIngredients.join(', ')}`);
                        return { ...res, missingIngredients: analysisJson.actualMissingIngredients, analyzed: true };
                    } else {
                        console.warn(`[Detailed Mode] AI marked page as INVALID (not a recipe): ${res.link}`);
                        return null; // Still filter out if explicitly invalid
                    }
                } catch (e: any) {
                    console.error(`[Detailed Mode] FAILED for ${res.link}. Error: ${e.message}`);
                    // Return original result with inference as fallback so the list isn't empty
                    return { ...res, analyzed: false, analysisError: true };
                }
            });

            const analyzedResults = await Promise.all(analysisPromises);
            // Filter out nulls (invalid recipes)
            flattenedResults = analyzedResults.filter((r: any) => r !== null);
        }

        if (flattenedResults.length === 0) {
            return runMockFallback('No search results found');
        }

        return NextResponse.json({ results: flattenedResults });

    } catch (error) {
        console.error('Search Logic Error:', error);
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
