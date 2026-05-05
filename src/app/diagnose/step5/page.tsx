'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useDiagnose } from '../DiagnoseContext';
import { StepIndicator } from '../StepIndicator';

export default function DiagnoseStep5() {
  const router = useRouter();
  const { referenceUrls, setReferenceUrls } = useDiagnose();
  const [input, setInput] = useState('');

  function addUrl() {
    const trimmed = input.trim();
    if (!trimmed || referenceUrls.length >= 5) return;
    if (!trimmed.startsWith('http')) return;
    setReferenceUrls([...referenceUrls, trimmed]);
    setInput('');
  }

  function removeUrl(i: number) {
    setReferenceUrls(referenceUrls.filter((_, idx) => idx !== i));
  }

  return (
    <main className="min-h-screen px-6 py-12 max-w-xl mx-auto">
      <StepIndicator current={5} total={6} />
      <h1 className="text-2xl font-bold text-text-primary mb-2 mt-6">一次情報URL（任意）</h1>
      <p className="text-text-secondary mb-2">Yahoo!知恵袋・教えて!gooのURLを最大5件まで</p>
      <p className="text-xs text-text-muted mb-8">ターゲットの実際の悩みを取り込んで解像度が上がります</p>

      <div className="flex gap-2 mb-4">
        <input
          type="url"
          placeholder="https://detail.chiebukuro.yahoo.co.jp/..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addUrl()}
          className="input-field flex-1"
          disabled={referenceUrls.length >= 5}
        />
        <button
          onClick={addUrl}
          disabled={referenceUrls.length >= 5 || !input.trim()}
          className="neon-button px-4 disabled:opacity-40"
        >
          追加
        </button>
      </div>

      <div className="space-y-2 mb-8">
        {referenceUrls.map((url, i) => (
          <div key={i} className="glass-card px-4 py-3 flex items-center gap-3">
            <span className="text-xs text-neon-cyan flex-shrink-0">{i + 1}</span>
            <span className="text-sm text-text-secondary truncate flex-1">{url}</span>
            <button onClick={() => removeUrl(i)} className="text-neon-red text-xs hover:text-red-300">削除</button>
          </div>
        ))}
        {referenceUrls.length === 0 && (
          <p className="text-center text-sm text-text-muted py-4">URLを追加すると解像度が上がります（スキップ可）</p>
        )}
      </div>

      <div className="flex gap-3">
        <button onClick={() => router.back()} className="flex-1 glass-card py-3 text-text-secondary">← 戻る</button>
        <button onClick={() => router.push('/diagnose/step6')} className="flex-1 neon-button">次へ →</button>
      </div>
    </main>
  );
}
