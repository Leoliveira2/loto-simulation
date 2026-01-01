import {
  EngineConfig,
  EngineError,
  EngineEvent,
  EngineState,
  RunStepResult,
  Scenario,
  ScenarioDecisionNode
} from "./types";
import { applyScoreDelta, computeMaturityLevel, computeOverallScore, createInitialDimensionScores } from "./scoring";
import { buildNodeIndex, validateScenarioIntegrity } from "./validators";

function isoNow(cfg: EngineConfig): string {
  const now = cfg.now ? cfg.now() : new Date();
  return now.toISOString();
}

export type EventIdFactory = () => string;

export interface EngineRuntime {
  scenario: Scenario;
  nodeIndex: Map<string, any>;
  cfg: EngineConfig;
  makeEventId: EventIdFactory;
}

export function createRuntime(scenario: Scenario, makeEventId: EventIdFactory, cfg: EngineConfig = {}): EngineRuntime {
  validateScenarioIntegrity(scenario);
  return { scenario, nodeIndex: buildNodeIndex(scenario), cfg, makeEventId };
}

function newEvent(type: EngineEvent["type"], payload: EngineEvent["payload"], ts: string, eventId: string): EngineEvent {
  return { eventId, ts, type, payload };
}

export function startSession(runtime: EngineRuntime): { state: EngineState; events: EngineEvent[] } {
  const ts = isoNow(runtime.cfg);

  const state: EngineState = {
    scenarioId: runtime.scenario.scenarioId,
    scenarioVersion: runtime.scenario.version,
    currentNodeId: runtime.scenario.startNodeId,
    status: "IN_PROGRESS",
    startedAt: ts,
    dimensionScores: createInitialDimensionScores(runtime.cfg.initialScore ?? 50),
    flags: [],
    criticalFails: [],
    visitedNodeIds: [],
    selectedChoices: []
  };

  const events: EngineEvent[] = [
    newEvent("SESSION_STARTED", { scenarioId: state.scenarioId, scenarioVersion: state.scenarioVersion, startedAt: state.startedAt }, ts, runtime.makeEventId()),
    newEvent("NODE_VIEWED", { nodeId: state.currentNodeId }, ts, runtime.makeEventId())
  ];

  state.visitedNodeIds.push(state.currentNodeId);
  return { state, events };
}

function finalizeScores(state: EngineState, scenario: Scenario) {
  const overallScore = computeOverallScore(state, scenario);
  const maturityLevel = computeMaturityLevel(overallScore, scenario);
  return { dimensionScores: state.dimensionScores, overallScore, maturityLevel, criticalFails: state.criticalFails };
}

export function completeSession(runtime: EngineRuntime, state: EngineState, seedEvents: EngineEvent[] = [], lastFeedback?: string): RunStepResult {
  const ts = isoNow(runtime.cfg);
  if (state.status === "IN_PROGRESS") state.status = "COMPLETED";
  state.endedAt = state.endedAt ?? ts;

  const final = finalizeScores(state, runtime.scenario);
  const events = [...seedEvents, newEvent("SESSION_COMPLETED", { status: state.status, final }, ts, runtime.makeEventId())];

  return { state, nextNodeId: state.currentNodeId, feedback: lastFeedback, severity: state.status === "FAILED" ? "CRITICAL_FAIL" : "NONE", events };
}

export function runInfoAdvance(runtime: EngineRuntime, state: EngineState): RunStepResult {
  if (state.status !== "IN_PROGRESS") throw new EngineError("STATE_NOT_ACTIVE", "Sessão não está ativa.", { status: state.status });

  const node = runtime.nodeIndex.get(state.currentNodeId);
  if (!node) throw new EngineError("NODE_NOT_FOUND", "Node atual não encontrado.", { nodeId: state.currentNodeId });
  if (node.type !== "info") throw new EngineError("NODE_NOT_INFO", "Node atual não é do tipo info.", { nodeId: state.currentNodeId });

  const ts = isoNow(runtime.cfg);
  const nextNodeId = node.next as string;
  state.currentNodeId = nextNodeId;

  const events: EngineEvent[] = [
    newEvent("STATE_UPDATED", { move: { from: node.id, to: nextNodeId } }, ts, runtime.makeEventId()),
    newEvent("NODE_VIEWED", { nodeId: nextNodeId }, ts, runtime.makeEventId())
  ];

  state.visitedNodeIds.push(nextNodeId);

  const nextNode = runtime.nodeIndex.get(nextNodeId);
  if (nextNode?.type === "outcome") {
    // marcar status pelo outcome
    if (nextNode.outcome?.status === "FAILED") state.status = "FAILED";
    if (nextNode.outcome?.status === "COMPLETED") state.status = "COMPLETED";
    state.endedAt = ts;
    return completeSession(runtime, state, events);
  }

  return { state, nextNodeId, severity: "NONE", events };
}

