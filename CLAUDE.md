# CLAUDE.md — cf-pages-starter

このリポジトリは Cloudflare Pages (Direct Upload) 向け Next.js 14 テンプレートです。

## スタック

- Next.js 14 (App Router, `output: 'export'`)
- React 18 / TypeScript / Tailwind CSS
- Node.js 20

## 重要な制約

- `output: 'export'` による静的書き出し固定。サーバーサイド機能（API Routes, Server Actions, middleware）は使用不可
- ビルド成果物は `out/` ディレクトリ
- Cloudflare Pages へは Direct Upload（`wrangler pages deploy out/`）でデプロイ

## よく使うコマンド

```bash
npm run dev      # ローカル開発
npm run build    # 静的ビルド → out/ に出力
npm run lint     # ESLint チェック
```

## デプロイ

`/deploy-app` コマンドを使用してください（`.claude/commands/deploy-app.md` 参照）。
