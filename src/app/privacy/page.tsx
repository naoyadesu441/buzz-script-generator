import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-6 py-12 max-w-2xl mx-auto">
      <Link href="/" className="text-text-muted text-sm hover:text-text-secondary mb-8 inline-block">← トップに戻る</Link>
      <h1 className="text-2xl font-bold text-text-primary mb-8">プライバシーポリシー</h1>
      <div className="space-y-6 text-sm text-text-secondary">
        <section>
          <h2 className="font-bold text-text-primary mb-2">取得する情報</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Googleアカウントの基本情報（名前・メールアドレス）</li>
            <li>ユーザーが入力したジャンル・ポジション等の診断情報</li>
            <li>生成されたペルソナ・テーマデータ（履歴として保存）</li>
          </ul>
        </section>
        <section>
          <h2 className="font-bold text-text-primary mb-2">利用目的</h2>
          <p>取得した情報はサービス提供（認証・履歴保存）のみに使用します。第三者への提供・販売は行いません。</p>
        </section>
        <section>
          <h2 className="font-bold text-text-primary mb-2">データの保存</h2>
          <p>データはSupabase（米国）に保存されます。ユーザーはいつでも履歴を削除できます。</p>
        </section>
        <section>
          <h2 className="font-bold text-text-primary mb-2">お問い合わせ</h2>
          <p>プライバシーに関するお問い合わせはサービス内のフォームよりご連絡ください。</p>
        </section>
      </div>
    </main>
  );
}
