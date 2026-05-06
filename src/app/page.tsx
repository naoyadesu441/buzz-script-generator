'use client'

import { useState, useEffect } from 'react'

type OutputPlatform = 'Threads' | 'Instagram'
type ReferencePlatform = 'YouTube' | 'Threads' | 'TikTok' | 'X' | 'Instagram'
type Tab = 'generate' | 'history' | 'guide'
type ThemeMode = 'manual' | 'suggest'

interface PostIdea {
  id: number
  hook: string
  body: string
  hashtags: string
}

interface Generation {
  id: string
  theme: string
  outputPlatform: OutputPlatform
  referencePlatforms: string[]
  count: number
  ideas: PostIdea[]
  createdAt: string
}

interface DailyUsage {
  tokens: number
  requests: number
  date: string
}

const OUTPUT_PLATFORMS: OutputPlatform[] = ['Threads', 'Instagram']
const REFERENCE_PLATFORMS: ReferencePlatform[] = ['YouTube', 'Threads', 'TikTok', 'X', 'Instagram']

const OUTPUT_PLATFORM_DESC: Record<OutputPlatform, string> = {
  Threads: '短文・会話風・改行多め・絵文字控えめ',
  Instagram: 'キャプション形式・ハッシュタグ多用・絵文字活用',
}

const REFERENCE_PLATFORM_STYLE: Record<ReferencePlatform, string> = {
  YouTube: '強いサムネ的フック・数字や驚きで掴む',
  Threads: '共感・日常会話風・問いかけ・短め',
  TikTok: '2秒で掴む・流行語・テンポ感',
  X: '短文・逆説・問いかけ・引用RT想定',
  Instagram: '保存したくなる・ビジュアル想起・ハッシュタグ',
}

const GENRE_OPTIONS = [
  '美容・スキンケア', 'ファッション', 'ダイエット・健康', '筋トレ・フィットネス',
  '料理・レシピ', '副業・稼ぎ方', 'ビジネス・仕事術', '転職・キャリア',
  '節約・お金', '投資・資産形成', '子育て・育児', 'メンタル・ライフスタイル',
  '勉強・学習', 'エンタメ・趣味', 'テクノロジー・AI',
]

const HOW_TO_GET_KEY = [
  { step: '1', text: 'aistudio.google.com にアクセス' },
  { step: '2', text: 'Googleアカウントでサインイン' },
  { step: '3', text: '「Get API key」→「Create API key」' },
  { step: '4', text: '生成されたキー（AIza...）をコピーして貼り付け' },
]

const FREE_TOKEN_LIMIT = 1_000_000
const FREE_REQUEST_LIMIT = 1500

const getTodayStr = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const USAGE_KEY = 'buzz_usage_v1'

const loadUsage = (): DailyUsage => {
  try {
    const raw = localStorage.getItem(USAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DailyUsage
      if (parsed.date === getTodayStr()) return parsed
    }
  } catch {}
  return { tokens: 0, requests: 0, date: getTodayStr() }
}

