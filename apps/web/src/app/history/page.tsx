"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../lib/api";
import { Card } from "../../components/Card";
import { Loading } from "../../components/Loading";
import { Badge } from "../../components/Badge";

export default function HistoryPage() {
  const [items, setItems] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.myHistory(30)
      .then((r) => setItems(r.sessions))
      .catch((e) => setErr(e?.message || "Falha ao carregar histórico"));
  }, []);

  if (err) return <Card><div className="text-sm text-red-600">{err}</div></Card>;
  if (!items) return <Loading />;

  return (
    <main className="space-y-4">
      <h2 className="text-lg font-semibold">Meu histórico</h2>
      <div className="space-y-3">
        {items.map((s) => (
          <Card key={s.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="font-semibold">{s.scenarioId} <span className="text-gray-400">v{s.scenarioVersion}</span></div>
                <div className="text-xs text-gray-600">
                  <Badge>{s.status}</Badge>
                  <span className="ml-2">Score: {s.overallScore ?? "-"}</span>
                  <span className="ml-2">Nível: {s.maturityLevel ?? "-"}</span>
                </div>
                <div className="text-xs text-gray-500">
                  Início: {new Date(s.startedAt).toLocaleString()}
                  {s.endedAt ? ` • Fim: ${new Date(s.endedAt).toLocaleString()}` : ""}
                </div>
              </div>
              <Link className="text-sm text-black underline" href={`/history/${s.id}`}>Ver replay</Link>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
