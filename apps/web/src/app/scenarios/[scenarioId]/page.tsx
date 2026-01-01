"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { Loading } from "../../../components/Loading";
import { api } from "../../../lib/api";
import { createRuntime, startSession, runDecisionStep, runInfoAdvance, type EngineState, type Scenario } from "@loto/engine";

function uuid() {
  return crypto.randomUUID();
}

export default function ScenarioRunnerPage() {
  const params = useParams<{ scenarioId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const scenarioId = params.scenarioId;
  const version = search.get("version") || undefined;

  const [scenarioDb, setScenarioDb] = useState<any | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [state, setState] = useState<EngineState | null>(null);
  const [node, setNode] = useState<any | null>(null);
  const [feedback, setFeedback] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const runtime = useMemo(() => {
    if (!scenario) return null;
    return createRuntime(scenario, uuid, { initialScore: 50 });
  }, [scenario]);

  useEffect(() => {
    setErr(null);
    setScenario(null);
    setScenarioDb(null);

    api.getScenario(scenarioId, version)
      .then((r) => {
        setScenarioDb(r.scenario);
        setScenario(r.scenario.json as Scenario);
      })
      .catch((e) => setErr(e?.message || "Falha ao carregar cenário"));
  }, [scenarioId, version]);

  useEffect(() => {
    if (!runtime || !scenarioDb) return;
    (async () => {
      setBusy(true);
      try {
        const s = await api.startSession(scenarioDb.scenarioId, scenarioDb.version, scenarioDb.id);
        setSessionId(s.session.id);

        const start = startSession(runtime);
        setState({ ...start.state });
        await api.appendEvents(s.session.id, start.events);

        const current = (runtime as any).nodeIndex.get(start.state.currentNodeId);
        setNode(current);
      } catch (e: any) {
        setErr(e?.message || "Falha ao iniciar sessão");
      } finally {
        setBusy(false);
      }
    })();
  }, [runtime, scenarioDb]);

  async function flush(events: any[]) {
    if (!sessionId) return;
    await api.appendEvents(sessionId, events);
  }

  async function completeIfNeeded(nextState: EngineState, stepEvents: any[]) {
    if (!sessionId) return;
    if (nextState.status === "COMPLETED" || nextState.status === "FAILED" || nextState.status === "ABORTED") {
      const last = [...stepEvents].reverse().find((e) => e.type === "SESSION_COMPLETED");
      const final = last?.payload?.final;
      if (final) {
        await api.completeSession(sessionId, {
          overallScore: final.overallScore,
          maturityLevel: final.maturityLevel,
          dimensionScores: final.dimensionScores,
          criticalFails: final.criticalFails ?? [],
          status: nextState.status === "FAILED" ? "FAILED" : "COMPLETED"
        });
      }
    }
  }

  async function onAdvanceInfo() {
    if (!runtime || !state || !node || node.type !== "info") return;
    setBusy(true);
    setFeedback(undefined);
    try {
      const r = runInfoAdvance(runtime, state);
      setState({ ...r.state });
      setFeedback(r.feedback);

      await flush(r.events);
      const nextNode = (runtime as any).nodeIndex.get(r.state.currentNodeId);
      setNode(nextNode);
      await completeIfNeeded(r.state, r.events);
    } catch (e: any) {
      setErr(e?.message || "Erro ao avançar");
    } finally {
      setBusy(false);
    }
  }

  async function onSelect(choiceId: string) {
    if (!runtime || !state || !node || node.type !== "decision") return;
    setBusy(true);
    setFeedback(undefined);
    try {
      const r = runDecisionStep(runtime, state, choiceId);
      setState({ ...r.state });
      setFeedback(r.feedback);

      await flush(r.events);
      const nextNode = (runtime as any).nodeIndex.get(r.state.currentNodeId);
      setNode(nextNode);
      await completeIfNeeded(r.state, r.events);
    } catch (e: any) {
      setErr(e?.message || "Erro ao registrar escolha");
    } finally {
      setBusy(false);
    }
  }

  if (err) return <main><Card><div className="text-sm text-red-600">{err}</div></Card></main>;
  if (!scenario || !node || !state) return <Loading />;

  const isOutcome = node.type === "outcome";

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-gray-600">Cenário</div>
          <div className="text-lg font-semibold">{scenario.title}</div>
          <div className="text-xs text-gray-600">Sessão: {sessionId ?? "-"}</div>
        </div>
        {isOutcome && (
          <Button variant="ghost" onClick={() => router.push("/history")}>Ver histórico</Button>
        )}
      </div>

      <Card>
        <div className="space-y-2">
          <div className="text-xs text-gray-600">{node.type.toUpperCase()}</div>
          <div className="text-lg font-semibold">{node.title}</div>
          <div className="text-sm text-gray-700 whitespace-pre-line">{node.body}</div>
        </div>

        {feedback && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            {feedback}
          </div>
        )}

        <div className="mt-5">
          {node.type === "info" && (
            <Button onClick={onAdvanceInfo} disabled={busy}>
              {busy ? "Processando..." : "Continuar"}
            </Button>
          )}

          {node.type === "decision" && (
            <div className="flex flex-col gap-2">
              {node.choices.map((c: any) => (
                <Button key={c.id} variant="ghost" onClick={() => onSelect(c.id)} disabled={busy}>
                  {c.label}
                </Button>
              ))}
            </div>
          )}

          {node.type === "outcome" && (
            <div className="space-y-3">
              <div className="text-sm text-gray-700">Status: <b>{state.status}</b></div>
              <div className="flex gap-2">
                <Button onClick={() => router.push("/scenarios")}>Escolher outro cenário</Button>
                <Button variant="ghost" onClick={() => router.push("/history")}>Ver histórico</Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="text-sm font-semibold">Maturidade (parcial)</div>
        <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
          {Object.entries(state.dimensionScores).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2">
              <div className="text-gray-700">{k}</div>
              <div className="font-semibold">{v as any}</div>
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}
