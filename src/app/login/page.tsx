"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="glass-card p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-display font-bold mb-2 neon-text">バズスクリプト</h1>
        <p className="text-text-secondary mb-8">Googleでログインしてペルソナ生成を始める</p>
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full neon-button flex items-center justify-center gap-3"
        >
          {loading ? "認証中..." : "Googleで続ける"}
        </button>
        <p className="text-xs text-text-muted mt-6">
          ログインすることで
          <a href="/terms" className="underline hover:text-neon-purple">利用規約</a>
          と
          <a href="/privacy" className="underline hover:text-neon-purple">プライバシーポリシー</a>
          に同意したものとみなします。
        </p>
      </div>
    </main>
  );
}
