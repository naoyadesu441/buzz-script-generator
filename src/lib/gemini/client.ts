import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GenerationResult } from '@/lib/persona/types';

export async function generatePersonaAndThemes(prompt: string): Promise<GenerationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.8,
      maxOutputTokens: 8192,
    },
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const parsed = JSON.parse(text) as { persona: GenerationResult['persona']; themes: GenerationResult['themes'] };

  return {
    persona: parsed.persona,
    themes: parsed.themes,
    generatedAt: new Date().toISOString(),
  };
}
