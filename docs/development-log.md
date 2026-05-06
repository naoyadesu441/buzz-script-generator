# バズネタ100本ジェネレーター — 開発ログ

> このファイルは `build-byok-ai-tool` スキルの参照実装として機能します。
> 同種のツールを新規作成する際は `/build-byok-ai-tool` スキルを使ってください。

## アプリ概要

- **名称**: バズネタ100本ジェネレーター
- **URL**: https://buzz-script-generator.pages.dev
- **用途**: Threads / Instagram 向けの投稿アイデアを 25〜100 本 AI が一括生成
- **特徴**: BYOK（ユーザーが自分の Gemini API キーを使用）、サーバーレス完全静的

---

## 時系列開発ログ

### フェーズ 1: 初回スカフォールド（commit `7754c76`）

`cf-pages-starter` テンプレートをコピーして開始。

- **実装内容**:
  - `src/app/page.tsx` に全機能を1ファイル実装
  - Gemini / Claude のプロバイダー切替（`type Provider = 'gemini' | 'claude'`）
  - テーマ・媒体（YouTube / Threads / TikTok / X）を入力 → 100本生成
  - LocalStorage で生成履歴保存
  - CSV エクスポート（BOM 付き）
  - モバイルファーストのダークテーマ
- **デプロイ**: `wrangler pages deploy out/ --project-name=buzz-script-generator`
- **Notion 登録**: brightier-apps DB に新規レコード作成

### フェーズ 2: 媒体設計見直し・AI テーマ提案追加（commit `355620b`）

- 出力先メディアを **Threads / Instagram に絞り込み**（YouTube / TikTok / X を削除）
- 参考にするバズスタイルの「参考媒体」をマルチ選択式に
- AI テーマ提案機能を追加（ジャンル入力 → 5案提示 → 選択して生成）
- Gemini 無料枠対応を訴求

### フェーズ 3: Gemini モデル問題 → 一時ロールバック（commits `7b8fc67`, `79cebd1`）

**問題**: `gemini-2.5-flash` が thinking モデルのため `responseMimeType: 'application/json'` と干渉し、テーマ提案が JSON ではなく自然文で返ってきた。

**初回対処**: `gemini-2.0-flash` へダウングレード（`7b8fc67`）。

**別事故**: 外部編集（commit `457b279`）で `src/app/` が全く別アプリ（ペルソナ深掘り + Supabase 認証 + 50テーマ生成 v2）に丸ごと置き換えられた。

**復旧手順**:
```bash
git checkout 7b8fc67 -- src/app/page.tsx src/app/layout.tsx src/app/globals.css
git rm -rf src/app/actions src/app/api src/app/auth src/app/diagnose \
           src/app/generate src/app/history src/app/login \
           src/app/privacy src/app/result src/app/settings src/app/terms
```

残存ファイル（`src/middleware.ts`, `src/lib/`, `src/components/`, `supabase/`, `wrangler.toml`）も手動削除が必要だった。

### フェーズ 4: Gemini モデル現行化（commit `e06ac99`）

**最終解**: `gemini-2.5-flash` + `generationConfig.thinkingConfig: { thinkingBudget: 0 }`

```typescript
generationConfig: {
  responseMimeType: 'application/json',
  maxOutputTokens: maxTok,
  thinkingConfig: { thinkingBudget: 0 },
}
```

- `thinkingBudget: 0` で thinking を明示的に無効化 → JSON モードと干渉しない
- `gemini-2.0-flash` は新規ユーザーが API キーを取得すると「このモデルは利用不可」エラーになる

### フェーズ 5: JSON 切り詰め問題の解消（commit `a3a6d60`）

**問題**: 100 本生成時に JSON がバイト途中で切れてパースエラー。`maxOutputTokens: 10000` では不足。

**解決**: 生成本数で動的に上限を設定:
```typescript
const maxTok = count <= 25 ? 8000 : count <= 50 ? 16000 : 32000
```

### フェーズ 6: Gemini 単独化・APIキー UI 改善（commit `caaaa12`）

