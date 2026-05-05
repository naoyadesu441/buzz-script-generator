import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'バズスクリプトジェネレーター',
  description: 'ペルソナ深掘りと50本のバズ投稿テーマを一括生成。ターゲットの心に刺さる発信戦略を構築。',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
