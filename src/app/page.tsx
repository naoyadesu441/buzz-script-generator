'use client'

import { useState, useEffect } from 'react'

type Platform = 'YouTube' | 'Threads' | 'TikTok' | 'X'
type Tab = 'generate' | 'history' | 'guide'

interface PostIdea {
  id: number
  hook: string
  body: string
  hashtags: string
}

interface Generation {
  id: string
  theme: string
  platform: Platform
  count: number
  ideas: PostIdea[]
  createdAt: string
}

const PLATFORMS: Platform[] = ['YouTube', 'Threads', 'TikTok', 'X']

const PLATFORM_DESC: Record<Platform, string> = {
  YouTube: 'YouTubeの動画タイトル・サムネコピー',
  Threads: 'Threadsのテキスト投稿',
  TikTok: 'TikTokの動画キャプション',
  X: 'X(Twitter)の投稿文',
}

export default function Home() {
  const [tab, setTab] = useState<Tab>('generate')
  const [apiKey, setApiKey] = useState('')
  const [showApiModal, setShowApiModal] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [theme, setTheme] = useState('')
  const [platform, setPlatform] = useState<Platform>('X')
  const [count, setCount] = useState(100)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  const [ideas, setIdeas] = useState<PostIdea[]>([])
  const [currentGen, setCurrentGen] = useState<{ theme: string; platform: Platform } | null>(null)
  const [history, setHistory] = useState<Generation[]>([])
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const key = localStorage.getItem('buzz_api_key') || ''
    const hist = localStorage.getItem('buzz_history')
    if (key) setApiKey(key)
    if (hist) {
      try { setHistory(JSON.parse(hist)) } catch {}
    }
  }, [])

  const saveApiKey = () => {
    const trimmed = apiKeyInput.trim()
    setApiKey(trimmed)
    localStorage.setItem('buzz_api_key', trimmed)
    setShowApiModal(false)
    setApiKeyInput('')
  }

  const openApiModal = () => {
    setApiKeyInput(apiKey)
    setShowApiModal(true)
  }

  const generate = async () => {
    if (!apiKey || !theme.trim() || isGenerating) return
    setIsGenerating(true)
    setProgress(5)
    setProgressMsg('APIに接続中...')
    setIdeas([])
    setCurrentGen(null)
    setError('')

    try {
      setProgress(20)
      setProgressMsg(`${count}本のアイデアを生成中...（30〜60秒かかります）`)

      const prompt = `テーマ「${theme}」について${PLATFORM_DESC[platform]}を${count}本生成してください。

必ず以下のJSON形式のみで返答してください（前後に説明文・コードブロック不要）:
{"ideas":[{"id":1,"hook":"フック（最初の一行。読者が止まる強い言葉）","body":"本文（2〜3行。hookの続き）","hashtags":"#タグ1 #タグ2"},{"id":2,"hook":"...","body":"...","hashtags":"..."}]}

条件：
- hookは数字・問いかけ・共感・驚き・逆説・リスト型など多様なパターンを使い分ける
- ${platform}の文化・文体・長さに最適化する
- 全${count}件、内容の重複なし
- 日本語で出力`

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
          max_tokens: count <= 25 ? 4000 : count <= 50 ? 6000 : 10000,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error((errData as { error?: { message?: string } }).error?.message || `APIエラー: ${res.status}`)
      }

      setProgress(85)
      setProgressMsg('データを解析中...')

      const apiData = await res.json()
      const text: string = apiData.content?.[0]?.text || ''
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
      setCurrentGen({ theme: theme.trim(), platform })
      setProgress(100)
      setProgressMsg(`${newIdeas.length}本の生成が完了しました！`)

      const gen: Generation = {
        id: Date.now().toString(),
        theme: theme.trim(),
        platform,
        count: newIdeas.length,
        ideas: newIdeas,
        createdAt: new Date().toISOString(),
      }
      const newHistory = [gen, ...history].slice(0, 20)
      setHistory(newHistory)
      localStorage.setItem('buzz_history', JSON.stringify(newHistory))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
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
    setCurrentGen({ theme: gen.theme, platform: gen.platform })
    setTheme(gen.theme)
    setPlatform(gen.platform)
    setTab('generate')
  }

  const deleteHistory = (id: string) => {
    const updated = history.filter(h => h.id !== id)
    setHistory(updated)
    localStorage.setItem('buzz_history', JSON.stringify(updated))
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/[0.08]">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-base font-bold tracking-tight">バズネタ100本ジェネレーター</h1>
              <p className="text-[11px] text-gray-500 mt-0.5">SNS投稿アイデアをAIが一括生成</p>
            </div>
            <button
              onClick={openApiModal}
              className={`text-[11px] px-3 py-1.5 rounded-full border font-medium transition-all ${
                apiKey
                  ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'
                  : 'border-amber-500/50 text-amber-400 bg-amber-500/10'
              }`}
            >
              {apiKey ? '✓ API設定済' : '⚠ API未設定'}
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
                {tab === t && (
                  <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-white rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* API Key Modal */}
      {showApiModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowApiModal(false) }}
        >
          <div className="w-full max-w-sm bg-[#1c1c1c] rounded-2xl p-6 border border-white/10">
            <h2 className="font-bold text-base mb-1">Anthropic APIキー</h2>
            <p className="text-[12px] text-gray-400 mb-4">
              キーはブラウザのLocalStorageにのみ保存されます。サーバーには送信されません。
            </p>
            <input
              type="password"
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full bg-[#0a0a0a] border border-white/15 rounded-xl px-4 py-3 text-sm font-mono mb-4 focus:outline-none focus:border-white/30 placeholder-gray-700"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && saveApiKey()}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowApiModal(false)}
                className="flex-1 py-2.5 border border-white/15 rounded-xl text-sm text-gray-400"
              >
                キャンセル
              </button>
              <button
                onClick={saveApiKey}
                className="flex-1 py-2.5 bg-white text-black rounded-xl text-sm font-bold"
              >
                保存
              </button>
            </div>
            <p className="text-[11px] text-gray-600 mt-3 text-center">
              APIキーは console.anthropic.com で取得できます
            </p>
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 pb-16">
        {/* ── 生成タブ ── */}
        {tab === 'generate' && (
          <div className="space-y-5 pt-5">
            {/* Hero (no results yet) */}
            {ideas.length === 0 && !isGenerating && (
              <div className="py-2 pb-4">
                <h2 className="text-3xl font-black leading-tight tracking-tight mb-2">
                  フックの強さが、<br />投稿の刺さりを決める。
                </h2>
                <p className="text-gray-500 text-sm">
                  テーマと媒体を選んで、AIがバズネタを一括生成します
                </p>
              </div>
            )}

            {/* Form card */}
            <div className="bg-[#161616] rounded-2xl p-5 space-y-5 border border-white/[0.06]">
              {/* Platform selector */}
              <div>
                <p className="text-[11px] text-gray-500 mb-2 font-medium uppercase tracking-wider">媒体</p>
                <div className="grid grid-cols-4 gap-2">
                  {PLATFORMS.map(p => (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                        platform === p
                          ? 'bg-white text-black'
                          : 'bg-[#222] text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-600 mt-1.5">{PLATFORM_DESC[platform]}</p>
              </div>

              {/* Theme input */}
              <div>
                <p className="text-[11px] text-gray-500 mb-2 font-medium uppercase tracking-wider">テーマ・ジャンル</p>
                <input
                  type="text"
                  value={theme}
                  onChange={e => setTheme(e.target.value)}
                  placeholder="例: ダイエット、副業、筋トレ、子育て..."
                  className="w-full bg-[#0a0a0a] border border-white/[0.12] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/25 placeholder-gray-700 transition-colors"
                  onKeyDown={e => e.key === 'Enter' && generate()}
                />
              </div>

              {/* Count selector */}
              <div>
                <p className="text-[11px] text-gray-500 mb-2 font-medium uppercase tracking-wider">生成本数</p>
                <div className="flex gap-2">
                  {[25, 50, 100].map(n => (
                    <button
                      key={n}
                      onClick={() => setCount(n)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        count === n
                          ? 'bg-white text-black'
                          : 'bg-[#222] text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200'
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
                disabled={isGenerating || !apiKey || !theme.trim()}
                className={`w-full py-4 rounded-xl font-bold text-[15px] transition-all ${
                  isGenerating || !apiKey || !theme.trim()
                    ? 'bg-[#222] text-gray-600 cursor-not-allowed'
                    : 'bg-white text-black hover:bg-gray-100 active:scale-[0.98]'
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

              {/* Success message */}
              {!isGenerating && progress === 100 && progressMsg && (
                <p className="text-[12px] text-emerald-400 text-center">{progressMsg}</p>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <p className="text-[12px] text-red-400">{error}</p>
                </div>
              )}

              {/* No API key warning */}
              {!apiKey && !isGenerating && (
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
                    <p className="text-[12px] text-gray-500">{currentGen.platform} · {ideas.length}本</p>
                  </div>
                  <button
                    onClick={() => exportCSV(ideas, currentGen.theme, currentGen.platform)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1c1c1c] border border-white/15 rounded-xl text-[13px] font-semibold hover:bg-[#252525] transition-all"
                  >
                    <span>↓</span> CSV保存
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
                          <p className="font-semibold text-[14px] leading-snug mb-1.5 text-white">{idea.hook}</p>
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
                  onClick={() => exportCSV(ideas, currentGen.theme, currentGen.platform)}
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
                  <div
                    key={gen.id}
                    className="bg-[#161616] rounded-xl p-4 border border-white/[0.06]"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-sm">{gen.theme}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {gen.platform} · {gen.count}本 ·{' '}
                          {new Date(gen.createdAt).toLocaleDateString('ja-JP', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
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
                        onClick={() => exportCSV(gen.ideas, gen.theme, gen.platform)}
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
                  step: '1',
                  title: 'APIキーを設定する',
                  body: '右上の「API未設定」をタップ。Anthropic APIキー（sk-ant-...）を入力して保存。キーはブラウザのLocalStorageにのみ保存され、サーバーには送信されません。',
                },
                {
                  step: '2',
                  title: '媒体とテーマを入力',
                  body: 'YouTube / Threads / TikTok / X から投稿先を選択。テーマ欄に「ダイエット」「副業」「筋トレ」など投稿ジャンルを入力。',
                },
                {
                  step: '3',
                  title: '生成本数を選んで実行',
                  body: '25 / 50 / 100本から選択。「生成する」ボタンをタップすると、AIが30〜60秒でアイデアを一括生成します。',
                },
                {
                  step: '4',
                  title: '使いたいネタをコピー',
                  body: '各カードにマウスを当てると「コピー」ボタンが表示されます。フック・本文・ハッシュタグが一括コピーされます。',
                },
                {
                  step: '5',
                  title: 'CSVでエクスポート',
                  body: '結果画面の「CSVエクスポート」ボタンから全件ダウンロード。スプレッドシートで管理・編集できます。履歴からも再エクスポート可能。',
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

            <div className="bg-[#161616] rounded-xl p-4 border border-amber-500/20">
              <p className="text-sm font-bold text-amber-400 mb-2">APIキーの取得方法</p>
              <ol className="text-[12px] text-gray-400 space-y-1 list-decimal list-inside">
                <li>console.anthropic.com にアクセス</li>
                <li>アカウント作成 / ログイン</li>
                <li>左メニュー「API Keys」→「Create Key」</li>
                <li>生成されたキー（sk-ant-...）をコピーして設定</li>
              </ol>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
