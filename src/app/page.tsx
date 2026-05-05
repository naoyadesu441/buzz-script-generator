import Link from 'next/link';

const PROBLEMS = [
  { problem: '「何を発信していいか分からない」', solution: 'ペルソナの深層から、共感呼ぶテーマを抽出' },
  { problem: '「ターゲットがぼんやりしている」', solution: '5階層で具体化、心の声で言語化' },
  { problem: '「ChatGPTで作っても浅い結果」', solution: '一次情報を取り込んで解像度を上げる設計' },
  { problem: '「投稿ネタが続かない」', solution: '50本のテーマを生成して持続、毎日の投稿が楽になる' },
];

const STEPS = [
  { n: 1, title: 'ジャンル・ポジションを入力', desc: '副業全般・ダイエット・恋愛・投資など、発信したい領域と自分の強みを伝える' },
  { n: 2, title: '（任意）一次情報URLを追加', desc: 'Yahoo!知恵袋・教えて!gooのURLを最大5件まで。解像度がさらに上がる' },
  { n: 3, title: '生成・保存・シェア', desc: 'ペルソナ+テーマ50本が自動生成。履歴に保存され、シェアカードも作成可能' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative px-6 pt-20 pb-16 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-neon-purple/20 text-neon-purple border border-neon-purple/30 mb-6">
            AI ペルソナ × バズ投稿テーマ生成
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold mb-4 leading-tight">
            <span className="neon-text">バズスクリプト</span>
            <br />
            ジェネレーター
          </h1>
          <p className="text-lg text-text-secondary mb-8 leading-relaxed">
            ジャンルを選ぶだけで<br />
            5階層ペルソナ＋投稿テーマ50本を自動生成。<br />
            ターゲットの心に刺さる発信戦略を構築。
          </p>
          <Link href="/login" className="inline-block neon-button text-lg px-8 py-4">
            無料で診断を始める
          </Link>
          <p className="text-xs text-text-muted mt-4">Googleアカウントで1クリック登録</p>
        </div>
      </section>

      {/* Problems */}
      <section className="px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-center text-2xl font-bold mb-8 text-text-primary">こんな悩みを解決</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PROBLEMS.map(({ problem, solution }) => (
              <div key={problem} className="glass-card p-5">
                <p className="text-sm text-neon-purple font-medium mb-2">こんな悩み</p>
                <p className="font-bold text-text-primary mb-3">{problem}</p>
                <p className="text-xs text-neon-cyan">→ ツールでできること</p>
                <p className="text-sm text-text-secondary mt-1">{solution}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-center text-2xl font-bold mb-8 text-text-primary">使い方は3ステップ</h2>
          <div className="space-y-4">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="glass-card p-5 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-neon-purple flex-shrink-0 flex items-center justify-center font-bold text-white">
                  {n}
                </div>
                <div>
                  <p className="font-bold text-text-primary mb-1">{title}</p>
                  <p className="text-sm text-text-secondary">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 text-center">
        <Link href="/login" className="inline-block neon-button text-lg px-8 py-4">
          今すぐ無料で試す
        </Link>
      </section>

      {/* Footer */}
      <footer className="text-center text-xs text-text-muted py-8 border-t border-border/30">
        <div className="space-x-4">
          <Link href="/terms" className="hover:text-text-secondary">利用規約</Link>
          <Link href="/privacy" className="hover:text-text-secondary">プライバシーポリシー</Link>
        </div>
        <p className="mt-2">© 2024 バズスクリプトジェネレーター</p>
      </footer>
    </main>
  );
}
