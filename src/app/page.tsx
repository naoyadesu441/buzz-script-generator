'use client'

import { useState, useEffect } from 'react'

type Provider = 'gemini' | 'claude'
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
  provider: Provider
  count: number
  ideas: PostIdea[]
  createdAt: string
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

export default function Home() {
  const [tab, setTab] = useState<Tab>('generate')

  // API Provider
  const [provider, setProvider] = useState<Provider>('gemini')
  const [geminiKey, setGeminiKey] = useState('')
  const [claudeKey, setClaudeKey] = useState('')
  const [showApiModal, setShowApiModal] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [providerInput, setProviderInput] = useState<Provider>('gemini')

  // Generation settings
  const [outputPlatform, setOutputPlatform] = useState<OutputPlatform>('Threads')
  const [referencePlatforms, setReferencePlatforms] = useState<Set<ReferencePlatform>>(
    new Set(REFERENCE_PLATFORMS)
  )
  const [count, setCount] = useState(100)

  // Theme
  const [themeMode, setThemeMode] = useState<ThemeMode>('manual')
  const [manualTheme, setManualTheme] = useState('')
  const [genre, setGenre] = useState('')
  const [suggestedThemes, setSuggestedThemes] = useState<string[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState('')
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [suggestionError, setSuggestionError] = useState('')

  // Generation
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  const [ideas, setIdeas] = useState<PostIdea[]>([])
  const [currentGen, setCurrentGen] = useState<{ theme: string; outputPlatform: OutputPlatform } | null>(null)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState<number | null>(null)

  // History
  const [history, setHistory] = useState<Generation[]>([])

  useEffect(() => {
    const prov = (localStorage.getItem('buzz_provider') as Provider) || 'gemini'
    const gKey = localStorage.getItem('buzz_key_gemini') || ''
    const cKey = localStorage.getItem('buzz_key_claude') || ''
    const hist = localStorage.getItem('buzz_history')
    setProvider(prov)
    setGeminiKey(gKey)
    setClaudeKey(cKey)
    if (hist) { try { setHistory(JSON.parse(hist)) } catch {} }
  }, [])

  const currentKey = provider === 'gemini' ? geminiKey : claudeKey

  const openApiModal = () => {
    setProviderInput(provider)
    setApiKeyInput(provider === 'gemini' ? geminiKey : claudeKey)
    setShowApiModal(true)
  }

  const saveApiKey = () => {
    const trimmed = apiKeyInput.trim()
    setProvider(providerInput)
    localStorage.setItem('buzz_provider', providerInput)
    if (providerInput === 'gemini') {
      setGeminiKey(trimmed)
      localStorage.setItem('buzz_key_gemini', trimmed)
    } else {
      setClaudeKey(trimmed)
      localStorage.setItem('buzz_key_claude', trimmed)
    }
    setShowApiModal(false)
  }

  const toggleReferencePlatform = (p: ReferencePlatform) => {
    const next = new Set(referencePlatforms)
    if (next.has(p)) {
      if (next.size > 1) next.delete(p)
    } else {
      next.add(p)
    }
    setReferencePlatforms(next)
  }

  const callLLM = async (prompt: string, maxTokens: number): Promise<string> => {
    if (provider === 'gemini') {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${currentKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              maxOutputTokens: maxTokens,
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        }
      )
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error((d as { error?: { message?: string } }).error?.message || `Gemini APIエラー: ${res.status}`)
      }
      const d = await res.json()
      return d.candidates?.[0]?.content?.parts?.[0]?.text || ''
    } else {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': currentKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error((d as { error?: { message?: string } }).error?.message || `Claude APIエラー: ${res.status}`)
      }
      const d = await res.json()
      return d.content?.[0]?.text || ''
    }
  }

  const suggestThemes = async () => {
    if (!genre || !currentKey || isSuggesting) return
    setIsSuggesting(true)
    setSuggestedThemes([])
    setSelectedSuggestion('')
    setSuggestionError('')

    const refList = Array.from(referencePlatforms).join('、')
    const prompt = `大ジャンル「${genre}」について、${refList} でよく伸びる投稿の具体的なサブテーマを5つ提案してください。キャッチーで具体的なものを選んでください。

JSON形式のみで返答（説明文不要）:
{"themes":["テーマ1","テーマ2","テーマ3","テーマ4","テーマ5"]}`

    try {
      const text = await callLLM(prompt, 512)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('解析失敗。再度お試しください。')
      const data = JSON.parse(jsonMatch[0])
      setSuggestedThemes(data.themes || [])
    } catch (err: unknown) {
      setSuggestionError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsSuggesting(false)
    }
  }

  const activeTheme = themeMode === 'manual' ? manualTheme : selectedSuggestion

  const generate = async () => {
    if (!currentKey || !activeTheme.trim() || isGenerating) return
    setIsGenerating(true)
    setProgress(5)
    setProgressMsg('APIに接続中...')
    setIdeas([])
    setCurrentGen(null)
    setError('')

    try {
      setProgress(20)
      setProgressMsg(`${count}本のアイデアを生成中...（30〜60秒かかります）`)

      const refList = Array.from(referencePlatforms)
      const refStyles = refList
        .map(p => `・${p}: ${REFERENCE_PLATFORM_STYLE[p as ReferencePlatform]}`)
        .join('\n')

      const prompt = `あなたはSNS投稿のバズプロデューサーです。

【出力先】${outputPlatform}（${OUTPUT_PLATFORM_DESC[outputPlatform]}）
【参考にするバズパターン（ミックスして活用）】
${refStyles}
【テーマ】${activeTheme.trim()}

上記を踏まえ、${count}本のバズる投稿アイデアをJSON形式のみで返してください（前後の説明文不要）:
{"ideas":[{"id":1,"hook":"読者が止まる強い一行","body":"本文（${outputPlatform}の最適な長さ・文体）","hashtags":"#タグ1 #タグ2"},{"id":2,"hook":"...","body":"...","hashtags":"..."},...]}

ルール:
- hookは数字・問いかけ・共感・驚き・逆説など多様なパターンで
- bodyは${outputPlatform}に最適な長さ・文体・改行
- 全${count}件、内容重複なし
- 日本語で出力`

      const maxTok = count <= 25 ? 8000 : count <= 50 ? 16000 : 32000
      const text = await callLLM(prompt, maxTok)

      setProgress(85)
      setProgressMsg('データを解析中...')

      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('レスポンスの解析に失敗しました。再度お試しください。')

      const data = JSON.parse(jsonMatch[0])
      const newIdeas: PostIdea[] = (data.ideas || []).map((i: PostIdea) => ({
        id: i.id,
        hook: i.hook || '',
        body: i.body || '',
        hashtags: i.hashtags || '',
      }))

      setIdeas(newIdeas)
      setCurrentGen({ theme: activeTheme.trim(), outputPlatform })
      setProgress(100)
      setProgressMsg(`${newIdeas.length}本の生成が完了しました！`)

      const gen: Generation = {
        id: Date.now().toString(),
        theme: activeTheme.trim(),
        outputPlatform,
        referencePlatforms: refList,
        provider,
        count: newIdeas.length,
        ideas: newIdeas,
        createdAt: new Date().toISOString(),
      }
      const newHistory = [gen, ...history].slice(0, 20)
      setHistory(newHistory)
      localStorage.setItem('buzz_history', JSON.stringify(newHistory))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
      setProgress(0)
      setProgressMsg('')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyIdea = async (idea: PostIdea) => {
    const text = [idea.hook, idea.body, idea.hashtags].filter(Boolean).join('\n\n')
    await navigator.clipboard.writeText(text)
    setCopiedId(idea.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const exportCSV = (targetIdeas: PostIdea[], targetTheme: string, targetPlatform: string) => {
    const BOM = '﻿'
    const header = 'ID,フック,本文,ハッシュタグ\n'
    const rows = targetIdeas
      .map(i => `${i.id},"${i.hook.replace(/"/g, '""')}","${i.body.replace(/"/g, '""')}","${i.hashtags.replace(/"/g, '""')}"`)
      .join('\n')
    const blob = new Blob([BOM + header + rows], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `buzz-${targetTheme}-${targetPlatform}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const loadFromHistory = (gen: Generation) => {
    setIdeas(gen.ideas)
    setCurrentGen({ theme: gen.theme, outputPlatform: gen.outputPlatform })
    setManualTheme(gen.theme)
    setOutputPlatform(gen.outputPlatform)
    setTab('generate')
  }

  const deleteHistory = (id: string) => {
    const updated = history.filter(h => h.id !== id)
    setHistory(updated)
    localStorage.setItem('buzz_history', JSON.stringify(updated))
  }

  const canGenerate = !!currentKey && !!activeTheme.trim() && !isGenerating

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/[0.08]">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-base font-bold tracking-tight">バズネタ100本ジェネレーター</h1>
              <p className="text-[11px] text-gray-500 mt-0.5">Threads / Instagram 投稿アイデアを一括生成</p>
            </div>
            <button
              onClick={openApiModal}
              className={`text-[11px] px-3 py-1.5 rounded-full border font-medium transition-all ${
                currentKey
                  ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'
                  : 'border-amber-500/50 text-amber-400 bg-amber-500/10'
              }`}
            >
              {currentKey
                ? `✓ ${provider === 'gemini' ? 'Gemini' : 'Claude'} 設定済`
                : '⚠ API未設定'}
            </button>
          </div>

          <div className="flex gap-0">
            {(['generate', 'history', 'guide'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative px-4 py-2.5 text-[13px] font-medium transition-all ${
                  tab === t ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {t === 'generate' ? '生成' : t === 'history' ? `履歴${history.length > 0 ? ` (${history.length})` : ''}` : '使い方'}
                {tab === t && <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-white rounded-full" />}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* API Modal */}
      {showApiModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowApiModal(false) }}
        >
          <div className="w-full max-w-sm bg-[#1c1c1c] rounded-2xl p-6 border border-white/10">
            <h2 className="font-bold text-base mb-4">API設定</h2>

            <p className="text-[11px] text-gray-500 mb-2">使用するAPI</p>
            <div className="flex gap-2 mb-4">
              {(['gemini', 'claude'] as Provider[]).map(p => (
                <button
                  key={p}
                  onClick={() => { setProviderInput(p); setApiKeyInput(p === 'gemini' ? geminiKey : claudeKey) }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    providerInput === p ? 'bg-white text-black' : 'bg-[#2a2a2a] text-gray-400'
                  }`}
                >
                  {p === 'gemini' ? 'Gemini（無料枠）' : 'Claude（有料）'}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-gray-500 mb-2">
              {providerInput === 'gemini'
                ? 'Gemini APIキー（aistudio.google.com → API keys）'
                : 'Anthropic APIキー（console.anthropic.com）'}
            </p>
            <input
              type="password"
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              placeholder={providerInput === 'gemini' ? 'AIza...' : 'sk-ant-...'}
              className="w-full bg-[#0a0a0a] border border-white/15 rounded-xl px-4 py-3 text-sm font-mono mb-3 focus:outline-none focus:border-white/30 placeholder-gray-700"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && saveApiKey()}
            />
            {providerInput === 'gemini' && (
              <p className="text-[11px] text-blue-400 mb-4">無料枠: 15リクエスト/分・100万トークン/日</p>
            )}
            <div className="flex gap-2">
              <button onClick={() => setShowApiModal(false)} className="flex-1 py-2.5 border border-white/15 rounded-xl text-sm text-gray-400">
                キャンセル
              </button>
              <button onClick={saveApiKey} className="flex-1 py-2.5 bg-white text-black rounded-xl text-sm font-bold">
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 pb-16">
        {/* ── 生成タブ ── */}
        {tab === 'generate' && (
          <div className="space-y-5 pt-5">
            {ideas.length === 0 && !isGenerating && (
              <div className="py-2 pb-4">
                <h2 className="text-3xl font-black leading-tight tracking-tight mb-2">
                  フックの強さが、<br />投稿の刺さりを決める。
                </h2>
                <p className="text-gray-500 text-sm">テーマと媒体を選んで、AIがバズネタを一括生成</p>
              </div>
            )}

            <div className="bg-[#161616] rounded-2xl p-5 space-y-5 border border-white/[0.06]">
              {/* Output platform */}
              <div>
                <p className="text-[11px] text-gray-500 mb-2 font-medium uppercase tracking-wider">出力先</p>
                <div className="grid grid-cols-2 gap-2">
                  {OUTPUT_PLATFORMS.map(p => (
                    <button
                      key={p}
                      onClick={() => setOutputPlatform(p)}
                      className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                        outputPlatform === p
                          ? 'bg-white text-black'
                          : 'bg-[#222] text-gray-400 hover:bg-[#2a2a2a]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-600 mt-1.5">{OUTPUT_PLATFORM_DESC[outputPlatform]}</p>
              </div>

              {/* Reference platforms */}
              <div>
                <p className="text-[11px] text-gray-500 mb-2 font-medium uppercase tracking-wider">参考にする媒体（複数選択可）</p>
                <div className="flex flex-wrap gap-2">
                  {REFERENCE_PLATFORMS.map(p => (
                    <button
                      key={p}
                      onClick={() => toggleReferencePlatform(p)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                        referencePlatforms.has(p)
                          ? 'bg-white text-black border-white'
                          : 'bg-transparent text-gray-500 border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-600 mt-1.5">選んだ媒体のバズパターンをミックスして生成します</p>
              </div>

              {/* Theme */}
              <div>
                <p className="text-[11px] text-gray-500 mb-2 font-medium uppercase tracking-wider">テーマ・ジャンル</p>
                <div className="flex gap-2 mb-3">
                  {(['manual', 'suggest'] as ThemeMode[]).map(m => (
                    <button
                      key={m}
                      onClick={() => setThemeMode(m)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        themeMode === m
                          ? 'bg-white text-black border-white'
                          : 'text-gray-500 border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      {m === 'manual' ? '直接入力' : 'AIに提案させる'}
                    </button>
                  ))}
                </div>

                {themeMode === 'manual' ? (
                  <input
                    type="text"
                    value={manualTheme}
                    onChange={e => setManualTheme(e.target.value)}
                    placeholder="例: ダイエット、副業、筋トレ、子育て..."
                    className="w-full bg-[#0a0a0a] border border-white/[0.12] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/25 placeholder-gray-700 transition-colors"
                    onKeyDown={e => e.key === 'Enter' && generate()}
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <select
                        value={genre}
                        onChange={e => setGenre(e.target.value)}
                        className="flex-1 bg-[#0a0a0a] border border-white/[0.12] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/25 text-white appearance-none"
                      >
                        <option value="">大ジャンルを選ぶ...</option>
                        {GENRE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                      <button
                        onClick={suggestThemes}
                        disabled={!genre || !currentKey || isSuggesting}
                        className={`px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                          !genre || !currentKey || isSuggesting
                            ? 'bg-[#222] text-gray-600 cursor-not-allowed'
                            : 'bg-[#333] text-white hover:bg-[#3a3a3a]'
                        }`}
                      >
                        {isSuggesting ? '生成中...' : 'テーマ提案'}
                      </button>
                    </div>

                    {suggestionError && (
                      <p className="text-[12px] text-red-400">{suggestionError}</p>
                    )}

                    {suggestedThemes.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] text-gray-500">テーマを1つ選んでください</p>
                        {suggestedThemes.map((t, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedSuggestion(t)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all border ${
                              selectedSuggestion === t
                                ? 'bg-white text-black border-white font-semibold'
                                : 'bg-[#0a0a0a] text-gray-300 border-white/10 hover:border-white/25'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                        <p className="text-[11px] text-gray-600">※ AIの学習データに基づく提案です（リアルタイムトレンドではありません）</p>
                      </div>
                    )}

                    {!currentKey && (
                      <p className="text-[12px] text-amber-400">右上でAPIキーを設定すると提案が使えます</p>
                    )}
                  </div>
                )}
              </div>

              {/* Count */}
              <div>
                <p className="text-[11px] text-gray-500 mb-2 font-medium uppercase tracking-wider">生成本数</p>
                <div className="flex gap-2">
                  {[25, 50, 100].map(n => (
                    <button
                      key={n}
                      onClick={() => setCount(n)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        count === n ? 'bg-white text-black' : 'bg-[#222] text-gray-400 hover:bg-[#2a2a2a]'
                      }`}
                    >
                      {n}本
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <button
                onClick={generate}
                disabled={!canGenerate}
                className={`w-full py-4 rounded-xl font-bold text-[15px] transition-all ${
                  canGenerate
                    ? 'bg-white text-black hover:bg-gray-100 active:scale-[0.98]'
                    : 'bg-[#222] text-gray-600 cursor-not-allowed'
                }`}
              >
                {isGenerating ? '生成中...' : `${count}本まとめて生成する`}
              </button>

              {/* Progress */}
              {(isGenerating || (progress > 0 && progress < 100)) && (
                <div>
                  <div className="flex justify-between text-[11px] text-gray-500 mb-1.5">
                    <span>{progressMsg}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1 bg-[#222] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {!isGenerating && progress === 100 && progressMsg && (
                <p className="text-[12px] text-emerald-400 text-center">{progressMsg}</p>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <p className="text-[12px] text-red-400">{error}</p>
                </div>
              )}

              {!currentKey && !isGenerating && (
                <p className="text-[12px] text-amber-400 text-center">
                  右上の「API未設定」をタップしてAPIキーを設定してください
                </p>
              )}
            </div>

            {/* Results */}
            {ideas.length > 0 && currentGen && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-bold text-base">{currentGen.theme}</p>
                    <p className="text-[12px] text-gray-500">{currentGen.outputPlatform} · {ideas.length}本</p>
                  </div>
                  <button
                    onClick={() => exportCSV(ideas, currentGen.theme, currentGen.outputPlatform)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1c1c1c] border border-white/15 rounded-xl text-[13px] font-semibold hover:bg-[#252525] transition-all"
                  >
                    ↓ CSV保存
                  </button>
                </div>

                <div className="space-y-2.5">
                  {ideas.map(idea => (
                    <div
                      key={idea.id}
                      className="bg-[#161616] rounded-xl p-4 border border-white/[0.06] hover:border-white/[0.12] transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-[11px] text-gray-600 font-mono mt-0.5 min-w-[2.5rem] shrink-0">
                          #{String(idea.id).padStart(2, '0')}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[14px] leading-snug mb-1.5">{idea.hook}</p>
                          <p className="text-gray-400 text-[12px] leading-relaxed">{idea.body}</p>
                          {idea.hashtags && (
                            <p className="text-[#4da6ff] text-[11px] mt-2">{idea.hashtags}</p>
                          )}
                        </div>
                        <button
                          onClick={() => copyIdea(idea)}
                          className="text-[11px] text-gray-600 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-all shrink-0 opacity-0 group-hover:opacity-100"
                        >
                          {copiedId === idea.id ? '✓' : 'コピー'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => exportCSV(ideas, currentGen.theme, currentGen.outputPlatform)}
                  className="w-full mt-4 py-3.5 bg-[#161616] border border-white/15 rounded-xl text-sm font-semibold hover:bg-[#1c1c1c] transition-all"
                >
                  全{ideas.length}本をCSVエクスポート
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── 履歴タブ ── */}
        {tab === 'history' && (
          <div className="pt-5 space-y-4">
            <h2 className="font-bold text-base">生成履歴</h2>
            {history.length === 0 ? (
              <div className="text-center py-16 text-gray-600">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-sm">まだ履歴がありません</p>
                <p className="text-[12px] mt-1">生成タブでアイデアを作成してください</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {history.map(gen => (
                  <div key={gen.id} className="bg-[#161616] rounded-xl p-4 border border-white/[0.06]">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-sm">{gen.theme}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {gen.outputPlatform} · {gen.count}本 · {(gen.provider || 'gemini').toUpperCase()} ·{' '}
                          {new Date(gen.createdAt).toLocaleDateString('ja-JP', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteHistory(gen.id)}
                        className="text-[11px] text-gray-600 hover:text-red-400 px-2 py-1 transition-colors"
                      >
                        削除
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadFromHistory(gen)}
                        className="flex-1 py-2 bg-[#222] rounded-lg text-[13px] font-medium hover:bg-[#2a2a2a] transition-all"
                      >
                        読み込む
                      </button>
                      <button
                        onClick={() => exportCSV(gen.ideas, gen.theme, gen.outputPlatform)}
                        className="flex-1 py-2 bg-[#222] rounded-lg text-[13px] font-medium hover:bg-[#2a2a2a] transition-all"
                      >
                        CSV保存
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 使い方タブ ── */}
        {tab === 'guide' && (
          <div className="pt-5 space-y-5">
            <h2 className="font-bold text-base">使い方</h2>
            <div className="space-y-3">
              {[
                {
                  step: '1', title: 'APIキーを設定する',
                  body: '右上のボタンをタップ。Gemini（無料枠）またはClaude（有料）を選択してAPIキーを入力して保存。キーはブラウザのLocalStorageにのみ保存されます。',
                },
                {
                  step: '2', title: '出力先を選ぶ',
                  body: 'Threads または Instagram を選択。それぞれの文体・長さ・ハッシュタグ使用量に最適化されたアイデアが生成されます。',
                },
                {
                  step: '3', title: '参考にする媒体を選ぶ',
                  body: 'YouTube・Threads・TikTok・X・Instagramから複数選択可。選んだ媒体のバズパターンをミックスして生成します。',
                },
                {
                  step: '4', title: 'テーマを決める',
                  body: '「直接入力」でテーマを自由記述、または「AIに提案させる」で大ジャンルを選んで具体テーマを5案自動生成。',
                },
                {
                  step: '5', title: '生成してCSVエクスポート',
                  body: '25/50/100本を選んで「生成する」。完了後にCSVエクスポートでスプレッドシートに保存できます。履歴からも再エクスポート可能。',
                },
              ].map(({ step, title, body }) => (
                <div key={step} className="flex gap-4 bg-[#161616] rounded-xl p-4 border border-white/[0.06]">
                  <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    {step}
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-1">{title}</p>
                    <p className="text-[12px] text-gray-400 leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#161616] rounded-xl p-4 border border-blue-500/20">
              <p className="text-sm font-bold text-blue-400 mb-2">Gemini APIキーの取得（無料）</p>
              <ol className="text-[12px] text-gray-400 space-y-1 list-decimal list-inside">
                <li>aistudio.google.com にアクセス</li>
                <li>Googleアカウントでログイン</li>
                <li>「Get API key」→「Create API key」</li>
                <li>生成されたキー（AIza...）をコピーして設定</li>
              </ol>
              <p className="text-[11px] text-gray-600 mt-2">無料枠: 15リクエスト/分・100万トークン/日</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
