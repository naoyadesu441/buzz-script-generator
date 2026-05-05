'use client';

import { useRouter } from 'next/navigation';
import { useDiagnose } from '../DiagnoseContext';
import { StepIndicator } from '../StepIndicator';

export default function DiagnoseStep3() {
  const router = useRouter();
  const { targetHint, setTargetHint } = useDiagnose();

  return (
    <main className="min-h-screen px-6 py-12 max-w-xl mx-auto">
      <StepIndicator current={3} total={6} />
      <h1 className="text-2xl font-bold text-text-primary mb-2 mt-6">ターゲットの属性</h1>
      <p className="text-text-secondary mb-2">想定するターゲットのヒントを入力（任意）</p>
      <p className="text-xs text-text-muted mb-8">年代・性別・職業・状況など、思い当たることを自由に</p>

      <textarea
        rows={4}
        placeholder="例：30代会社員男性、副業に興味があるが何から始めればいいか分からない人"
        value={targetHint}
        onChange={(e) => setTargetHint(e.target.value)}
        className="input-field resize-none mb-8"
      />

      <div className="flex gap-3">
        <button onClick={() => router.back()} className="flex-1 glass-card py-3 text-text-secondary">← 戻る</button>
        <button onClick={() => router.push('/diagnose/step4')} className="flex-1 neon-button">次へ →</button>
      </div>
    </main>
  );
}
