'use client';

import { useRouter } from 'next/navigation';
import { useDiagnose } from './DiagnoseContext';

const GENRES = ['副業全般', 'ダイエット', '恋愛', '投資', '子育て', 'その他'];

export default function DiagnoseStep1() {
  const router = useRouter();
  const { genre, setGenre } = useDiagnose();

  return (
    <main className="min-h-screen px-6 py-12 max-w-xl mx-auto">
      <StepIndicator current={1} total={6} />
      <h1 className="text-2xl font-bold text-text-primary mb-2 mt-6">ジャンルを選択</h1>
      <p className="text-text-secondary mb-8">発信したい分野を選んでください（必須）</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {GENRES.map((g) => (
          <button
            key={g}
            onClick={() => setGenre(g)}
            className={`glass-card p-4 text-center font-medium transition-all ${
              genre === g
                ? 'border-neon-purple text-neon-purple shadow-neon-purple'
                : 'text-text-secondary hover:border-neon-purple/50'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {genre === 'その他' && (
        <input
          type="text"
          placeholder="例: ハンドメイド販売"
          className="input-field mb-6"
          onChange={(e) => setGenre(e.target.value || 'その他')}
        />
      )}

      <button
        onClick={() => router.push('/diagnose/step2')}
        disabled={!genre}
        className="w-full neon-button"
      >
        次へ →
      </button>
    </main>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <div
          key={n}
          className={`h-1.5 flex-1 rounded-full transition-all ${
            n <= current ? 'bg-neon-purple' : 'bg-border'
          }`}
        />
      ))}
      <span className="text-xs text-text-muted ml-1">{current}/{total}</span>
    </div>
  );
}
