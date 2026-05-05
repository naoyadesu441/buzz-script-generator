'use client';

import { useRouter } from 'next/navigation';
import { useDiagnose } from '../DiagnoseContext';
import { StepIndicator } from '../StepIndicator';

const DIRECTIONS = ['コンテンツ販売', '物販', 'スキルシェア', 'アフィリエイト', 'コーチング・コンサル', 'まだ決まっていない'];

export default function DiagnoseStep4() {
  const router = useRouter();
  const { productDirection, setProductDirection } = useDiagnose();

  return (
    <main className="min-h-screen px-6 py-12 max-w-xl mx-auto">
      <StepIndicator current={4} total={6} />
      <h1 className="text-2xl font-bold text-text-primary mb-2 mt-6">商品・サービスの方向性</h1>
      <p className="text-text-secondary mb-8">どんな商品・サービスで稼ぐか（任意）</p>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {DIRECTIONS.map((d) => (
          <button
            key={d}
            onClick={() => setProductDirection(productDirection === d ? '' : d)}
            className={`glass-card p-3 text-sm text-center font-medium transition-all ${
              productDirection === d
                ? 'border-neon-purple text-neon-purple shadow-neon-purple'
                : 'text-text-secondary hover:border-neon-purple/50'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={() => router.back()} className="flex-1 glass-card py-3 text-text-secondary">← 戻る</button>
        <button onClick={() => router.push('/diagnose/step5')} className="flex-1 neon-button">次へ →</button>
      </div>
    </main>
  );
}
