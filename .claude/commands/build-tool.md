# build-tool

cf-pages-starter テンプレートから新しいツール系Webアプリを実装・デプロイするコマンド。

## 使い方

```
/build-tool <ツールの説明>
```

例:
```
/build-tool 日本語文章の読みやすさをスコアリングするツール。文章を貼り付けると文字数・読了時間・難易度を表示。LocalStorage保存付き。
```

---

## 実行手順

### 1. プロジェクトセットアップ

**ディレクトリを作成（テンプレートをコピー）**
```bash
cp -r /home/naoya/dev/cf-pages-starter /home/naoya/dev/<プロジェクト名>
cd /home/naoya/dev/<プロジェクト名>
```

- プロジェクト名はケバブケース（例: `image-resizer-tool`）
- `package.json` の `"name"` フィールドをプロジェクト名に更新

**git 初期化**
```bash
rm -rf .git
git init
git add CLAUDE.md README.md next.config.js package.json postcss.config.js tailwind.config.ts tsconfig.json src/
git commit -m "Initial commit from cf-pages-starter"
```

---

### 2. アプリ実装

**変更対象ファイル**（原則この3ファイルのみ）:
- `src/app/page.tsx` — メインのUI・ロジック全体
- `src/app/layout.tsx` — タイトル・description・viewport設定
- `src/app/globals.css` — グローバルスタイル追加（必要時のみ）

**実装パターン（必ず守る）**

#### スタック制約
- `output: 'export'` による静的書き出し固定
- **サーバーサイド機能は一切使用不可**（API Routes, Server Actions, middleware）
- 外部APIは **`fetch` 直呼び**（SDKは Node.js 依存でビルドエラーになる）

#### AI API 呼び出し（マルチプロバイダー対応テンプレート）

```typescript
type Provider = 'gemini' | 'claude'

// Gemini（デフォルト・無料枠）
async function callGemini(prompt: string, maxTokens: number): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', maxOutputTokens: maxTokens },
      }),
    }
  )
  if (!res.ok) throw new Error(`Gemini APIエラー: ${res.status}`)
  const d = await res.json()
  return d.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// Claude（有料・切替用）
async function callClaude(prompt: string, maxTokens: number): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`Claude APIエラー: ${res.status}`)
  const d = await res.json()
  return d.content?.[0]?.text || ''
}
```

#### APIキー管理（LocalStorage）

```typescript
// provider ごとに別キーを保存
localStorage.setItem('tool_provider', 'gemini')        // デフォルト gemini
localStorage.setItem('tool_key_gemini', 'AIza...')
localStorage.setItem('tool_key_claude', 'sk-ant-...')
```

#### LocalStorage 保存パターン

```typescript
// 保存
localStorage.setItem('tool_data', JSON.stringify(data))

// 読込（useEffect内）
useEffect(() => {
  const saved = localStorage.getItem('tool_data')
  if (saved) { try { setData(JSON.parse(saved)) } catch {} }
}, [])
```

#### CSV エクスポートパターン

```typescript
const exportCSV = (rows: Record<string, string>[], filename: string) => {
  const BOM = '﻿'
  const keys = Object.keys(rows[0])
  const header = keys.join(',') + '\n'
  const body = rows.map(r => keys.map(k => `"${r[k].replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([BOM + header + body], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
```

#### UI デザインシステム（ダーク・モバイルファースト）

```
背景:       bg-[#0a0a0a]
カード:      bg-[#161616]  border border-white/[0.06]
モーダル:    bg-[#1c1c1c]  border border-white/10
ボタン主:    bg-white text-black
ボタン副:    bg-[#222] text-gray-400 hover:bg-[#2a2a2a]
ピル選択済:  bg-white text-black border-white
ピル未選択:  text-gray-500 border-gray-700
成功メッセ:  text-emerald-400
警告メッセ:  text-amber-400
エラーメッセ: text-red-400
```

丸み:
- カード: `rounded-2xl`
- ボタン: `rounded-xl`
- ピル: `rounded-full`

```
最大幅: max-w-2xl mx-auto px-4
ヘッダー: sticky top-0 z-40 backdrop-blur-sm border-b border-white/[0.08]
```

#### API 設定モーダルの標準構成

```
[Gemini（無料枠）] [Claude（有料）]  ← provider 選択
[APIキーを入力...]                   ← type="password"
無料枠: 15リクエスト/分・100万トークン/日  ← Gemini のみ表示
[キャンセル] [保存]
```

---

### 3. ビルド確認

```bash
npm run build
```

`out/` ディレクトリが生成され、エラーなしであること。

---

### 4. Cloudflare Pages デプロイ

**初回（プロジェクト新規作成）**
```bash
npx wrangler pages project create <CF_PROJECT_NAME> --production-branch=main
npx wrangler pages deploy out/ --project-name=<CF_PROJECT_NAME> --commit-dirty=true
```

**更新時**
```bash
npx wrangler pages deploy out/ --project-name=<CF_PROJECT_NAME> --commit-dirty=true
```

デプロイ後に表示される URL（`https://<hash>.<project>.pages.dev`）を記録。  
本番 URL は `https://<CF_PROJECT_NAME>.pages.dev`

---

### 5. Notion brightier-apps DB 更新

DB ID: `dcd7d8147fed4107b917125663966387`  
data_source_id: `7e3d3a4c-d638-4810-990b-a9233173e20e`

**初回（新規レコード作成）**
```
notion-create-pages で以下を作成:
- Name: <ツール名（日本語）>
- Type: ツール
- Status: デプロイ済み
- Production URL: https://<CF_PROJECT_NAME>.pages.dev
- Description: <ツールの説明>
- date:Created Date:start: <今日の日付 YYYY-MM-DD>
- date:Last Deploy:start: <今日の日付 YYYY-MM-DD>
```

**更新時（page_id を指定）**
```
notion-update-page で以下を更新:
- date:Last Deploy:start: <今日の日付>
- Description: 最新の説明
```

---

### 6. git コミット・プッシュ

```bash
git add src/app/page.tsx src/app/layout.tsx src/app/globals.css
git diff --cached --stat   # 変更内容を確認（機密情報がないか）
git commit -m "feat: <ツール名>実装・Cloudflare Pagesデプロイ"
git push origin main       # GitHub リモートを設定済みの場合
```

---

## よくある落とし穴

| 問題 | 原因 | 対処 |
|---|---|---|
| ビルドエラー `node:fs` | SDKをimportしている | `@anthropic-ai/sdk` などSDKは使わず fetch 直呼び |
| Gemini レスポンスが空 | JSON mime type でパース失敗 | `responseMimeType: 'application/json'` + `text.match(/\{[\s\S]*\}/)` でフォールバック |
| Wrangler "Project not found" | CF プロジェクトが未作成 | `wrangler pages project create` を先に実行 |
| CSV が文字化け | BOM なし | `'﻿'`（UTF-8 BOM）を先頭に付ける |
| LocalStorage が読めない | SSR で実行されている | `useEffect` 内でのみ `localStorage` にアクセス |

---

## プロジェクト管理情報

- **テンプレート**: `/home/naoya/dev/cf-pages-starter/`  
  GitHub: `https://github.com/naoyadesu441/cf-pages-starter`
- **デプロイ先**: Cloudflare Pages（`pages.dev` サブドメイン）
- **管理DB**: Notion `brightier-apps`（DB ID: `dcd7d8147fed4107b917125663966387`）
- **コード置き場**: `/home/naoya/dev/<プロジェクト名>/`
