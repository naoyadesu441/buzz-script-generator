'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface HistoryItem {
  id: string;
  genre: string;
  created_at: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/results')
      .then((r) => r.json())
      .then(({ results }) => setItems(results ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function deleteItem(id: string) {
    await fetch(`/api/results/${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/diagnose" className="neon-button text-sm px-4 py-2">＋ 新しく生成</Link>
        <h1 className="text-xl font-bold text-text-primary flex-1 text-right">生成履歴</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-secondary mb-6">まだ生成履歴がありません</p>
          <button onClick={() => router.push('/diagnose')} className="neon-button">診断を始める</button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="glass-card p-4 flex items-center gap-3">
              <Link href={`/result/${item.id}`} className="flex-1 min-w-0">
                <p className="font-bold text-neon-purple">{item.genre}</p>
                <p className="text-xs text-text-muted mt-1">
                  {new Date(item.created_at).toLocaleString('ja-JP')}
                </p>
              </Link>
              <button
                onClick={() => deleteItem(item.id)}
                className="text-xs text-text-muted hover:text-red-400 flex-shrink-0"
              >
                削除
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
