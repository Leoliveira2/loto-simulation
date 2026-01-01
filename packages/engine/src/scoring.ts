import { DimensionId, EngineConfig, EngineState, Scenario } from "./types";

function clamp01to100(n: number): number {
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

export function createInitialDimensionScores(initialScore = 50): Record<DimensionId, number> {
  const base = clamp01to100(initialScore);
  return {
    isolamento_positivo: base,
    verificacao_ausencia: base,
    energia_residual: base,
    pessoas_e_grupo: base,
    comunicacao_registro: base
  };
}

export function applyScoreDelta(state: EngineState, delta: Partial<Record<DimensionId, number>>, cfg: EngineConfig): void {
  const clamp = cfg.clampScores ?? true;
  for (const [k, v] of Object.entries(delta) as Array<[DimensionId, number]>) {
    const next = state.dimensionScores[k] + v;
    state.dimensionScores[k] = clamp ? clamp01to100(next) : next;
  }
}

export function computeOverallScore(state: EngineState, scenario: Scenario): number {
  const weights = new Map(scenario.maturityModel.dimensions.map((d) => [d.id, d.weight]));
  let total = 0;
  for (const [dim, score] of Object.entries(state.dimensionScores) as Array<[DimensionId, number]>) {
    total += score * (weights.get(dim) ?? 0);
  }
  return Math.round(total);
}

export function computeMaturityLevel(overall: number, scenario: Scenario): string {
  const level = scenario.maturityModel.levels.find((l) => overall >= l.minScore && overall <= l.maxScore);
  return level?.id ?? "iniciante";
}
