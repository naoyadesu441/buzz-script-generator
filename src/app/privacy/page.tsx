import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-neon-purple transition-colors mb-8">
          ← 戻る
        </Link>

        <h1 className="text-2xl font-black mb-2 text-text-primary">プライバシーポリシー</h1>
        <p className="text-[12px] text-text-muted mb-8">最終更新: 2026年5月</p>

        <div className="space-y-8 text-[14px] text-text-secondary leading-relaxed">

          <section>
            <p>バズネタ100本ジェネレーター（以下「本ツール」）は、ユーザーのプライバシーを尊重し、個人情報の適切な取り扱いに努めます。本ポリシーは本ツールの利用に際して適用されます。</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">収集する情報</h2>
            <p className="mb-3">本ツールはサーバーを持たず、以下の情報をお使いのブラウザの LocalStorage にのみ保存します。外部サーバーへの送信・収集は一切行いません。</p>
            <ul className="space-y-1.5 pl-4">
              {[
                'Gemini APIキー（buzz_key_gemini）',
                '生成履歴 最新20件（buzz_history）',
                '1日のトークン使用量・リクエスト数（buzz_usage_v1）',
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-neon-purple mt-1 shrink-0">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">利用目的</h2>
            <p>保存した情報は、AIによるバズ投稿アイデアの生成機能の提供のほか、サービス改善およびマーケティング活動に活用する場合があります。</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">データの保管と削除</h2>
            <p>すべてのデータはお使いのブラウザのみに保存されます。データを削除したい場合は、ブラウザの「LocalStorage をクリア」操作で完全に削除できます。本ツール側からデータにアクセスする手段はありません。</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">Cookie 及び LocalStorage</h2>
            <p>本ツールは Cookie を使用しません。LocalStorage のみを使用してAPIキー・生成履歴・使用量を保存しています。</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">保存キー一覧</h2>
            <div className="glass-card p-4 space-y-2 text-[13px]">
              {[
                ['buzz_key_gemini', 'Gemini APIキー'],
                ['buzz_history', '生成履歴（最新20件）'],
                ['buzz_usage_v1', '当日のトークン使用量・リクエスト数'],
              ].map(([key, desc]) => (
                <div key={key} className="flex gap-3">
                  <code className="text-neon-cyan font-mono shrink-0">{key}</code>
                  <span className="text-text-muted">：{desc}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">外部サービス</h2>
            <p className="mb-3">本ツールは以下の外部サービスを利用しています。各サービスのプライバシーポリシーも合わせてご確認ください。</p>
            <div className="space-y-3">
              {[
                {
                  name: 'Google Gemini API（AI生成）',
                  desc: 'ユーザーが入力したテーマ・設定は Google のサーバーに送信されます。',
                  link: 'https://policies.google.com/privacy',
                  linkText: 'Googleプライバシーポリシー',
                },
                {
                  name: 'Cloudflare Pages（ホスティング）',
                  desc: 'アクセスログはCloudflareにより収集される場合があります。',
                  link: 'https://www.cloudflare.com/privacypolicy/',
                  linkText: 'Cloudflareプライバシーポリシー',
                },
              ].map(({ name, desc, link, linkText }) => (
                <div key={name} className="glass-card p-4">
                  <p className="font-semibold text-text-primary mb-1 text-[13px]">· {name}</p>
                  <p className="text-[12px] text-text-muted">{desc}</p>
                  <a href={link} target="_blank" rel="noopener noreferrer" className="text-[12px] text-neon-cyan hover:underline">{linkText} →</a>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">お問い合わせ</h2>
            <p>本ポリシーに関するお問い合わせは、本ツール配布元のThreadsアカウントまでご連絡ください。</p>
          </section>

        </div>
      </div>
    </div>
  )
}
