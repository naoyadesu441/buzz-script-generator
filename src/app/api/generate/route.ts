import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generatePersonaAndThemes } from '@/lib/gemini/client';
import { buildPersonaPrompt } from '@/lib/gemini/prompts';
import { validateText } from '@/lib/persona/validator';
import type { GenerationInput } from '@/lib/persona/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const input: GenerationInput = await request.json();
  if (!input.genre) return NextResponse.json({ error: 'genre is required' }, { status: 400 });

  // URLから一次情報を取得
  let referenceContent = '';
  if (input.referenceUrls?.length) {
    const fetched = await Promise.allSettled(
      input.referenceUrls.map(async (url) => {
        const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
        const html = await r.text();
        // 本文テキストだけ抽出（簡易）
        return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 2000);
      })
    );
    referenceContent = fetched
      .filter((r) => r.status === 'fulfilled')
      .map((r, i) => `[参照${i + 1}] ${(r as PromiseFulfilledResult<string>).value}`)
      .join('\n\n');
  }

  const prompt = buildPersonaPrompt(input, referenceContent);
  const result = await generatePersonaAndThemes(prompt);

  // NGワードチェック
  const allText = JSON.stringify(result);
  const validation = validateText(allText);
  if (validation.hasViolation) {
    console.warn('NGワード検出:', validation.violations);
  }

  // Supabaseに保存
  const { data, error } = await supabase
    .from('persona_results')
    .insert({
      user_id: user.id,
      genre: input.genre,
      input_data: input,
      result_data: result,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: data.id, warnings: validation.violations });
}