- Claude プロバイダー削除（BYOK 型では Gemini 無料枠の方が UX が良い）
- 初回アクセス時に「APIキーを設定してください」バナーを前面表示
- APIキー取得方法モーダル（Step 1〜4 の手順 + Google AI Studio リンク）

### フェーズ 7: ハッシュタグ全件必須化（commit `755075e`）

**問題**: Instagram 向け出力で `hashtags` が `id:1` にしか入らない。id:2 以降が空。

**原因**: プロンプトの JSON 例に `"hashtags":"..."` とサンプルを付けたが、Gemini がそれを「省略可能フィールド」と解釈した。

**解決**: プロンプトに「全 `id` で `hashtags` を必ず含めること」を明記し、全件必須ルールを強調。

### フェーズ 8: 使用量ゲージ追加（commit `ec1fcdc`）

BYOK ツールでユーザーが「課金されていないか不安」を感じないよう、Gemini 無料枠の消費状況を可視化。

```typescript
const FREE_TOKEN_LIMIT = 1_000_000
const FREE_REQUEST_LIMIT = 1500
const USAGE_KEY = 'buzz_usage_v1'

interface DailyUsage {
  tokens: number
  requests: number
  date: string  // 'YYYY-MM-DD'
}

function loadUsage(): DailyUsage {
  const today = new Date().toISOString().slice(0, 10)
  try {
    const saved = JSON.parse(localStorage.getItem(USAGE_KEY) || '{}')
    if (saved.date === today) return saved
  } catch {}
  return { tokens: 0, requests: 0, date: today }
}

function addUsage(tokens: number) {
  const u = loadUsage()
  const next = { ...u, tokens: u.tokens + tokens, requests: u.requests + 1 }
  setUsage(next)
  localStorage.setItem(USAGE_KEY, JSON.stringify(next))
}
```

- `usageMetadata.totalTokenCount` を Gemini レスポンスから取得して加算
- 429 / RESOURCE_EXHAUSTED → `Error('QUOTA_EXCEEDED')` で UI を「翌日0時リセット・課金なし」表示に分岐
- 3段階閾値色: `>=90% → red` / `>=70% → amber` / 通常 → `neon-cyan`

### フェーズ 9: ネオンダーク全面リデザイン（commit `a51b208`）

ユーザーから「こんなデザインにしてほしい」スクリーンショットを受け、全面リデザイン。

**tailwind.config.ts** — カスタムトークン:
```typescript
colors: {
  'neon-purple': '#A855F7',
  'neon-cyan': '#06B6D4',
  'bg-base': '#0A0A1E',
  'bg-card': '#0F0F2A',
  'bg-elevated': '#161632',
  'text-primary': '#F8FAFC',
  'text-secondary': '#C4D0DE',
  'text-muted': '#8B9DB0',
}
backgroundImage: {
  'neon-gradient': 'linear-gradient(135deg, #A855F7 0%, #06B6D4 100%)',
  'neon-gradient-subtle': 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(6,182,212,0.15) 100%)',
}
boxShadow: {
  'neon-purple': '0 0 24px rgba(168, 85, 247, 0.45)',
  'neon-cyan': '0 0 24px rgba(6, 182, 212, 0.45)',
  'neon-sm': '0 0 12px rgba(168, 85, 247, 0.3)',
  'glass': '0 8px 32px rgba(0, 0, 0, 0.4)',
}
```

**globals.css** — 再利用コンポーネントクラス:
```css
.glass-card { @apply bg-bg-card/70 backdrop-blur-md border border-white/[0.08] rounded-2xl shadow-glass; }
.neon-button { @apply bg-neon-gradient text-white font-bold rounded-xl shadow-neon-purple hover:shadow-neon-cyan hover:scale-[1.02] active:scale-[0.98] transition-all; }
.neon-text { @apply bg-clip-text text-transparent bg-neon-gradient; }
.neon-badge { @apply inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-neon-purple/10 text-neon-purple border border-neon-purple/30; }
.input-neon { @apply w-full bg-bg-base/80 border border-white/10 rounded-xl px-4 py-3 focus:border-neon-purple/50 focus:shadow-neon-sm; }
```

