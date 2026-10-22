"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LockKeyhole, ShieldCheck, User } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login gagal");
        return;
      }
      // Gunakan window.location agar refresh state auth total
      window.location.href = "/admin";
    } catch {
      setError("Koneksi bermasalah, coba lagi");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[linear-gradient(180deg,#f0fdf4_0%,#dcfce7_100%)] px-5 py-10">
      <div className="w-full max-w-sm overflow-hidden rounded-[2rem] border border-green-100 bg-white shadow-[0_20px_60px_rgba(22,101,52,0.12)]">
        <div className="bg-gradient-to-r from-green-600 to-lime-500 px-6 pb-8 pt-7 text-white">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-white/15 shadow-inner">
            <ShieldCheck size={28} />
          </div>
          <h1 className="mt-4 text-center text-[24px] font-black tracking-tight">
            Admin Panel
          </h1>
          <p className="mt-1 text-center text-[12px] text-green-50/90">
            Login untuk mengelola toko GBIFRESH
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 px-6 pb-7 pt-6">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold text-zinc-500">
              Username
            </span>
            <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3.5 py-3 focus-within:border-green-400 focus-within:bg-white">
              <User size={16} className="text-green-600" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username admin"
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-zinc-400"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold text-zinc-500">
              Password
            </span>
            <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3.5 py-3 focus-within:border-green-400 focus-within:bg-white">
              <LockKeyhole size={16} className="text-green-600" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Masukkan password admin"
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-zinc-400"
              />
            </div>
          </label>

          {error && (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-center text-[11.5px] font-bold text-rose-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !username || !password}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 py-3.5 text-[13px] font-extrabold text-white shadow-[0_10px_25px_rgba(22,163,74,0.35)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={17} />}
            {submitting ? "Memverifikasi..." : "Masuk ke Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}
