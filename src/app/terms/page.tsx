import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="min-h-screen px-6 py-12 max-w-2xl mx-auto">
      <Link href="/" className="text-text-muted text-sm hover:text-text-secondary mb-8 inline-block">← トップに戻る</Link>
      <h1 className="text-2xl font-bold text-text-primary mb-8">利用規約</h1>
      <div className="space-y-6 text-sm text-text-secondary">
        <section>
          <h2 className="font-bold text-text-primary mb-2">第1条（サービスの目的）</h2>
          <p>本サービス「バズスクリプトジェネレーター」は、AIを活用してSNS発信のペルソナ分析と投稿テーマ提案を行うツールです。</p>
        </section>
        <section>
          <h2 className="font-bold text-text-primary mb-2">第2条（免責事項）</h2>
          <p>本ツールが生成するペルソナ・投稿テーマはAIによる仮説提案であり、実際の発信・販売活動の成果を保証するものではありません。投資・医療・法律に関する判断は専門家にご相談ください。</p>
        </section>
        <section>
          <h2 className="font-bold text-text-primary mb-2">第3条（禁止事項）</h2>
          <p>本サービスを利用して、薬機法・景表法・特商法に違反するコンテンツを作成・配布することを禁止します。差別的・侮蔑的な表現の生成目的での利用も禁止します。</p>
        </section>
        <section>
          <h2 className="font-bold text-text-primary mb-2">第4条（変更・終了）</h2>
          <p>運営者は事前通知なく本サービスの内容変更または終了をすることができます。</p>
        </section>
      </div>
    </main>
  );
}
