import { z } from "zod";

export const DimensionIdSchema = z.enum([
  "isolamento_positivo",
  "verificacao_ausencia",
  "energia_residual",
  "pessoas_e_grupo",
  "comunicacao_registro"
]);

export const ScenarioChoiceEffectsSchema = z.object({
  scoreDelta: z.record(DimensionIdSchema, z.number()).partial().optional(),
  flags: z.array(z.string()).optional(),
  criticalFail: z.string().optional()
});

export const ScenarioChoiceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  effects: ScenarioChoiceEffectsSchema.optional(),
  feedback: z.string().optional()
});

export const ScenarioInfoNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal("info"),
  title: z.string().min(1),
  body: z.string().min(1),
  next: z.string().min(1)
});

export const ScenarioDecisionNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal("decision"),
  title: z.string().min(1),
  body: z.string().min(1),
  choices: z.array(ScenarioChoiceSchema).min(1),
  nextByChoice: z.record(z.string().min(1), z.string().min(1))
});

export const ScenarioOutcomeNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal("outcome"),
  title: z.string().min(1),
  body: z.string().min(1),
  outcome: z.object({
    status: z.enum(["FAILED", "COMPLETED"]),
    severity: z.enum(["CRITICAL_FAIL", "NONE"])
  })
});

export const ScenarioNodeSchema = z.discriminatedUnion("type", [
  ScenarioInfoNodeSchema,
  ScenarioDecisionNodeSchema,
  ScenarioOutcomeNodeSchema
]);

export const ScenarioMaturityModelSchema = z.object({
  levels: z.array(
    z.object({
      id: z.enum(["iniciante", "experiente", "sistemico"]),
      minScore: z.number(),
      maxScore: z.number()
    })
  ).min(1),
  dimensions: z.array(
    z.object({
      id: DimensionIdSchema,
      weight: z.number().positive()
    })
  ).min(1),
  criticalFailRules: z.array(
    z.object({
      id: z.string().min(1),
      when: z.literal("choice"),
      choiceId: z.string().min(1),
      reason: z.string().min(1)
    })
  ).default([])
});

export const ScenarioSchema = z.object({
  scenarioId: z.string().min(1),
  version: z.string().min(1),
  title: z.string().min(1),
  domain: z.string().optional(),
  focus: z.array(z.string()).optional(),
  estimatedMinutes: z.number().optional(),
  maturityModel: ScenarioMaturityModelSchema,
  context: z.object({
    site: z.string().optional(),
    asset: z.string().optional(),
    voltage: z.string().optional(),
    pressure: z.string().optional(),
    roles: z.array(z.string()).optional()
  }).optional(),
  startNodeId: z.string().min(1),
  nodes: z.array(ScenarioNodeSchema).min(1)
});

export const EventTypeSchema = z.enum([
  "SESSION_STARTED",
  "NODE_VIEWED",
  "CHOICE_SELECTED",
  "STATE_UPDATED",
  "RULE_TRIGGERED",
  "SESSION_COMPLETED",
  "SESSION_ABORTED"
]);

export const EngineEventSchema = z.object({
  eventId: z.string().min(1),
  ts: z.string().min(10),
  type: EventTypeSchema,
  payload: z.record(z.unknown())
});

export const StartSessionBodySchema = z.object({
  scenarioId: z.string().min(1),
  scenarioVersion: z.string().min(1),
  scenarioDbId: z.string().min(1).optional()
});

export const AppendEventsBodySchema = z.object({
  events: z.array(EngineEventSchema).min(1)
});

export const CompleteSessionBodySchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  maturityLevel: z.string().min(1),
  dimensionScores: z.record(z.string(), z.number()),
  criticalFails: z.array(z.unknown()),
  status: z.enum(["COMPLETED", "FAILED", "ABORTED"]).optional()
});
