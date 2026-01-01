"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { api } from "../../lib/api";
import { setAuth } from "../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    setBusy(true);
    try {
      const r = await api.login(email.trim(), password);
      setAuth(r.token, r.user);
      router.push("/scenarios");
    } catch (e: any) {
      setErr(e?.message || "Falha no login");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="space-y-6">
      <Card>
        <h2 className="text-lg font-semibold">Entrar</h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs text-gray-600">Email</label>
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@demo.com"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">Senha</label>
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin123"
            />
          </div>
          {err && <div className="text-sm text-red-600">{err}</div>}
          <Button onClick={submit} disabled={busy || !email || !password}>
            {busy ? "Entrando..." : "Entrar"}
          </Button>
        </div>
      </Card>
    </main>
  );
}
