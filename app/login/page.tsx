"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/");
    });
  }, [router]);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim()) return;
    setOtpLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: "email",
    });

    setOtpLoading(false);
    if (error) {
      setError(error.message);
    } else {
      router.replace("/");
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo mark */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Time Audit</h1>
          <p className="mt-1 text-sm text-muted">Track where your time actually goes</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          {sent ? (
            <div className="py-2">
              <div className="text-center mb-5">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-foreground">Check your email</p>
                <p className="mt-1 text-xs text-muted">
                  We sent a link and 6-digit code to <span className="text-foreground">{email}</span>
                </p>
              </div>

              {/* OTP code input — works in PWA/iPhone without a redirect */}
              <form onSubmit={handleOtpSubmit} className="space-y-3">
                <div>
                  <label htmlFor="otp" className="block text-xs font-medium text-muted mb-1.5">
                    Enter the 6-digit code from the email
                  </label>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    autoFocus
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors tracking-widest text-center"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-400">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={otpLoading || otp.length < 6}
                  className="w-full rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-medium text-white transition-colors"
                >
                  {otpLoading ? "Signing in…" : "Sign in with code"}
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-muted">
                Or click the magic link in the email if you&apos;re on a laptop.
              </p>

              <button
                onClick={() => { setSent(false); setEmail(""); setOtp(""); setError(null); }}
                className="mt-3 w-full text-center text-xs text-accent hover:text-accent-hover transition-colors"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-muted mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                />
              </div>

              {error && (
                <p className="text-xs text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-medium text-white transition-colors"
              >
                {loading ? "Sending…" : "Send magic link"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-muted">
          No password needed — we&apos;ll email you a secure sign-in link.
        </p>
      </div>
    </div>
  );
}
