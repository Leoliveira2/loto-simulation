import { EngineError, Scenario, ScenarioDecisionNode, ScenarioNode } from "./types";

export function buildNodeIndex(scenario: Scenario): Map<string, ScenarioNode> {
  const map = new Map<string, ScenarioNode>();
  for (const n of scenario.nodes) {
    if (map.has(n.id)) throw new EngineError("SCENARIO_DUP_NODE", `Node id duplicado: ${n.id}`, { nodeId: n.id });
    map.set(n.id, n);
  }
  return map;
}

export function validateScenarioIntegrity(scenario: Scenario): void {
  const idx = buildNodeIndex(scenario);

  if (!idx.has(scenario.startNodeId)) {
    throw new EngineError("SCENARIO_BAD_START", "startNodeId não existe em nodes.", { startNodeId: scenario.startNodeId });
  }

  for (const node of scenario.nodes) {
    if (node.type === "info") {
      if (!idx.has(node.next)) throw new EngineError("SCENARIO_BAD_EDGE", `Info aponta para node inexistente: ${node.next}`, { from: node.id, to: node.next });
    }

    if (node.type === "decision") {
      const d = node as ScenarioDecisionNode;
      const choiceIds = new Set<string>();

      for (const c of d.choices) {
        if (choiceIds.has(c.id)) throw new EngineError("SCENARIO_DUP_CHOICE", `Choice id duplicado: ${c.id}`, { nodeId: node.id, choiceId: c.id });
        choiceIds.add(c.id);
        if (!(c.id in d.nextByChoice)) {
          throw new EngineError("SCENARIO_MISSING_NEXT", "Choice sem nextByChoice.", { nodeId: node.id, choiceId: c.id });
        }
      }

      for (const [choiceId, nextId] of Object.entries(d.nextByChoice)) {
        if (!choiceIds.has(choiceId)) throw new EngineError("SCENARIO_NEXT_UNKNOWN_CHOICE", "nextByChoice contém choice não declarado.", { nodeId: node.id, choiceId });
        if (!idx.has(nextId)) throw new EngineError("SCENARIO_BAD_EDGE", `Decision aponta para node inexistente: ${nextId}`, { from: node.id, choiceId, to: nextId });
      }
    }
  }

  const allChoiceIds = new Set<string>();
  for (const node of scenario.nodes) {
    if (node.type === "decision") for (const c of node.choices) allChoiceIds.add(c.id);
  }

  for (const r of scenario.maturityModel.criticalFailRules) {
    if (r.when === "choice" && !allChoiceIds.has(r.choiceId)) {
      throw new EngineError("SCENARIO_BAD_CRITICAL_FAIL_RULE", "criticalFailRules referencia choice inexistente.", { ruleId: r.id, choiceId: r.choiceId });
    }
  }

  const sumW = scenario.maturityModel.dimensions.reduce((a, d) => a + d.weight, 0);
  if (sumW < 0.99 || sumW > 1.01) throw new EngineError("SCENARIO_BAD_WEIGHTS", "Soma dos weights deve ser ~1.0", { sumW });
}