export function runDecisionStep(runtime: EngineRuntime, state: EngineState, choiceId: string): RunStepResult {
  if (state.status !== "IN_PROGRESS") throw new EngineError("STATE_NOT_ACTIVE", "Sessão não está ativa.", { status: state.status });

  const node = runtime.nodeIndex.get(state.currentNodeId);
  if (!node) throw new EngineError("NODE_NOT_FOUND", "Node atual não encontrado.", { nodeId: state.currentNodeId });
  if (node.type !== "decision") throw new EngineError("NODE_NOT_DECISION", "Node atual não é do tipo decision.", { nodeId: state.currentNodeId });

  const d = node as ScenarioDecisionNode;
  const choice = d.choices.find((c) => c.id === choiceId);
  if (!choice) throw new EngineError("CHOICE_NOT_FOUND", "Choice não pertence ao node atual.", { nodeId: d.id, choiceId });

  const ts = isoNow(runtime.cfg);
  const events: EngineEvent[] = [];
  events.push(newEvent("CHOICE_SELECTED", { nodeId: d.id, choiceId }, ts, runtime.makeEventId()));
  state.selectedChoices.push({ nodeId: d.id, choiceId });

  const scoreDelta = choice.effects?.scoreDelta ?? {};
  const flagsToAdd = choice.effects?.flags ?? [];
  if (Object.keys(scoreDelta).length > 0) applyScoreDelta(state, scoreDelta, runtime.cfg);
  for (const f of flagsToAdd) if (!state.flags.includes(f)) state.flags.push(f);

  events.push(newEvent("STATE_UPDATED", { scoreDelta, flagsAdded: flagsToAdd, atNodeId: d.id, choiceId }, ts, runtime.makeEventId()));

  // critical fail
  if (choice.effects?.criticalFail) {
    const rule = runtime.scenario.maturityModel.criticalFailRules.find((r) => r.id === choice.effects!.criticalFail);
    const reason = rule?.reason ?? "Falha crítica.";
    state.criticalFails.push({ ruleId: choice.effects.criticalFail, reason, atNodeId: d.id, atChoiceId: choiceId });
    state.status = "FAILED";
    state.endedAt = ts;

    events.push(newEvent("RULE_TRIGGERED", { ruleId: choice.effects.criticalFail, reason, atNodeId: d.id, choiceId }, ts, runtime.makeEventId()));
  }

  const nextNodeId = d.nextByChoice[choiceId];
  if (!nextNodeId) throw new EngineError("SCENARIO_BAD_NEXT", "nextByChoice não definido para esta escolha.", { nodeId: d.id, choiceId });

  state.currentNodeId = nextNodeId;
  events.push(newEvent("NODE_VIEWED", { nodeId: nextNodeId }, ts, runtime.makeEventId()));
  state.visitedNodeIds.push(nextNodeId);

  const nextNode = runtime.nodeIndex.get(nextNodeId);
  if (nextNode?.type === "outcome") {
    if (nextNode.outcome?.status === "FAILED") state.status = "FAILED";
    if (nextNode.outcome?.status === "COMPLETED" && state.status === "IN_PROGRESS") state.status = "COMPLETED";
    state.endedAt = ts;
    return completeSession(runtime, state, events, choice.feedback);
  }

  return { state, nextNodeId, feedback: choice.feedback, severity: state.status === "FAILED" ? "CRITICAL_FAIL" : "NONE", events };
}
