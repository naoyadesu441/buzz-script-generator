import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-neon-purple transition-colors mb-8">
          ← 戻る
        </Link>

        <h1 className="text-2xl font-black mb-2 text-text-primary">利用規約</h1>
        <p className="text-[12px] text-text-muted mb-8">最終更新: 2026年5月</p>

        <div className="space-y-8 text-[14px] text-text-secondary leading-relaxed">

          <section>
            <p>本規約は、バズネタ100本ジェネレーター（以下「本ツール」）の利用条件を定めるものです。本ツールをご利用になる前に必ずお読みください。ご利用をもって本規約への同意とみなします。</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">本ツールについて</h2>
            <p>本ツールは、SNS発信者向けにバズる投稿アイデアを25〜100本自動生成する補助ツールです。生成されたアイデアはあくまで参考であり、実際の発信・活用はユーザー自身の判断と責任において行ってください。</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">入力情報の取り扱い</h2>
            <p>入力したテーマ・生成結果は、サービス改善・マーケティング施策への活用を目的として収集・分析する場合があります。</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">禁止事項</h2>
            <p className="mb-3">以下の利用を禁止します。</p>
            <ul className="space-y-2 pl-4">
              {[
                '法律または公序良俗に違反する目的での利用',
                '誹謗中傷・ハラスメント・差別的な内容のコンテンツ生成への利用',
                '薬機法・景品表示法等の関係法令に違反するコンテンツへの利用',
                'スパム目的での大量コンテンツ生成・拡散',
                '生成結果をそのまま第三者に有償販売すること',
                '本ツールのリバースエンジニアリングや不正アクセスの試み',
                '本ツールへの過負荷攻撃',
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-red-400 mt-1 shrink-0">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">免責事項</h2>
            <p>本ツールが生成するコンテンツはAIによる自動生成であり、内容の正確性・適切性を保証するものではありません。生成結果の利用によって生じたいかなる損害についても、本ツール運営者は一切の責任を負いません。実際の成果（フォロワー増加・収益等）を保証するものではなく、利用者自身の責任においてご活用ください。</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">Gemini APIキーの取り扱い</h2>
            <p>ユーザーが設定したGemini APIキーはお使いのブラウザのLocalStorageにのみ保存され、本ツール運営者のサーバーへ送信されることはありません。APIキーの管理はユーザー自身の責任で行ってください。</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">知的財産</h2>
            <p>本ツールを通じて生成されたコンテンツの著作権はユーザーに帰属します。本ツール自体のデザイン・ロジックの著作権は運営者に帰属します。</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">サービスの変更・終了</h2>
            <p>本ツールは予告なく内容の変更・機能の追加削除・サービスの停止を行う場合があります。これによって生じた損害について、運営者は責任を負いません。</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">お問い合わせ</h2>
            <p>本規約に関するお問い合わせは、本ツール配布元のThreadsアカウントまでご連絡ください。</p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-white/[0.06] flex gap-4 text-[12px] text-text-muted">
          <Link href="/privacy" className="hover:text-neon-purple transition-colors">プライバシーポリシー</Link>
          <Link href="/" className="hover:text-neon-cyan transition-colors">トップへ戻る</Link>
        </div>
      </div>
    </div>
  )
}
