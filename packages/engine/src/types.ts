export type ISODateString = string;

export type MaturityLevelId = "iniciante" | "experiente" | "sistemico";

export type DimensionId =
  | "isolamento_positivo"
  | "verificacao_ausencia"
  | "energia_residual"
  | "pessoas_e_grupo"
  | "comunicacao_registro";

export type Severity = "NONE" | "CRITICAL_FAIL" | "NEAR_MISS" | "WARNING";

export type SessionStatus = "IN_PROGRESS" | "COMPLETED" | "FAILED" | "ABORTED";

export type NodeType = "info" | "decision" | "outcome";

export type EventType =
  | "SESSION_STARTED"
  | "NODE_VIEWED"
  | "CHOICE_SELECTED"
  | "STATE_UPDATED"
  | "RULE_TRIGGERED"
  | "SESSION_COMPLETED"
  | "SESSION_ABORTED";

export interface ScenarioMaturityDimension {
  id: DimensionId;
  weight: number;
}

export interface ScenarioMaturityLevel {
  id: MaturityLevelId;
  minScore: number;
  maxScore: number;
}

export interface ScenarioCriticalFailRule {
  id: string;
  when: "choice";
  choiceId: string;
  reason: string;
}

export interface ScenarioMaturityModel {
  levels: ScenarioMaturityLevel[];
  dimensions: ScenarioMaturityDimension[];
  criticalFailRules: ScenarioCriticalFailRule[];
}

export interface ScenarioContext {
  site?: string;
  asset?: string;
  voltage?: string;
  pressure?: string;
  roles?: string[];
}

export interface ScenarioChoiceEffects {
  scoreDelta?: Partial<Record<DimensionId, number>>;
  flags?: string[];
  criticalFail?: string;
}

export interface ScenarioChoice {
  id: string;
  label: string;
  effects?: ScenarioChoiceEffects;
  feedback?: string;
}

export interface ScenarioNodeBase {
  id: string;
  type: NodeType;
  title: string;
  body: string;
}

export interface ScenarioInfoNode extends ScenarioNodeBase {
  type: "info";
  next: string;
}

export interface ScenarioDecisionNode extends ScenarioNodeBase {
  type: "decision";
  choices: ScenarioChoice[];
  nextByChoice: Record<string, string>;
}

export interface ScenarioOutcomeNode extends ScenarioNodeBase {
  type: "outcome";
  outcome: {
    status: "FAILED" | "COMPLETED";
    severity: "CRITICAL_FAIL" | "NONE";
  };
}

export type ScenarioNode = ScenarioInfoNode | ScenarioDecisionNode | ScenarioOutcomeNode;

export interface Scenario {
  scenarioId: string;
  version: string;
  title: string;
  domain?: string;
  focus?: string[];
  estimatedMinutes?: number;
  maturityModel: ScenarioMaturityModel;
  context?: ScenarioContext;
  startNodeId: string;
  nodes: ScenarioNode[];
}

export interface EngineState {
  scenarioId: string;
  scenarioVersion: string;
  currentNodeId: string;
  status: SessionStatus;
  startedAt: ISODateString;
  endedAt?: ISODateString;

  dimensionScores: Record<DimensionId, number>;
  flags: string[];
  criticalFails: { ruleId: string; reason: string; atNodeId: string; atChoiceId: string }[];

  visitedNodeIds: string[];
  selectedChoices: { nodeId: string; choiceId: string }[];
}

export interface EngineConfig {
  clampScores?: boolean;
  initialScore?: number;
  now?: () => Date;
}

export interface EngineEvent {
  eventId: string;
  ts: ISODateString;
  type: EventType;
  payload: Record<string, unknown>;
}

export interface RunStepResult {
  state: EngineState;
  nextNodeId: string | null;
  feedback?: string;
  severity: Severity;
  events: EngineEvent[];
}

export class EngineError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;
  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.details = details;
  }
}