export default function Home() {
  const [tab, setTab] = useState<Tab>('generate')

  const [geminiKey, setGeminiKey] = useState('')
  const [showApiModal, setShowApiModal] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showHowToGet, setShowHowToGet] = useState(false)

  const [dailyUsage, setDailyUsage] = useState<DailyUsage>({ tokens: 0, requests: 0, date: '' })

  const [outputPlatform, setOutputPlatform] = useState<OutputPlatform>('Threads')
  const [referencePlatforms, setReferencePlatforms] = useState<Set<ReferencePlatform>>(
    new Set(REFERENCE_PLATFORMS)
  )
  const [count, setCount] = useState(100)

  const [themeMode, setThemeMode] = useState<ThemeMode>('manual')
  const [manualTheme, setManualTheme] = useState('')
  const [genre, setGenre] = useState('')
  const [suggestedThemes, setSuggestedThemes] = useState<string[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState('')
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [suggestionError, setSuggestionError] = useState('')

  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  const [ideas, setIdeas] = useState<PostIdea[]>([])
  const [currentGen, setCurrentGen] = useState<{ theme: string; outputPlatform: OutputPlatform } | null>(null)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const [history, setHistory] = useState<Generation[]>([])

  useEffect(() => {
    const gKey = localStorage.getItem('buzz_key_gemini') || ''
    const hist = localStorage.getItem('buzz_history')
    setGeminiKey(gKey)
    setDailyUsage(loadUsage())
    if (hist) { try { setHistory(JSON.parse(hist)) } catch {} }
  }, [])

  const addUsage = (tokens: number) => {
    setDailyUsage(prev => {
      const today = getTodayStr()
      const base = prev.date === today ? prev : { tokens: 0, requests: 0, date: today }
      const updated: DailyUsage = { tokens: base.tokens + tokens, requests: base.requests + 1, date: today }
      localStorage.setItem(USAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const openApiModal = () => { setApiKeyInput(geminiKey); setShowHowToGet(false); setShowApiModal(true) }
  const saveApiKey = () => {
    const trimmed = apiKeyInput.trim()
    setGeminiKey(trimmed)
    localStorage.setItem('buzz_key_gemini', trimmed)
    setShowApiModal(false)
  }

  const toggleReferencePlatform = (p: ReferencePlatform) => {
    const next = new Set(referencePlatforms)
    if (next.has(p)) { if (next.size > 1) next.delete(p) } else { next.add(p) }
    setReferencePlatforms(next)
  }

  const callGemini = async (prompt: string, maxTokens: number): Promise<string> => {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', maxOutputTokens: maxTokens, thinkingConfig: { thinkingBudget: 0 } },
        }),
      }
    )
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      const msg = (d as { error?: { message?: string } }).error?.message || ''
      if (res.status === 429 || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('resource_exhausted')) throw new Error('QUOTA_EXCEEDED')
      throw new Error(msg || `Gemini APIエラー: ${res.status}`)
    }
    const d = await res.json()
    const totalTokens: number = (d.usageMetadata?.totalTokenCount as number) ?? 0
    if (totalTokens > 0) addUsage(totalTokens)
    return d.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }

  const suggestThemes = async () => {
    if (!genre || !geminiKey || isSuggesting) return
    setIsSuggesting(true); setSuggestedThemes([]); setSelectedSuggestion(''); setSuggestionError('')
    const refList = Array.from(referencePlatforms).join('、')
    const prompt = `大ジャンル「${genre}」について、${refList} でよく伸びる投稿の具体的なサブテーマを5つ提案してください。キャッチーで具体的なものを選んでください。\n\nJSON形式のみで返答（説明文不要）:\n{"themes":["テーマ1","テーマ2","テーマ3","テーマ4","テーマ5"]}`
    try {
      const text = await callGemini(prompt, 512)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('解析失敗。再度お試しください。')
      const data = JSON.parse(jsonMatch[0])
      setSuggestedThemes(data.themes || [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setSuggestionError(msg === 'QUOTA_EXCEEDED' ? '本日の無料枠を使い切りました。明日0時にリセットされます。' : msg)
    } finally { setIsSuggesting(false) }
  }

  const activeTheme = themeMode === 'manual' ? manualTheme : selectedSuggestion

  const generate = async () => {
    if (!geminiKey || !activeTheme.trim() || isGenerating) return
    setIsGenerating(true); setProgress(5); setProgressMsg('APIに接続中...'); setIdeas([]); setCurrentGen(null); setError('')
    try {
      setProgress(20); setProgressMsg(`${count}本のアイデアを生成中...（30〜60秒かかります）`)
      const refList = Array.from(referencePlatforms)
      const refStyles = refList.map(p => `・${p}: ${REFERENCE_PLATFORM_STYLE[p as ReferencePlatform]}`).join('\n')
      const prompt = `あなたはSNS投稿のバズプロデューサーです。\n\n【出力先】${outputPlatform}（${OUTPUT_PLATFORM_DESC[outputPlatform]}）\n【参考にするバズパターン（ミックスして活用）】\n${refStyles}\n【テーマ】${activeTheme.trim()}\n\n上記を踏まえ、${count}本のバズる投稿アイデアをJSON形式のみで返してください（前後の説明文不要）:\n{"ideas":[{"id":1,"hook":"読者が止まる強い一行","body":"本文","hashtags":"#タグ1 #タグ2 #タグ3"},{"id":2,"hook":"別の切り口の一行","body":"別の本文","hashtags":"#別タグ1 #別タグ2 #別タグ3"}]}\n\nルール:\n- hookは数字・問いかけ・共感・驚き・逆説など多様なパターンで\n- bodyは${outputPlatform}に最適な長さ・文体・改行\n- **全${count}件すべてに hashtags を必ず入れる**（空文字・省略・"..."禁止、毎件ユニークなタグを${outputPlatform === 'Instagram' ? '5〜10' : '3〜5'}個）\n- ${outputPlatform === 'Instagram' ? 'Instagram は保存・発見性のためハッシュタグを多めに' : ''}\n- 全${count}件、内容重複なし\n- 日本語で出力`
      const maxTok = count <= 25 ? 8000 : count <= 50 ? 16000 : 32000
      const text = await callGemini(prompt, maxTok)
      setProgress(85); setProgressMsg('データを解析中...')
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('レスポンスの解析に失敗しました。再度お試しください。')
      const data = JSON.parse(jsonMatch[0])
      const newIdeas: PostIdea[] = (data.ideas || []).map((i: PostIdea) => ({ id: i.id, hook: i.hook || '', body: i.body || '', hashtags: i.hashtags || '' }))
      setIdeas(newIdeas); setCurrentGen({ theme: activeTheme.trim(), outputPlatform })
      setProgress(100); setProgressMsg(`${newIdeas.length}本の生成が完了しました！`)
      const gen: Generation = { id: Date.now().toString(), theme: activeTheme.trim(), outputPlatform, referencePlatforms: refList, count: newIdeas.length, ideas: newIdeas, createdAt: new Date().toISOString() }
      const newHistory = [gen, ...history].slice(0, 20)
      setHistory(newHistory); localStorage.setItem('buzz_history', JSON.stringify(newHistory))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg); setProgress(0); setProgressMsg('')
    } finally { setIsGenerating(false) }
  }

  const copyIdea = async (idea: PostIdea) => {
    await navigator.clipboard.writeText([idea.hook, idea.body, idea.hashtags].filter(Boolean).join('\n\n'))
    setCopiedId(idea.id); setTimeout(() => setCopiedId(null), 1500)
  }

  const exportCSV = (targetIdeas: PostIdea[], targetTheme: string, targetPlatform: string) => {
    const BOM = '﻿'
    const rows = targetIdeas.map(i => `${i.id},"${i.hook.replace(/"/g, '""')}","${i.body.replace(/"/g, '""')}","${i.hashtags.replace(/"/g, '""')}"`).join('\n')
    const blob = new Blob([BOM + 'ID,フック,本文,ハッシュタグ\n' + rows], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement('a'), { href: url, download: `buzz-${targetTheme}-${targetPlatform}-${Date.now()}.csv` })
    a.click(); URL.revokeObjectURL(url)
  }

  const loadFromHistory = (gen: Generation) => { setIdeas(gen.ideas); setCurrentGen({ theme: gen.theme, outputPlatform: gen.outputPlatform }); setManualTheme(gen.theme); setOutputPlatform(gen.outputPlatform); setTab('generate') }
  const deleteHistory = (id: string) => { const updated = history.filter(h => h.id !== id); setHistory(updated); localStorage.setItem('buzz_history', JSON.stringify(updated)) }

  const canGenerate = !!geminiKey && !!activeTheme.trim() && !isGenerating
  const tokenPct = Math.min((dailyUsage.tokens / FREE_TOKEN_LIMIT) * 100, 100)
  const reqPct = Math.min((dailyUsage.requests / FREE_REQUEST_LIMIT) * 100, 100)
  const gaugeColor = tokenPct >= 90 ? 'from-red-500 to-red-400' : tokenPct >= 70 ? 'from-amber-500 to-yellow-400' : 'from-neon-purple to-neon-cyan'
  const gaugeTextColor = tokenPct >= 90 ? 'text-red-400' : tokenPct >= 70 ? 'text-amber-400' : 'text-neon-cyan'
  const isQuotaError = error === 'QUOTA_EXCEEDED'

  const HowToAccordion = () => (
    <div className="border border-neon-purple/20 rounded-xl overflow-hidden">
      <button
        onClick={() => setShowHowToGet(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-[13px] text-neon-purple font-medium hover:bg-neon-purple/5 transition-colors"
      >
        <span>🔑 Gemini API キーの取得方法（無料）</span>
        <span className="text-text-muted text-[11px]">{showHowToGet ? '▲ 閉じる' : '▼ 見る'}</span>
      </button>
      {showHowToGet && (
        <div className="px-4 pb-4 border-t border-neon-purple/10 pt-3 space-y-2.5">
          {HOW_TO_GET_KEY.map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-neon-gradient flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">{step}</div>
              <p className="text-[12px] text-text-secondary">{text}</p>
            </div>
          ))}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
            className="block mt-3 text-center py-2 bg-neon-gradient-subtle border border-neon-purple/30 rounded-lg text-[13px] text-neon-purple font-semibold hover:bg-neon-purple/20 transition-colors">
            Google AI Studio を開く →
          </a>
        </div>
      )}
    </div>
  )

  const ApiKeyForm = ({ onSave, onCancel }: { onSave: () => void; onCancel?: () => void }) => (
    <div className="space-y-4">
      <div>
        <label className="text-[11px] text-text-muted font-medium block mb-2">Gemini API キー</label>
        <input
          type="password" value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)}
          placeholder="AIza..." autoFocus onKeyDown={e => e.key === 'Enter' && onSave()}
          className="input-neon font-mono"
        />
        <p className="text-[11px] text-text-muted mt-1.5">無料枠: 15 RPM・1日100万トークン・自動課金なし</p>
      </div>
      <HowToAccordion />
      <div className="flex gap-2">
        {onCancel && (
          <button onClick={onCancel} className="flex-1 py-2.5 border border-white/10 rounded-xl text-sm text-text-secondary hover:bg-white/5 transition-colors">
            キャンセル
          </button>
        )}
        <button onClick={onSave} disabled={!apiKeyInput.trim()}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${apiKeyInput.trim() ? 'neon-button' : 'bg-white/5 text-text-muted cursor-not-allowed'}`}>
          保存する
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-base/80 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-base font-bold tracking-tight text-text-primary">
                <span className="neon-text">バズネタ</span>100本ジェネレーター
              </h1>
              <p className="text-[11px] text-text-muted mt-0.5">Threads / Instagram 投稿アイデアを一括生成</p>
            </div>
            <button onClick={openApiModal}
              className={`text-[11px] px-3 py-1.5 rounded-full border font-medium transition-all ${
                geminiKey
                  ? 'border-neon-cyan/40 text-neon-cyan bg-neon-cyan/10 hover:bg-neon-cyan/20'
                  : 'border-amber-500/40 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
              }`}>
              {geminiKey ? '✓ Gemini 設定済' : '⚠ API未設定'}
            </button>
          </div>
          <div className="flex gap-0">
            {(['generate', 'history', 'guide'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`relative px-4 py-2.5 text-[13px] font-medium transition-all ${tab === t ? 'text-white' : 'text-text-muted hover:text-text-secondary'}`}>
                {t === 'generate' ? '生成' : t === 'history' ? `履歴${history.length > 0 ? ` (${history.length})` : ''}` : '使い方'}
                {tab === t && <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-neon-gradient rounded-full" />}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* API Modal */}
      {showApiModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowApiModal(false) }}>
          <div className="w-full max-w-sm glass-card p-6 border-neon-purple/20">
            <h2 className="font-bold text-base mb-5 text-text-primary">Gemini API キーを設定</h2>
            <ApiKeyForm onSave={saveApiKey} onCancel={() => setShowApiModal(false)} />
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 pb-20">
        {/* ── 生成タブ ── */}
        {tab === 'generate' && (
          <div className="space-y-5 pt-6">
            {/* API キー未設定バナー */}
            {!geminiKey && (
              <div className="glass-card p-5 border-amber-500/25">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">🔑</span>
                  <div>
                    <p className="font-bold text-sm text-amber-400">まず Gemini API キーを設定してください</p>
                    <p className="text-[11px] text-text-muted mt-0.5">無料で利用できます。30秒で取得・設定できます。</p>
                  </div>
                </div>
                <ApiKeyForm onSave={() => { const t = apiKeyInput.trim(); setGeminiKey(t); localStorage.setItem('buzz_key_gemini', t) }} />
              </div>
            )}

            {/* Hero（キー設定済・未生成時） */}
            {ideas.length === 0 && !isGenerating && geminiKey && (
              <div className="pt-4 pb-2">
                <div className="neon-badge mb-4">AI バズ投稿テーマ生成</div>
                <h2 className="text-4xl font-black leading-tight tracking-tight mb-3">
                  <span className="neon-text">フックの強さ</span>が、<br />
                  投稿の刺さりを決める。
                </h2>
                <p className="text-text-secondary text-sm leading-relaxed">
                  テーマと媒体を選ぶだけで、AIがバズネタを<br className="hidden sm:block" />25〜100本まとめて生成します。
                </p>
              </div>
            )}

            {/* 使用量ゲージ */}
            {geminiKey && (
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-text-muted font-medium uppercase tracking-wider">本日の Gemini 無料枠</p>
                  <span className={`text-[12px] font-bold ${gaugeTextColor}`}>{tokenPct.toFixed(1)}% 使用</span>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-text-muted">トークン</span>
                    <span className={gaugeTextColor}>{dailyUsage.tokens.toLocaleString()} / {FREE_TOKEN_LIMIT.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${gaugeColor} transition-all duration-700`} style={{ width: `${tokenPct}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-text-muted">リクエスト数</span>
                    <span className="text-text-secondary">{dailyUsage.requests} / {FREE_REQUEST_LIMIT}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${reqPct >= 90 ? 'from-red-500 to-red-400' : reqPct >= 70 ? 'from-amber-500 to-yellow-400' : 'from-neon-purple to-neon-cyan'} transition-all duration-700`} style={{ width: `${reqPct}%` }} />
                  </div>
                </div>
                {tokenPct >= 90
                  ? <p className="text-[11px] text-red-400 bg-red-500/10 rounded-lg px-3 py-2">⚠ 無料枠の残りがわずかです</p>
                  : <p className="text-[11px] text-text-muted">上限超過時は翌日0時に自動リセット。課金は一切発生しません。</p>
                }
              </div>
            )}

            {/* 設定フォーム */}
            <div className="glass-card p-5 space-y-6">
              {/* 出力先 */}
              <div>
                <p className="text-[11px] text-text-muted mb-3 font-semibold uppercase tracking-widest">出力先</p>
                <div className="grid grid-cols-2 gap-2">
                  {OUTPUT_PLATFORMS.map(p => (
                    <button key={p} onClick={() => setOutputPlatform(p)}
                      className={`py-3 rounded-xl text-sm font-bold transition-all ${
                        outputPlatform === p
                          ? 'bg-neon-gradient text-white shadow-neon-purple'
                          : 'bg-white/[0.04] text-text-secondary hover:bg-white/[0.08] border border-white/[0.06]'
                      }`}>
                      {p}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-text-muted mt-2">{OUTPUT_PLATFORM_DESC[outputPlatform]}</p>
              </div>

              {/* 参考媒体 */}
              <div>
                <p className="text-[11px] text-text-muted mb-3 font-semibold uppercase tracking-widest">参考にする媒体（複数選択可）</p>
                <div className="flex flex-wrap gap-2">
                  {REFERENCE_PLATFORMS.map(p => (
                    <button key={p} onClick={() => toggleReferencePlatform(p)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                        referencePlatforms.has(p)
                          ? 'bg-neon-gradient text-white border-transparent shadow-neon-sm'
                          : 'bg-transparent text-text-muted border-white/10 hover:border-neon-purple/40 hover:text-text-secondary'
                      }`}>
                      {p}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-text-muted mt-2">選んだ媒体のバズパターンをミックスして生成します</p>
              </div>

              {/* テーマ */}
              <div>
                <p className="text-[11px] text-text-muted mb-3 font-semibold uppercase tracking-widest">テーマ・ジャンル</p>
                <div className="flex gap-2 mb-3">
                  {(['manual', 'suggest'] as ThemeMode[]).map(m => (
                    <button key={m} onClick={() => setThemeMode(m)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        themeMode === m ? 'bg-neon-gradient text-white border-transparent shadow-neon-sm' : 'text-text-muted border-white/10 hover:border-neon-purple/40'
                      }`}>
                      {m === 'manual' ? '直接入力' : 'AIに提案させる'}
                    </button>
                  ))}
                </div>

                {themeMode === 'manual' ? (
                  <input type="text" value={manualTheme} onChange={e => setManualTheme(e.target.value)}
                    placeholder="例: ダイエット、副業、筋トレ、子育て..."
                    className="input-neon" onKeyDown={e => e.key === 'Enter' && generate()} />
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <select value={genre} onChange={e => setGenre(e.target.value)}
                        className="flex-1 input-neon appearance-none">
                        <option value="">大ジャンルを選ぶ...</option>
                        {GENRE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                      <button onClick={suggestThemes} disabled={!genre || !geminiKey || isSuggesting}
                        className={`px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                          !genre || !geminiKey || isSuggesting ? 'bg-white/5 text-text-muted cursor-not-allowed' : 'bg-neon-gradient-subtle border border-neon-purple/30 text-neon-purple hover:bg-neon-purple/20'
                        }`}>
                        {isSuggesting ? '生成中...' : 'テーマ提案'}
                      </button>
                    </div>
                    {suggestionError && <p className="text-[12px] text-red-400">{suggestionError}</p>}
                    {suggestedThemes.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] text-text-muted">テーマを1つ選んでください</p>
                        {suggestedThemes.map((t, i) => (
                          <button key={i} onClick={() => setSelectedSuggestion(t)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all border ${
                              selectedSuggestion === t
                                ? 'bg-neon-gradient-subtle border-neon-purple/50 text-text-primary font-semibold shadow-neon-sm'
                                : 'bg-white/[0.03] text-text-secondary border-white/[0.06] hover:border-neon-purple/30'
                            }`}>
                            {t}
                          </button>
                        ))}
                        <p className="text-[11px] text-text-muted">※ AIの学習データに基づく提案です（リアルタイムトレンドではありません）</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 生成本数 */}
              <div>
                <p className="text-[11px] text-text-muted mb-3 font-semibold uppercase tracking-widest">生成本数</p>
                <div className="flex gap-2">
                  {[25, 50, 100].map(n => (
                    <button key={n} onClick={() => setCount(n)}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                        count === n ? 'bg-neon-gradient text-white shadow-neon-purple' : 'bg-white/[0.04] text-text-secondary hover:bg-white/[0.08] border border-white/[0.06]'
                      }`}>
                      {n}本
                    </button>
                  ))}
                </div>
              </div>

              {/* 生成ボタン */}
              <button onClick={generate} disabled={!canGenerate}
                className={`w-full py-4 rounded-xl font-bold text-[15px] transition-all ${
                  canGenerate ? 'neon-button' : 'bg-white/5 text-text-muted cursor-not-allowed'
                }`}>
                {isGenerating ? '生成中...' : `${count}本まとめて生成する`}
              </button>

              {/* プログレス */}
              {(isGenerating || (progress > 0 && progress < 100)) && (
                <div>
                  <div className="flex justify-between text-[11px] text-text-muted mb-1.5">
                    <span>{progressMsg}</span><span>{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-neon-purple to-neon-cyan rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              {!isGenerating && progress === 100 && progressMsg && (
                <p className="text-[12px] text-neon-cyan text-center">{progressMsg}</p>
              )}

              {/* エラー */}
              {error && (
                isQuotaError ? (
                  <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-4 space-y-1">
                    <p className="text-[13px] text-amber-400 font-bold">本日の無料枠を使い切りました</p>
                    <p className="text-[12px] text-text-secondary">翌日0時（日本時間）に自動でリセットされます。</p>
                    <p className="text-[12px] text-text-muted">課金は一切発生しません。明日また使えます。</p>
                  </div>
                ) : (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <p className="text-[12px] text-red-400">{error}</p>
                  </div>
                )
              )}
            </div>

            {/* 生成結果 */}
            {ideas.length > 0 && currentGen && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-bold text-base text-text-primary">{currentGen.theme}</p>
                    <p className="text-[12px] text-text-muted">{currentGen.outputPlatform} · {ideas.length}本</p>
                  </div>
                  <button onClick={() => exportCSV(ideas, currentGen.theme, currentGen.outputPlatform)}
                    className="flex items-center gap-1.5 px-4 py-2 glass-card border-neon-purple/20 rounded-xl text-[13px] font-semibold text-neon-purple hover:shadow-neon-sm transition-all">
                    ↓ CSV保存
                  </button>
                </div>
                <div className="space-y-2.5">
                  {ideas.map(idea => (
                    <div key={idea.id} className="glass-card-hover p-4 group">
                      <div className="flex items-start gap-3">
                        <span className="text-[11px] text-neon-purple/60 font-mono mt-0.5 min-w-[2.5rem] shrink-0">
                          #{String(idea.id).padStart(2, '0')}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[14px] leading-snug mb-1.5 text-text-primary">{idea.hook}</p>
                          <p className="text-text-secondary text-[12px] leading-relaxed">{idea.body}</p>
                          {idea.hashtags && <p className="text-neon-cyan text-[11px] mt-2">{idea.hashtags}</p>}
                        </div>
                        <button onClick={() => copyIdea(idea)}
                          className="text-[11px] text-text-muted hover:text-neon-cyan px-2 py-1 rounded-lg hover:bg-neon-cyan/10 transition-all shrink-0 opacity-0 group-hover:opacity-100">
                          {copiedId === idea.id ? '✓' : 'コピー'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => exportCSV(ideas, currentGen.theme, currentGen.outputPlatform)}
                  className="w-full mt-4 py-3.5 glass-card border-neon-purple/20 rounded-xl text-sm font-semibold text-neon-purple hover:shadow-neon-sm transition-all">
                  全{ideas.length}本をCSVエクスポート
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── 履歴タブ ── */}
        {tab === 'history' && (
          <div className="pt-6 space-y-4">
            <h2 className="font-bold text-base text-text-primary">生成履歴</h2>
            {history.length === 0 ? (
              <div className="text-center py-20 text-text-muted">
                <p className="text-5xl mb-4">📭</p>
                <p className="text-sm">まだ履歴がありません</p>
                <p className="text-[12px] mt-1">生成タブでアイデアを作成してください</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {history.map(gen => (
                  <div key={gen.id} className="glass-card p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-sm text-text-primary">{gen.theme}</p>
                        <p className="text-[11px] text-text-muted mt-0.5">
                          {gen.outputPlatform} · {gen.count}本 · Gemini ·{' '}
                          {new Date(gen.createdAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <button onClick={() => deleteHistory(gen.id)} className="text-[11px] text-text-muted hover:text-red-400 px-2 py-1 transition-colors">削除</button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => loadFromHistory(gen)} className="flex-1 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg text-[13px] font-medium hover:bg-white/[0.08] hover:border-neon-purple/30 transition-all text-text-secondary">読み込む</button>
                      <button onClick={() => exportCSV(gen.ideas, gen.theme, gen.outputPlatform)} className="flex-1 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg text-[13px] font-medium hover:bg-white/[0.08] hover:border-neon-cyan/30 transition-all text-text-secondary">CSV保存</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 使い方タブ ── */}
        {tab === 'guide' && (
          <div className="pt-6 space-y-5">
            <h2 className="font-bold text-base text-text-primary">使い方</h2>
            <div className="space-y-3">
              {[
                { step: '1', title: 'Gemini APIキーを設定する', body: '画面上部またはヘッダーの「API未設定」ボタンからキーを入力。Gemini API は無料枠で利用できます。' },
                { step: '2', title: '出力先を選ぶ', body: 'Threads または Instagram を選択。それぞれの文体・長さ・ハッシュタグ使用量に最適化されたアイデアが生成されます。' },
                { step: '3', title: '参考にする媒体を選ぶ', body: 'YouTube・Threads・TikTok・X・Instagramから複数選択可。選んだ媒体のバズパターンをミックスして生成します。' },
                { step: '4', title: 'テーマを決める', body: '「直接入力」でテーマを自由記述、または「AIに提案させる」で大ジャンルを選んで具体テーマを5案自動生成。' },
                { step: '5', title: '生成してCSVエクスポート', body: '25/50/100本を選んで「生成する」。完了後にCSVエクスポートでスプレッドシートに保存できます。' },
              ].map(({ step, title, body }) => (
                <div key={step} className="glass-card p-4 flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-neon-gradient flex items-center justify-center text-xs font-black text-white shrink-0 mt-0.5 shadow-neon-sm">{step}</div>
                  <div>
                    <p className="font-semibold text-sm mb-1 text-text-primary">{title}</p>
                    <p className="text-[12px] text-text-secondary leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-card p-5 border-neon-purple/20 space-y-4">
              <p className="text-sm font-bold text-neon-purple">🔑 Gemini APIキーの取得（無料）</p>
              <div className="space-y-2.5">
                {HOW_TO_GET_KEY.map(({ step, text }) => (
                  <div key={step} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-neon-gradient flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">{step}</div>
                    <p className="text-[12px] text-text-secondary">{text}</p>
                  </div>
                ))}
              </div>
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
                className="block text-center py-2.5 bg-neon-gradient-subtle border border-neon-purple/30 rounded-xl text-[13px] text-neon-purple font-semibold hover:bg-neon-purple/20 transition-colors">
                Google AI Studio を開く →
              </a>
              <p className="text-[11px] text-text-muted">無料枠: 15 RPM・1日100万トークン・自動課金なし・翌日0時リセット</p>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-white/[0.06] py-6 px-4 text-center">
        <div className="flex justify-center gap-6 text-[12px] text-text-muted">
          <a href="/terms" className="hover:text-neon-purple transition-colors">利用規約</a>
          <a href="/privacy" className="hover:text-neon-cyan transition-colors">プライバシーポリシー</a>
        </div>
        <p className="text-[11px] text-text-muted/50 mt-2">© 2026 バズネタ100本ジェネレーター</p>
      </footer>
    </div>
  )
}
