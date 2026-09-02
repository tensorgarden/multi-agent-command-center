export type AgentStatus = "idle" | "running" | "review_needed" | "halted" | "completed" | "failed";
export type TrustLevel = "auto_approve" | "review_required" | "deny";
export type DriftSeverity = "none" | "low" | "medium" | "high";
export type AuditCategory = "system" | "data_access" | "risk_decision" | "compliance_review";
export type PermissionDecision = "allowed" | "review_required" | "blocked";
export type TaintSource = "trusted_system" | "untrusted_content" | "operator_instruction";
export type EgressRiskFactor = "private_data_access" | "untrusted_content" | "external_communication";
export type EgressAuthorizationState = "in_scope" | "human_review_required" | "out_of_scope";
export type DelegationVerification = "not_applicable" | "verified" | "unverified";
export type EgressTraceStatus = "local" | "cross_agent_verified" | "cross_agent_tainted";
export type ContextAdmission = "admitted" | "human_review_required" | "quarantined";
export type MemoryScope = "session" | "user" | "workspace";
export type MemoryEntryVector = "direct_write" | "session_summary" | "retrieval_result" | "query_only_interaction";
export type MemoryIntegrityStatus = "verified" | "baseline_mismatch" | "not_applicable";
export type MemoryRequestedTrustLayer = "retrieval_context" | "system_prompt" | "global_hooks";
export type MemoryAppliedTrustLayer = "retrieval_context" | "not_persisted";
export type MemoryPropagationState = "origin_agent_only" | "approved_workspace" | "not_propagated";
export type ToolManifestIntegrity = "match" | "mismatch";

export interface WorkspaceMember {
  id: string;
  name: string;
  role: "admin" | "operator" | "viewer";
  avatarInitials: string;
}

export interface Workspace {
  id: string;
  name: string;
  memberCount: number;
  projectCount: number;
  totalAgentRuns: number;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  activeAgentCount: number;
  totalCost: number;
}

export interface AgentWorker {
  id: string;
  name: string;
  type: string;
  status: AgentStatus;
  currentTask: string;
  workspaceId: string;
  projectId: string;
  tokensUsed: number;
  estimatedCost: number;
  trustLevel: TrustLevel;
  stateHistory: string[];
  loopDetected: boolean;
  lastStateChange: string;
}

export interface DriftAlert {
  id: string;
  agentAId: string;
  agentAName: string;
  agentBId: string;
  agentBName: string;
  assumption: string;
  aValue: string;
  bValue: string;
  severity: DriftSeverity;
  detectedAt: string;
}

export interface RunArtifact {
  id: string;
  agentId: string;
  agentName: string;
  type: string;
  title: string;
  content: string;
  status: "pending_review" | "accepted" | "rejected";
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  agentId: string;
  action: string;
  detail: string;
  category: AuditCategory;
  permissionDecision: PermissionDecision;
  policyId: string;
  decisionReason: string;
  immutableHash: string;
  timestamp: string;
  cost: number;
}

export interface EgressGateReview {
  id: string;
  agentId: string;
  agentName: string;
  requestedAction: string;
  target: string;
  sourceKind: TaintSource;
  contextAdmission: ContextAdmission;
  delegatedByAgentId: string | null;
  delegationVerification: DelegationVerification;
  workflowId: string;
  upstreamReviewIds: string[];
  traceStatus: EgressTraceStatus;
  taintedFields: string[];
  riskFactors: EgressRiskFactor[];
  authorizationState: EgressAuthorizationState;
  decision: PermissionDecision;
  policyId: string;
  decisionReason: string;
}

export interface MemoryWriteReview {
  id: string;
  agentId: string;
  agentName: string;
  requestedKey: string;
  memoryScope: MemoryScope;
  sourceKind: TaintSource;
  entryVector: MemoryEntryVector;
  corroboratingSourceIds: string[];
  crossSession: boolean;
  protectedKey: boolean;
  sensitiveDataDetected: boolean;
  integrityStatus: MemoryIntegrityStatus;
  requestedTrustLayer: MemoryRequestedTrustLayer;
  appliedTrustLayer: MemoryAppliedTrustLayer;
  propagationState: MemoryPropagationState;
  recipientAgentIds: string[];
  ttlHours: number | null;
  decision: PermissionDecision;
  policyId: string;
  decisionReason: string;
}

export interface ToolGrantReview {
  id: string;
  agentId: string;
  agentName: string;
  serverName: string;
  toolName: string;
  baselineManifestHash: string;
  observedManifestHash: string;
  manifestIntegrity: ToolManifestIntegrity;
  hiddenInstructionDetected: boolean;
  lastScannedAt: string;
  decision: PermissionDecision;
  policyId: string;
  decisionReason: string;
}

export interface CostSummary {
  totalSpent: number;
  budgetLimit: number;
  percentUsed: number;
  costByAgent: { agentName: string; cost: number }[];
  costByProject: { projectName: string; cost: number }[];
  costByCategory: { category: AuditCategory; cost: number }[];
}

export interface CommandCenterSnapshot {
  workspace: Workspace;
  projects: Project[];
  agents: AgentWorker[];
  driftAlerts: DriftAlert[];
  artifacts: RunArtifact[];
  auditLog: AuditEntry[];
  egressGateReviews: EgressGateReview[];
  memoryWriteReviews: MemoryWriteReview[];
  toolGrantReviews: ToolGrantReview[];
  costSummary: CostSummary;
}