### フェーズ 10: Privacy/Terms ページ追加（commit `a51b208` と `f8ab284`）

`/privacy` と `/terms` を静的ページとして追加。

- **Privacy**: LocalStorage 3キーの開示テーブル（`buzz_key_gemini` / `buzz_history` / `buzz_usage_v1`）、外部サービス（Gemini API / Cloudflare Pages）へのリンク
- **Terms**: 禁止事項リスト、免責事項、APIキーの取り扱い
- Footer に両ページへのリンクを追加

### フェーズ 11: 文言誠実化（commit `4ae5f49`）

「参考にする媒体」という表現をユーザーが「実際に情報収集しているの？」と疑問視。

実態は「AIの学習済み知識からスタイルを参考にする」だったので、ラベルを「バズスタイルの参考元」に変更し、※注釈を追加。

### フェーズ 12: テキストコントラスト改善（commit `f8ab284`）

`#0A0A1E` の暗背景に対して `text-muted` が `#4B5563` ではほぼ不可視。

- `text-secondary`: `#94A3B8` → `#C4D0DE`
- `text-muted`: `#4B5563` → `#8B9DB0`
- `text-text-muted/60` の opacity 修飾子を削除（完全不可視になっていた）

### フェーズ 13: タイポグラフィ微調整（commits `e1ce9a5`, `4828c7a`, `f4b5e0b`, `120bba6` 等）

- タイトル (`h1`) サイズ: `text-base` → `text-[48px]` → `text-[34px]`（3倍 → 0.7倍に縮小）
- サブタイトル: `text-[11px]` → `text-[23px]`
- スマホのみ改行挿入: `<br className="sm:hidden" />`
- Hero「フックの強さ」: スマホのみ `text-[43px]`（PC は `text-4xl` = 36px）

### フェーズ 14: UIセクション順序の調整（commits `d1260d7`, `fa340e7`）

- Hero セクションを `!geminiKey` 時にも表示（初回訪問でコンテンツが見える）
- Hero → APIキー設定バナーの順に並べ直し（ツールの価値訴求を先行）

### フェーズ 15: APIキー設定ガイドへのリンク追加（commit `9a44716`）

Step 1「aistudio.google.com にアクセス」を `<a href="...">` のリンクに変更し、シアン色でタップ可能に。

---

## 設計判断ログ

| 決定 | 理由 |
|---|---|
| `output: 'export'` 静的書き出し | CF Pages Direct Upload のみ。バックエンド運用コストゼロ |
| SDK 不採用、`fetch` 直叩き | `@anthropic-ai/sdk` が `node:fs` を参照しビルドエラー |
| `gemini-2.5-flash` + `thinkingBudget: 0` | 2.5系 thinking が JSON 生成と干渉、0で無効化し速度・コスト最適化 |
| `maxOutputTokens` 段階制 | 25本→8000 / 50本→16000 / 100本→32000。思考なしでも大量出力が必要 |
| JSON 抽出に `.match(/\{[\s\S]*\}/)` | Gemini が稀に説明文を前後に混ぜる。ロバストな抽出で防御 |
| LocalStorage 3キー固定 | サーバー不要、全データをブラウザのみに保持 |
| 履歴は最新 20 件 `slice(0, 20)` | LocalStorage の容量圧迫を防止 |
| Claude を削除して Gemini 単独化 | BYOK 型では無料枠のある Gemini が UX 最良。Claude は有料前提で想定ユーザー層と不一致 |
| 使用量ゲージを常時表示 | BYOK = ユーザーの課金不安を解消する設計が必須 |
| Hero を APIキー設定バナーより前に表示 | ツールの価値をまず見せてから設定を促す |

---

## ハマり所と対処

