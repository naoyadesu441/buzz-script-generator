'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useDiagnose } from '../DiagnoseContext';
import { StepIndicator } from '../StepIndicator';
import type { Tone } from '@/lib/persona/types';

const TONES: { value: Tone; label: string; desc: string }[] = [
  { value: '丁寧', label: '丁寧', desc: '誠実・信頼感・フォーマル寄り' },
  { value: 'フランク', label: 'フランク', desc: '親しみやすい・カジュアル・会話風' },
  { value: '煽り強め', label: '煽り強め', desc: '刺激的・危機感・強いフック' },
  { value: '淡々', label: '淡々', desc: 'データ重視・クール・論理的' },
];

export default function DiagnoseStep6() {
  const router = useRouter();
  const { tone, setTone, toInput } = useDiagnose();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function generate() {
    setLoading(true);
    setError('');
    try {
      const input = toInput();
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg || '生成に失敗しました');
      }
      const { id } = await res.json();
      router.push(`/result/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成に失敗しました');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-12 max-w-xl mx-auto">
      <StepIndicator current={6} total={6} />
      <h1 className="text-2xl font-bold text-text-primary mb-2 mt-6">投稿のトーン</h1>
      <p className="text-text-secondary mb-8">生成するテーマの文体・温度感を選択</p>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {TONES.map(({ value, label, desc }) => (
          <button
            key={value}
            onClick={() => setTone(value)}
            className={`glass-card p-4 text-left transition-all ${
              tone === value
                ? 'border-neon-purple shadow-neon-purple'
                : 'hover:border-neon-purple/50'
            }`}
          >
            <p className={`font-bold mb-1 ${tone === value ? 'text-neon-purple' : 'text-text-primary'}`}>{label}</p>
            <p className="text-xs text-text-muted">{desc}</p>
          </button>
        ))}
      </div>

      {error && (
        <div className="glass-card border-neon-red/50 p-4 mb-6 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-12 h-12 border-4 border-neon-purple border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-text-secondary">ペルソナとテーマを生成中...</p>
          <p className="text-xs text-text-muted mt-2">約30秒かかります</p>
        </div>
      ) : (
        <div className="flex gap-3">
          <button onClick={() => router.back()} className="flex-1 glass-card py-3 text-text-secondary">← 戻る</button>
          <button onClick={generate} className="flex-2 neon-button flex-1 text-lg py-4">生成する ✨</button>
        </div>
      )}
    </main>
  );
}
