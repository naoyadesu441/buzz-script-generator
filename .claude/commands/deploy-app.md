# deploy-app

Cloudflare Pages (Direct Upload) へアプリをデプロイし、Notion の brightier-apps DB を更新するコマンドです。

## 使い方

```
/deploy-app
```

または引数付きで:

```
/deploy-app project-name=<プロジェクト名> production-url=<公開URL>
```

## 実行手順

1. **ビルド確認**
   ```bash
   npm run build
   ```
   `out/` ディレクトリが生成されることを確認。

2. **Cloudflare Pages にデプロイ**
   ```bash
   npx wrangler pages deploy out/ --project-name=<CF_PROJECT_NAME>
   ```
   - `CF_PROJECT_NAME` は `.env.local` または引数から取得
   - 初回は `--project-name` で新規プロジェクト作成

3. **デプロイ結果を取得**
   - デプロイ後に表示される URL を記録

4. **Notion brightier-apps DB を更新**
   - DB ID: `dcd7d8147fed4107b917125663966387`
   - 対象レコードの `Last Deploy` を今日の日付に更新
   - `Production URL` を最新 URL に更新
   - `Status` を `デプロイ済み` に変更

## 環境変数（.env.local）

```
CF_ACCOUNT_ID=<Cloudflare Account ID>
CF_PROJECT_NAME=<Cloudflare Pages プロジェクト名>
```
