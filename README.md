# cf-pages-starter

Cloudflare Pages (Direct Upload) 向け Next.js 14 テンプレートリポジトリ。

## スタック

- **Next.js 14** (App Router, static export)
- **React 18 / TypeScript**
- **Tailwind CSS**
- **Node.js 20**

## このテンプレートを使う

1. GitHub の「Use this template」ボタンから新規リポジトリを作成
2. ローカルにクローン
3. 依存関係をインストール:
   ```bash
   npm install
   ```
4. `.env.local` を作成して環境変数を設定:
   ```
   CF_ACCOUNT_ID=your_cloudflare_account_id
   CF_PROJECT_NAME=your_project_name
   ```
5. 開発サーバーを起動:
   ```bash
   npm run dev
   ```

## ビルドとデプロイ

```bash
# 静的ビルド（out/ に出力）
npm run build

# Cloudflare Pages にデプロイ
npx wrangler pages deploy out/ --project-name=<PROJECT_NAME>
```

Claude Code から `/deploy-app` コマンドでもデプロイ可能です。

## ディレクトリ構成

```
.
├── src/
│   └── app/          # App Router
├── docs/             # プロジェクトドキュメント
├── .claude/
│   └── commands/     # Claude Code カスタムコマンド
├── out/              # ビルド成果物（.gitignore 対象）
└── public/           # 静的アセット
```

## 制約事項

`output: 'export'` による静的書き出し固定のため、以下は使用不可:
- API Routes / Route Handlers
- Server Actions
- Middleware
- Dynamic rendering (SSR/ISR)
