import type { GenerationInput } from '@/lib/persona/types';

export function buildPersonaPrompt(input: GenerationInput, referenceContent: string): string {
  return `あなたはSNSマーケティングの専門家です。以下の情報をもとに、5階層ペルソナと投稿テーマ50本を生成してください。

## 入力情報
- ジャンル: ${input.genre}
${input.position ? `- 発信者ポジション: ${input.position}` : ''}
${input.targetHint ? `- ターゲットのヒント: ${input.targetHint}` : ''}
${input.productDirection ? `- 商品・サービスの方向性: ${input.productDirection}` : ''}
- トーン: ${input.tone}
${referenceContent ? `\n## 一次情報（Yahoo!知恵袋等）\n${referenceContent}` : ''}

## 出力形式（JSON）

以下のJSON形式で厳密に出力してください。他のテキストは一切含めないでください。

{
  "persona": {
    "layer1": {
      "age": "例：35歳",
      "gender": "男性/女性/不明",
      "occupation": "職業",
      "income": "年収帯",
      "family": "家族構成",
      "location": "居住エリア",
      "lifestyle": "日常の様子"
    },
    "layer2": [
      {"text": "表層の悩み", "innerVoice": "「心の声」"},
      {"text": "...", "innerVoice": "「...」"},
      {"text": "...", "innerVoice": "「...」"},
      {"text": "...", "innerVoice": "「...」"},
      {"text": "...", "innerVoice": "「...」"}
    ],
    "layer3": [
      {"text": "深層の悩み", "innerVoice": "「心の声」"},
      {"text": "...", "innerVoice": "「...」"},
      {"text": "...", "innerVoice": "「...」"},
      {"text": "...", "innerVoice": "「...」"},
      {"text": "...", "innerVoice": "「...」"}
    ],
    "layer4": [
      {"text": "憧れ・なりたい姿", "innerVoice": "「心の声」"},
      {"text": "...", "innerVoice": "「...」"},
      {"text": "...", "innerVoice": "「...」"},
      {"text": "...", "innerVoice": "「...」"},
      {"text": "...", "innerVoice": "「...」"}
    ],
    "layer5": [
      {"text": "購入抵抗", "innerVoice": "「心の声」"},
      {"text": "...", "innerVoice": "「...」"},
      {"text": "...", "innerVoice": "「...」"},
      {"text": "...", "innerVoice": "「...」"},
      {"text": "...", "innerVoice": "「...」"}
    ]
  },
  "themes": [
    {"title": "30字以内のテーマタイトル", "hook": "最初の1行案", "postType": "共感型", "category": "共感型"},
    ... (合計50本: 共感型10本, 問題提起型10本, 解決策型10本, 憧れ訴求型10本, 抵抗除去型10本)
  ]
}

## 制約
- 断定表現（「絶対」「必ず」「100%」）を使わない
- 医薬品的表現（「治る」「治療」「予防」）を使わない
- 差別的・侮蔑的表現を使わない
- 個人特定情報を含めない
- 各テーマのtitleは30字以内
- postTypeは以下のいずれか: 共感型, 逆張り型, リスト型, ストーリー型, 失敗談型, 権威否定型, ビフォーアフター型, 数字インパクト型`;
}
