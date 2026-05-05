export type Genre =
  | '副業全般'
  | 'ダイエット'
  | '恋愛'
  | '投資'
  | '子育て'
  | 'その他';

export type Tone = '丁寧' | 'フランク' | '煽り強め' | '淡々';

export type ThemeCategory =
  | '共感型'
  | '問題提起型'
  | '解決策型'
  | '憧れ訴求型'
  | '抵抗除去型';

export type PostType =
  | '共感型'
  | '逆張り型'
  | 'リスト型'
  | 'ストーリー型'
  | '失敗談型'
  | '権威否定型'
  | 'ビフォーアフター型'
  | '数字インパクト型';

export interface PersonaLayer1 {
  age: string;
  gender: string;
  occupation: string;
  income: string;
  family: string;
  location: string;
  lifestyle: string;
}

export interface PersonaItem {
  text: string;
  innerVoice: string;
}

export interface Persona {
  layer1: PersonaLayer1;
  layer2: PersonaItem[]; // 表層の悩み ×5
  layer3: PersonaItem[]; // 深層の悩み ×5
  layer4: PersonaItem[]; // 憧れ・なりたい姿 ×5
  layer5: PersonaItem[]; // 購入抵抗 ×5
}

export interface ContentTheme {
  title: string;
  hook: string;
  postType: PostType;
  category: ThemeCategory;
}

export interface GenerationInput {
  genre: Genre | string;
  position?: string;
  targetHint?: string;
  productDirection?: string;
  referenceUrls?: string[];
  tone: Tone;
}

export interface GenerationResult {
  persona: Persona;
  themes: ContentTheme[];
  generatedAt: string;
}

export interface PersistedResult {
  id: string;
  userId: string;
  genre: string;
  inputData: GenerationInput;
  resultData: GenerationResult;
  createdAt: string;
}