| 問題 | 原因 | 対処 |
|---|---|---|
| `gemini-2.0-flash` が新規ユーザーに「利用不可」 | 旧モデルが段階廃止中 | `gemini-2.5-flash` + `thinkingBudget: 0` を使う |
| `gemini-2.5-flash` の JSON 生成が壊れる | thinking モデルが `responseMimeType` と干渉 | `thinkingConfig: { thinkingBudget: 0 }` で明示無効化 |
| 100本生成で JSON が途中で切れる | `maxOutputTokens: 10000` では不足（バイト7323で切断） | 生成数に応じて 8000/16000/32000 に段階制 |
| Wrangler が古い HTML を配信 | 前回 build の `out/` のハッシュが一致し0件アップロード | `rm -rf .next out` してから build |
| `gemini-2.5-flash-lite` を試したが諦めた | 無料枠・速度は良好だったが後に `gemini-2.5-flash+thinkingBudget:0` で統一した | `flash` の方が能力が高く、thinking 無効化で問題なし |
| hashtags が `id:1` にしか入らない | プロンプト例が「省略可能」と読まれた | プロンプトに「全 id で必須」を明示 |
| `text-muted (#4B5563)` がほぼ不可視 | `#0A0A1E` 背景に対してコントラスト不足 | `#8B9DB0` に明度アップ |
| `text-text-muted/60` が完全不可視 | opacity 修飾子が重なり極端に暗く | opacity 修飾子を除去 |
| 外部編集で別アプリに置き換えられた | git 管理外の編集（v2 Supabase 認証版） | `git checkout <commit> -- src/app/` で特定コミット状態を復元 |
| ビルドに `middleware.ts` が残存 | `git rm` で消えていなかった | `rm -rf src/middleware.ts src/lib/ src/components/ supabase/` で手動削除 |
| LocalStorage が SSR で落ちる | Next.js の初期描画時に `window` が存在しない | `useEffect` 内でのみ `localStorage` にアクセス |

---

## 再利用すべきパターン（スキルへの抽出元）

以下はすべて `build-byok-ai-tool` スキルに組み込まれています。

- **ネオンダークデザイントークン** (`tailwind.config.ts` のカスタムカラー・グラデ・影)
- **`globals.css` のコンポーネントクラス** (`glass-card` / `neon-button` / `neon-text` / `neon-badge` / `input-neon`)
- **Gemini 呼び出しパターン** (`gemini-2.5-flash` + `thinkingBudget:0` + `responseMimeType:'application/json'` + JSON フォールバック抽出)
- **使用量ゲージ一式** (`FREE_TOKEN_LIMIT` / `loadUsage` / `addUsage` / 3段階閾値色 / `QUOTA_EXCEEDED` 分岐)
- **LocalStorage 3キー設計** (`<tool>_key_gemini` / `<tool>_history` / `<tool>_usage_v1`)
- **APIキー設定モーダル** (bottom-sheet 風 / 取得手順ステップ / Google AI Studio リンク)
- **UI セクション順序**: Hero → APIキーバナー → 使用量ゲージ → 入力フォーム → 結果一覧 → Footer
- **Privacy/Terms 定型ページ** (LocalStorage キー開示テーブル / 外部サービスリンク / 共通ラッパ)
- **レスポンシブ改行制御** (`<br className="sm:hidden" />`)
- **ビルド前のキャッシュクリア** (`rm -rf .next out && npm run build`)

---

## LocalStorage キー設計

| キー | 内容 |
|---|---|
| `buzz_key_gemini` | Gemini API キー |
| `buzz_history` | 生成履歴（最新 20 件） |
| `buzz_usage_v1` | 当日のトークン使用量・リクエスト数 |

新規ツールを作るときは `buzz_` プレフィックスをツール固有の識別子に変更する。

---

## 参照

- **スキル**: `/build-byok-ai-tool` (`cf-pages-starter/.claude/commands/build-byok-ai-tool.md`)
- **テンプレート**: `/home/naoya/dev/cf-pages-starter/`
- **管理 DB**: Notion brightier-apps (ID: `dcd7d8147fed4107b917125663966387`)
- **本番 URL**: https://buzz-script-generator.pages.dev
