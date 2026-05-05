'use client';

import { useRouter } from 'next/navigation';
import { useDiagnose } from '../DiagnoseContext';
import { StepIndicator } from '../StepIndicator';

export default function DiagnoseStep2() {
  const router = useRouter();
  const { position, setPosition } = useDiagnose();

  return (
    <main className="min-h-screen px-6 py-12 max-w-xl mx-auto">
      <StepIndicator current={2} total={6} />
      <h1 className="text-2xl font-bold text-text-primary mb-2 mt-6">自分のポジション</h1>
      <p className="text-text-secondary mb-2">発信者としての強みや背景を入力（任意）</p>
      <p className="text-xs text-text-muted mb-8">例：製造業エンジニアから副業で稼げるようになった人</p>

      <textarea
        rows={4}
        placeholder="例：元公務員で脱サラして3年で月収50万を達成。同じ境遇の人に向けて発信したい。"
        value={position}
        onChange={(e) => setPosition(e.target.value)}
        className="input-field resize-none mb-8"
      />

      <div className="flex gap-3">
        <button onClick={() => router.back()} className="flex-1 glass-card py-3 text-text-secondary">← 戻る</button>
        <button onClick={() => router.push('/diagnose/step3')} className="flex-2 neon-button flex-1">次へ →</button>
      </div>
    </main>
  );
}
