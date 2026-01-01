"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "../../components/Card";
import { Loading } from "../../components/Loading";
import { api } from "../../lib/api";
import { Badge } from "../../components/Badge";

export default function ScenariosPage() {
  const [items, setItems] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.listScenarios()
      .then((r) => setItems(r.scenarios))
      .catch((e) => setErr(e?.message || "Falha ao carregar cenários"));
  }, []);

  if (err) return <Card><div className="text-sm text-red-600">{err}</div></Card>;
  if (!items) return <Loading />;

  return (
    <main className="space-y-4">
      <h2 className="text-lg font-semibold">Cenários</h2>
      <div className="space-y-3">
        {items.map((s) => (
          <Card key={s.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="font-semibold">{s.title}</div>
                <div className="text-xs text-gray-600">
                  <span className="mr-2">ID: {s.scenarioId}</span>
                  <Badge>v{s.version}</Badge>
                </div>
              </div>
              <Link className="text-sm text-black underline" href={`/scenarios/${encodeURIComponent(s.scenarioId)}?version=${encodeURIComponent(s.version)}`}>
                Abrir
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
