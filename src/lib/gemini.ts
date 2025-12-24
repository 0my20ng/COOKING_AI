import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';

interface GeminiConfig {
    modelName: string;
    generationConfig?: GenerationConfig;
}

export const GEMINI_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-2.0-flash-exp',
];

class GeminiClient {
    private apiKeys: string[] = [];
    private currentKeyIndex = 0;

    constructor() {
        this.loadApiKeys();
    }

    private loadApiKeys() {
        // 1. Load the primary key
        if (process.env.GOOGLE_API_KEY) {
            this.apiKeys.push(process.env.GOOGLE_API_KEY);
        }

        // 2. Load numbered keys (GOOGLE_API_KEY_1, GOOGLE_API_KEY_2, etc.)
        let i = 1;
        while (true) {
            const key = process.env[`GOOGLE_API_KEY_${i}`];
            if (key) {
                this.apiKeys.push(key);
            } else if (i > 10) {
                // Stop checking after 10 to prevent infinite loops if gaps exist, 
                // or just rely on the fact that they should be sequential.
                // Let's being robust: check up to 10.
                break;
            }
            i++;
        }

        // Remove duplicates
        this.apiKeys = [...new Set(this.apiKeys)];

        console.log(`[GeminiClient] Loaded ${this.apiKeys.length} API keys.`);
    }

    private getNextKey(): string | null {
        if (this.apiKeys.length === 0) return null;

        // Round-robin selection
        const key = this.apiKeys[this.currentKeyIndex];
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
        return key;
    }

    private getRandomKey(): string | null {
        if (this.apiKeys.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * this.apiKeys.length);
        return this.apiKeys[randomIndex];
    }

    async generateContent(prompt: string, config: GeminiConfig) {
        if (this.apiKeys.length === 0) {
            throw new Error('No Google API Keys found');
        }

        // Try up to the number of keys we have + 1 (for good measure, or just try all distinct keys)
        // A simple approach: Try loop through all keys once.
        const keysToTry = [...this.apiKeys]; // Copy
        // Shuffle if you want randomness, or just iterate. 
        // Let's iterate sequentially starting from current index to spread load if we keep instance alive?
        // Since this runs in Next.js Server Actions/Api routes, instance might be short-lived.
        // Random start is better for serverless to distribute load.

        // Shuffle keysToTry for this request ID
        for (let i = keysToTry.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [keysToTry[i], keysToTry[j]] = [keysToTry[j], keysToTry[i]];
        }

        let lastError: any = null;

        for (const key of keysToTry) {
            try {
                const genAI = new GoogleGenerativeAI(key);
                const model = genAI.getGenerativeModel({
                    model: config.modelName,
                    generationConfig: config.generationConfig
                });

                const result = await model.generateContent(prompt);
                return result; // Success!

            } catch (error: any) {
                console.warn(`[GeminiClient] Key ...${key.slice(-4)} failed for model ${config.modelName}. Error: ${error.message}`);
                lastError = error;
            }
        }

        console.error(`[GeminiClient] All ${keysToTry.length} keys failed for ${config.modelName}`);
        throw lastError || new Error('All API keys failed.');
    }

    // Also support exposing the model if needed, but wrapping generateContent is easier for rotation
    // implementing a getModel that returns a wrapper might be complex.
    // Instead, let's keep it simple: strict method for generating content.
}

// Export a singleton instance
export const geminiClient = new GeminiClient();
