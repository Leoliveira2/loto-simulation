"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "../../../lib/api";
import { Card } from "../../../components/Card";
import { Loading } from "../../../components/Loading";
import { Badge } from "../../../components/Badge";

export default function SessionReplayPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;

  const [data, setData] = useState<{ session: any; events: any[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.getSession(sessionId)
      .then(setData)
      .catch((e) => setErr(e?.message || "Falha ao carregar sessão"));
  }, [sessionId]);

  if (err) return <Card><div className="text-sm text-red-600">{err}</div></Card>;
  if (!data) return <Loading />;

  const { session, events } = data;

  return (
    <main className="space-y-4">
      <h2 className="text-lg font-semibold">Replay da sessão</h2>

      <Card>
        <div className="space-y-1">
          <div className="text-sm"><b>{session.scenarioId}</b> <span className="text-gray-400">v{session.scenarioVersion}</span></div>
          <div className="text-xs text-gray-600">
            <Badge>{session.status}</Badge>
            <span className="ml-2">Score: {session.overallScore ?? "-"}</span>
            <span className="ml-2">Nível: {session.maturityLevel ?? "-"}</span>
          </div>
          <div className="text-xs text-gray-500">
            Início: {new Date(session.startedAt).toLocaleString()}
            {session.endedAt ? ` • Fim: ${new Date(session.endedAt).toLocaleString()}` : ""}
          </div>
        </div>
      </Card>

      <Card>
        <div className="text-sm font-semibold">Linha do tempo de eventos</div>
        <div className="mt-3 space-y-2">
          {events.map((e) => (
            <div key={e.clientEventId || e.id} className="rounded-xl border border-gray-200 px-3 py-2">
              <div className="text-xs text-gray-600">
                {new Date(e.ts).toLocaleString()} • <b>{e.type}</b> • <span className="text-gray-400">{e.clientEventId}</span>
              </div>
              <pre className="mt-2 overflow-auto rounded-lg bg-gray-50 p-2 text-xs text-gray-700">{JSON.stringify(e.payload, null, 2)}</pre>
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}
