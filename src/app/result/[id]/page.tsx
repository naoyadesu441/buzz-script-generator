'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import type { PersistedResult, ContentTheme, ThemeCategory } from '@/lib/persona/types';

const CATEGORIES: ThemeCategory[] = ['共感型', '問題提起型', '解決策型', '憧れ訴求型', '抵抗除去型'];

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [result, setResult] = useState<PersistedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'persona' | 'themes'>('persona');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/results/${id}`)
      .then((r) => r.json())
      .then(({ result: data }) => {
        setResult(data ? {
          id: data.id,
          userId: data.user_id,
          genre: data.genre,
          inputData: data.input_data,
          resultData: data.result_data,
          createdAt: data.created_at,
        } : null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function copyAll() {
    if (!result) return;
    const text = formatFullText(result);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
    </main>
  );

  if (!result) return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-text-secondary mb-4">結果が見つかりませんでした</p>
        <button onClick={() => router.push('/history')} className="neon-button">履歴に戻る</button>
      </div>
    </main>
  );

  const { persona, themes } = result.resultData;

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/history')} className="text-text-muted hover:text-text-secondary text-sm">← 履歴</button>
        <div className="flex-1" />
        <button onClick={copyAll} className="neon-button text-sm px-4 py-2">
          {copied ? '✓ コピー済み' : '全文コピー'}
        </button>
      </div>

      <div className="glass-card p-4 mb-6">
        <p className="text-xs text-text-muted">ジャンル</p>
        <p className="font-bold text-neon-purple text-lg">{result.genre}</p>
        <p className="text-xs text-text-muted mt-1">{new Date(result.createdAt).toLocaleString('ja-JP')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['persona', 'themes'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === tab ? 'bg-neon-purple text-white' : 'glass-card text-text-secondary'
            }`}
          >
            {tab === 'persona' ? '5階層ペルソナ' : 'テーマ50本'}
          </button>
        ))}
      </div>

      {activeTab === 'persona' && (
        <div className="space-y-4">
          <PersonaLayer title="第1層: 基礎属性" color="neon-purple">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(persona.layer1).map(([k, v]) => (
                <div key={k} className="text-sm">
                  <span className="text-text-muted">{LAYER1_LABELS[k as keyof typeof LAYER1_LABELS] ?? k}: </span>
                  <span className="text-text-primary">{v}</span>
                </div>
              ))}
            </div>
          </PersonaLayer>
          {[
            { title: '第2層: 表層の悩み', items: persona.layer2 },
            { title: '第3層: 深層の悩み', items: persona.layer3 },
            { title: '第4層: 憧れ・なりたい姿', items: persona.layer4 },
            { title: '第5層: 購入抵抗', items: persona.layer5 },
          ].map(({ title, items }) => (
            <PersonaLayer key={title} title={title} color="neon-cyan">
              <ul className="space-y-3">
                {items.map((item, i) => (
                  <li key={i}>
                    <p className="text-sm text-text-primary">{item.text}</p>
                    <p className="text-xs text-neon-purple mt-0.5">{item.innerVoice}</p>
                  </li>
                ))}
              </ul>
            </PersonaLayer>
          ))}
        </div>
      )}

      {activeTab === 'themes' && (
        <div className="space-y-6">
          {CATEGORIES.map((cat) => (
            <div key={cat}>
              <h3 className="font-bold text-neon-cyan mb-3">{cat}</h3>
              <div className="space-y-2">
                {themes.filter((t) => t.category === cat).map((theme, i) => (
                  <ThemeCard key={i} theme={theme} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="glass-card border-neon-amber/30 p-4 mt-8 text-sm text-text-secondary">
        ⚠️ 本ツールが生成するペルソナ・テーマは、AIによる仮説提案です。実際の発信・販売活動の結果を保証するものではありません。あくまで参考情報としてご利用ください。
      </div>
    </main>
  );
}

function PersonaLayer({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-4">
      <h3 className={`font-bold text-${color} mb-3 text-sm`}>{title}</h3>
      {children}
    </div>
  );
}

function ThemeCard({ theme }: { theme: ContentTheme }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(`${theme.title}\n${theme.hook}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="glass-card p-3 flex gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary text-sm">{theme.title}</p>
        <p className="text-xs text-text-secondary mt-1">{theme.hook}</p>
        <span className="inline-block mt-1 text-xs bg-neon-purple/20 text-neon-purple px-2 py-0.5 rounded">{theme.postType}</span>
      </div>
      <button onClick={copy} className="text-xs text-text-muted hover:text-neon-cyan flex-shrink-0">
        {copied ? '✓' : 'コピー'}
      </button>
    </div>
  );
}

const LAYER1_LABELS = {
  age: '年齢', gender: '性別', occupation: '職業',
  income: '年収', family: '家族', location: '居住地', lifestyle: 'ライフスタイル',
};

function formatFullText(result: PersistedResult): string {
  const { persona, themes } = result.resultData;
  const lines: string[] = [`# ペルソナ分析 - ${result.genre}`, ''];
  lines.push('## 第1層: 基礎属性');
  Object.entries(persona.layer1).forEach(([k, v]) => lines.push(`- ${LAYER1_LABELS[k as keyof typeof LAYER1_LABELS] ?? k}: ${v}`));
  [
    ['## 第2層: 表層の悩み', persona.layer2],
    ['## 第3層: 深層の悩み', persona.layer3],
    ['## 第4層: 憧れ', persona.layer4],
    ['## 第5層: 購入抵抗', persona.layer5],
  ].forEach(([title, items]) => {
    lines.push('', title as string);
    (items as { text: string; innerVoice: string }[]).forEach((item) => {
      lines.push(`- ${item.text}`, `  ${item.innerVoice}`);
    });
  });
  lines.push('', '# 投稿テーマ50本');
  CATEGORIES.forEach((cat) => {
    lines.push('', `## ${cat}`);
    themes.filter((t) => t.category === cat).forEach((t, i) => {
      lines.push(`${i + 1}. ${t.title}`, `   フック: ${t.hook}`, `   形式: ${t.postType}`);
    });
  });
  return lines.join('\n');
}
