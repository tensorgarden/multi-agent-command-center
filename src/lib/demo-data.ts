import type { AgentWorker, AuditEntry, CostSummary, DriftAlert, EgressGateReview, MemoryWriteReview, Project, RunArtifact, ToolGrantReview, Workspace, WorkspaceMember } from "./types";

export function isEgressDispatchAllowed(review: EgressGateReview): boolean {
  return (
    review.decision === "allowed" &&
    review.authorizationState === "in_scope" &&
    review.contextAdmission === "admitted" &&
    review.sourceKind === "trusted_system" &&
    review.target.startsWith("internal://") &&
    review.taintedFields.length === 0 &&
    review.riskFactors.length === 0 &&
    review.delegationVerification !== "unverified"
  );
}

export const demoWorkspace: Workspace = {
  id: "ws_fintech",
  name: "Fintech Compliance Operations",
  memberCount: 8,
  projectCount: 4,
  totalAgentRuns: 247
};

export const demoMembers: WorkspaceMember[] = [
  { id: "mem_priya", name: "Priya Sharma", role: "admin", avatarInitials: "PS" },
  { id: "mem_marcus", name: "Marcus Webb", role: "operator", avatarInitials: "MW" },
  { id: "mem_elena", name: "Elena Voss", role: "operator", avatarInitials: "EV" },
  { id: "mem_david", name: "David Okonkwo", role: "viewer", avatarInitials: "DO" }
];

export const demoProjects: Project[] = [
  { id: "proj_kyc", workspaceId: "ws_fintech", name: "KYC Document Review", description: "Agent pipeline for identity document verification and risk flagging", activeAgentCount: 3, totalCost: 47.50 },
  { id: "proj_fraud", workspaceId: "ws_fintech", name: "Transaction Fraud Detection", description: "Real-time anomaly detection with explainable flag reasons", activeAgentCount: 2, totalCost: 82.30 },
  { id: "proj_reporting", workspaceId: "ws_fintech", name: "Regulatory Report Generation", description: "Automated MIFID/FinCEN narrative drafting with compliance review", activeAgentCount: 2, totalCost: 31.20 },
  { id: "proj_onboarding", workspaceId: "ws_fintech", name: "Client Onboarding Pipeline", description: "Multi-step KYC/AML checks with human-in-the-loop gates", activeAgentCount: 4, totalCost: 124.80 }
];

export const demoAgents: AgentWorker[] = [
  {
    id: "ag_kyc_doc", name: "DocReview-v2", type: "document_analyzer",
    status: "running", currentTask: "Extracting passport fields from batch #47",
    workspaceId: "ws_fintech", projectId: "proj_kyc",
    tokensUsed: 12450, estimatedCost: 0.37,
    trustLevel: "auto_approve", stateHistory: ["init", "document_loaded", "ocr_running", "fields_extracted", "validating"],
    loopDetected: false, lastStateChange: "2026-06-08T14:32:00Z"
  },
  {
    id: "ag_kyc_risk", name: "RiskScorer-v1", type: "risk_assessor",
    status: "review_needed", currentTask: "Flagged high-risk entity — awaiting operator review",
    workspaceId: "ws_fintech", projectId: "proj_kyc",
    tokensUsed: 8900, estimatedCost: 0.27,
    trustLevel: "review_required", stateHistory: ["init", "entity_lookup", "sanctions_check", "risk_calculated", "flag_raised"],
    loopDetected: false, lastStateChange: "2026-06-08T14:28:00Z"
  },
  {
    id: "ag_kyc_audit", name: "AuditTrail-v1", type: "audit_logger",
    status: "idle", currentTask: "Waiting for new review assignments",
    workspaceId: "ws_fintech", projectId: "proj_kyc",
    tokensUsed: 2100, estimatedCost: 0.06,
    trustLevel: "auto_approve", stateHistory: ["init", "idle"],
    loopDetected: false, lastStateChange: "2026-06-08T14:20:00Z"
  },
  {
    id: "ag_fraud_tx", name: "TxScreener-v3", type: "transaction_analyzer",
    status: "running", currentTask: "Analyzing 2,847 transactions from last hour",
    workspaceId: "ws_fintech", projectId: "proj_fraud",
    tokensUsed: 45600, estimatedCost: 1.37,
    trustLevel: "auto_approve", stateHistory: ["init", "batch_loaded", "anomaly_scan", "pattern_matching", "risk_scoring"],
    loopDetected: false, lastStateChange: "2026-06-08T14:35:00Z"
  },
  {
    id: "ag_fraud_explain", name: "ExplainGen-v2", type: "explanation_generator",
    status: "halted", currentTask: "Loop detected — agent revisiting same state",
    workspaceId: "ws_fintech", projectId: "proj_fraud",
    tokensUsed: 31200, estimatedCost: 0.94,
    trustLevel: "review_required", stateHistory: ["init", "explain_attempt_1", "explain_attempt_2", "explain_attempt_3", "explain_attempt_3", "explain_attempt_3"],
    loopDetected: true, lastStateChange: "2026-06-08T14:30:00Z"
  },
  {
    id: "ag_reg_draft", name: "RegDraft-v1", type: "report_generator",
    status: "completed", currentTask: "MIFID quarterly narrative — draft complete",
    workspaceId: "ws_fintech", projectId: "proj_reporting",
    tokensUsed: 18900, estimatedCost: 0.57,
    trustLevel: "review_required", stateHistory: ["init", "data_collected", "template_loaded", "narrative_generated", "review_ready"],
    loopDetected: false, lastStateChange: "2026-06-08T14:15:00Z"
  },
  {
    id: "ag_reg_format", name: "FormatCheck-v1", type: "format_validator",
    status: "completed", currentTask: "Format validation passed — 0 errors",
    workspaceId: "ws_fintech", projectId: "proj_reporting",
    tokensUsed: 3400, estimatedCost: 0.10,
    trustLevel: "auto_approve", stateHistory: ["init", "schema_loaded", "validation_run", "passed"],
    loopDetected: false, lastStateChange: "2026-06-08T14:18:00Z"
  },
  {
    id: "ag_onb_collect", name: "DataCollect-v3", type: "data_collector",
    status: "running", currentTask: "Collecting incorporation docs for 12 new entities",
    workspaceId: "ws_fintech", projectId: "proj_onboarding",
    tokensUsed: 27800, estimatedCost: 0.83,
    trustLevel: "auto_approve", stateHistory: ["init", "registry_query", "doc_fetch", "ocr"],
    loopDetected: false, lastStateChange: "2026-06-08T14:33:00Z"
  },
  {
    id: "ag_onb_verify", name: "VerifyChain-v2", type: "verification_chain",
    status: "failed", currentTask: "Failed: upstream registry API timeout after 3 retries",
    workspaceId: "ws_fintech", projectId: "proj_onboarding",
    tokensUsed: 6200, estimatedCost: 0.19,
    trustLevel: "review_required", stateHistory: ["init", "api_call", "retry_1", "retry_2", "retry_3", "failed"],
    loopDetected: false, lastStateChange: "2026-06-08T14:10:00Z"
  },
  {
    id: "ag_onb_risk", name: "RiskEval-v4", type: "risk_evaluator",
    status: "idle", currentTask: "Awaiting verified entity data",
    workspaceId: "ws_fintech", projectId: "proj_onboarding",
    tokensUsed: 400, estimatedCost: 0.01,
    trustLevel: "review_required", stateHistory: ["init", "idle"],
    loopDetected: false, lastStateChange: "2026-06-08T14:05:00Z"
  }
];

export const demoDriftAlerts: DriftAlert[] = [
  {
    id: "drift_001",
    agentAId: "ag_kyc_doc", agentAName: "DocReview-v2",
    agentBId: "ag_onb_collect", agentBName: "DataCollect-v3",
    assumption: "Entity jurisdiction classification",
    aValue: "Singapore (ACRA registry)", bValue: "Singapore (MAS register)",
    severity: "medium", detectedAt: "2026-06-08T14:25:00Z"
  },
  {
    id: "drift_002",
    agentAId: "ag_fraud_tx", agentAName: "TxScreener-v3",
    agentBId: "ag_fraud_explain", agentBName: "ExplainGen-v2",
    assumption: "Transaction risk threshold for PEP flagging",
    aValue: "$10,000 single-transaction threshold", bValue: "$5,000 cumulative-7-day threshold",
    severity: "high", detectedAt: "2026-06-08T14:32:00Z"
  }
];

export const demoArtifacts: RunArtifact[] = [
  {
    id: "art_001", agentId: "ag_reg_draft", agentName: "RegDraft-v1",
    type: "report", title: "Q2 2026 MIFID Transaction Report — Draft",
    content: "This report covers 3,412 transactions across 847 client accounts for the period April–June 2026. Key findings: 12 reportable transactions under Article 26, 3 best-execution deviations (within tolerance), and 0 suspicious activity flags requiring escalation.",
    status: "pending_review", createdAt: "2026-06-08T14:15:00Z"
  },
  {
    id: "art_002", agentId: "ag_kyc_risk", agentName: "RiskScorer-v1",
    type: "risk_flag", title: "High-Risk Entity: GreenField Holdings Ltd",
    content: "Sanctions screening returned potential match against OFAC SDN list (confidence: 87%). Entity registered in Mauritius with beneficial ownership chain that terminates in a jurisdiction flagged by FATF as high-risk. Three associated accounts show transaction patterns inconsistent with stated business activity.",
    status: "pending_review", createdAt: "2026-06-08T14:28:00Z"
  },
  {
    id: "art_003", agentId: "ag_fraud_explain", agentName: "ExplainGen-v2",
    type: "explanation", title: "Fraud Case #TX-2847 Explanation — Stale",
    content: "This explanation was generated by an agent that subsequently entered a loop. The agent revisited the same state 3+ times and was auto-halted. This artifact should be reviewed before any downstream action is taken.",
    status: "pending_review", createdAt: "2026-06-08T14:29:00Z"
  }
];

export const demoAuditLog: AuditEntry[] = [
  { id: "aud_001", agentId: "ag_kyc_doc", action: "batch_processed", detail: "Batch #47: 50 passports processed, 48 valid, 2 flagged for manual review", category: "data_access", permissionDecision: "allowed", policyId: "POL-DATA-MIN-001", decisionReason: "Allowed because the batch stayed inside the passport extraction scope and flagged exceptions for review", immutableHash: "sha256:9e1c2d0a-aud-001", timestamp: "2026-06-08T14:32:00Z", cost: 0.37 },
  { id: "aud_002", agentId: "ag_kyc_risk", action: "risk_flag_raised", detail: "Entity GreenField Holdings flagged as high-risk (87% sanctions match confidence)", category: "risk_decision", permissionDecision: "review_required", policyId: "POL-RISK-HITL-002", decisionReason: "Required review because sanctions confidence exceeded the high-risk entity threshold", immutableHash: "sha256:9e1c2d0a-aud-002", timestamp: "2026-06-08T14:28:00Z", cost: 0.27 },
  { id: "aud_003", agentId: "ag_fraud_tx", action: "anomaly_detected", detail: "Transaction #TX-2847: $47,200 outbound to new beneficiary, 14x account average", category: "risk_decision", permissionDecision: "review_required", policyId: "POL-ANOMALY-HITL-003", decisionReason: "Required review because a new-beneficiary transfer exceeded behavioral and velocity thresholds", immutableHash: "sha256:9e1c2d0a-aud-003", timestamp: "2026-06-08T14:35:00Z", cost: 0.08 },
  { id: "aud_004", agentId: "ag_fraud_explain", action: "loop_halted", detail: "Agent auto-halted after revisiting explain_attempt_3 state 3 times", category: "system", permissionDecision: "blocked", policyId: "POL-RUNTIME-LOOP-004", decisionReason: "Blocked because repeated state revisits indicate a loop and downstream explanations may be stale", immutableHash: "sha256:9e1c2d0a-aud-004", timestamp: "2026-06-08T14:30:00Z", cost: 0.94 },
  { id: "aud_005", agentId: "ag_reg_draft", action: "draft_completed", detail: "Q2 MIFID narrative draft ready for compliance review", category: "compliance_review", permissionDecision: "review_required", policyId: "POL-REG-REVIEW-005", decisionReason: "Required review because externally reportable regulatory narratives need compliance signoff", immutableHash: "sha256:9e1c2d0a-aud-005", timestamp: "2026-06-08T14:15:00Z", cost: 0.57 },
  { id: "aud_006", agentId: "ag_onb_verify", action: "api_timeout", detail: "Registry API timeout after 3 retries (30s each). Affected: 12 entity verifications.", category: "system", permissionDecision: "blocked", policyId: "POL-RESILIENCE-RETRY-006", decisionReason: "Blocked because registry evidence could not be refreshed after the retry budget was exhausted", immutableHash: "sha256:9e1c2d0a-aud-006", timestamp: "2026-06-08T14:10:00Z", cost: 0.19 },
  { id: "aud_007", agentId: "ag_onb_collect", action: "docs_fetched", detail: "12 incorporation documents retrieved from ACRA", category: "data_access", permissionDecision: "allowed", policyId: "POL-DATA-SOURCE-007", decisionReason: "Allowed because the request used an approved registry source and only pulled onboarding evidence", immutableHash: "sha256:9e1c2d0a-aud-007", timestamp: "2026-06-08T14:33:00Z", cost: 0.83 },
  { id: "aud_008", agentId: "ag_reg_format", action: "validation_passed", detail: "MIFID format validation: 0 errors, 3 warnings (non-blocking)", category: "compliance_review", permissionDecision: "allowed", policyId: "POL-FORMAT-VALID-008", decisionReason: "Allowed because the validator only checked schema format and did not approve report content", immutableHash: "sha256:9e1c2d0a-aud-008", timestamp: "2026-06-08T14:18:00Z", cost: 0.10 }
];

export const demoEgressGateReviews: EgressGateReview[] = [
  {
    id: "eg_001",
    agentId: "ag_fraud_explain",
    agentName: "ExplainGen-v2",
    requestedAction: "Post fraud-case explanation to external case-management webhook",
    target: "https://case-sync.example.com/fraud/TX-2847",
    sourceKind: "untrusted_content",
    contextAdmission: "quarantined",
    delegatedByAgentId: null,
    delegationVerification: "not_applicable",
    taintedFields: ["webhook_url", "beneficiary_name"],
    riskFactors: ["private_data_access", "untrusted_content", "external_communication"],
    authorizationState: "out_of_scope",
    decision: "blocked",
    policyId: "POL-EGRESS-TAINT-009",
    decisionReason: "Blocked because external target and beneficiary context were derived from untrusted transaction notes, preventing prompt-injection exfiltration"
  },
  {
    id: "eg_002",
    agentId: "ag_reg_draft",
    agentName: "RegDraft-v1",
    requestedAction: "Submit MIFID narrative to regulator portal",
    target: "FCA transaction-reporting portal",
    sourceKind: "operator_instruction",
    contextAdmission: "human_review_required",
    delegatedByAgentId: null,
    delegationVerification: "not_applicable",
    taintedFields: ["narrative_body"],
    riskFactors: ["private_data_access", "external_communication"],
    authorizationState: "human_review_required",
    decision: "review_required",
    policyId: "POL-EGRESS-REVIEW-010",
    decisionReason: "Required compliance review because a generated regulatory filing leaves the workspace and may carry model-derived assertions"
  },
  {
    id: "eg_003",
    agentId: "ag_kyc_audit",
    agentName: "AuditTrail-v1",
    requestedAction: "Write audit hash to internal evidence ledger",
    target: "internal://evidence-ledger/audit-hashes",
    sourceKind: "trusted_system",
    contextAdmission: "admitted",
    delegatedByAgentId: null,
    delegationVerification: "not_applicable",
    taintedFields: [],
    riskFactors: [],
    authorizationState: "in_scope",
    decision: "allowed",
    policyId: "POL-EGRESS-INTERNAL-011",
    decisionReason: "Allowed because the target is internal-only and all fields come from signed system events rather than untrusted content"
  },
  {
    id: "eg_004",
    agentId: "ag_onb_collect",
    agentName: "DataCollect-v3",
    requestedAction: "Upload full KYC evidence packet to vendor URL embedded in an onboarding PDF",
    target: "https://vendor-review.example.net/upload?client=greenfield",
    sourceKind: "untrusted_content",
    contextAdmission: "quarantined",
    delegatedByAgentId: null,
    delegationVerification: "not_applicable",
    taintedFields: ["uploaded_pdf_instructions", "external_upload_url", "kyc_evidence_packet"],
    riskFactors: ["private_data_access", "untrusted_content", "external_communication"],
    authorizationState: "out_of_scope",
    decision: "blocked",
    policyId: "POL-EGRESS-PII-012",
    decisionReason: "Blocked because an untrusted onboarding document supplied the external upload destination while the payload contained customer KYC evidence, preventing prompt-injection-driven data exfiltration"
  },
  {
    id: "eg_005",
    agentId: "ag_kyc_risk",
    agentName: "RiskScorer-v1",
    requestedAction: "Export sanctions-screening results to analytics webhook returned by a third-party enrichment API",
    target: "https://analytics-drop.example.org/agent-export",
    sourceKind: "untrusted_content",
    contextAdmission: "quarantined",
    delegatedByAgentId: null,
    delegationVerification: "not_applicable",
    taintedFields: ["api_response_webhook_url", "sanctions_screening_results", "customer_risk_scores"],
    riskFactors: ["private_data_access", "untrusted_content", "external_communication"],
    authorizationState: "out_of_scope",
    decision: "blocked",
    policyId: "POL-EGRESS-API-013",
    decisionReason: "Blocked because a third-party API response selected an external export destination for sanctions results and customer risk scores, preventing prompt-injection data exfiltration and tool abuse"
  },
  {
    id: "eg_006",
    agentId: "ag_fraud_tx",
    agentName: "TxScreener-v3",
    requestedAction: "Render a remote image from an incident runbook with account telemetry embedded in the URL",
    target: "https://incident-assets.example.io/pixel.png?account=acct-847&risk=high",
    sourceKind: "untrusted_content",
    contextAdmission: "quarantined",
    delegatedByAgentId: null,
    delegationVerification: "not_applicable",
    taintedFields: ["external_image_url", "url_query_parameter", "account_telemetry"],
    riskFactors: ["private_data_access", "untrusted_content", "external_communication"],
    authorizationState: "out_of_scope",
    decision: "blocked",
    policyId: "POL-EGRESS-RENDER-014",
    decisionReason: "Blocked because an untrusted runbook requested external image rendering with private account telemetry in URL parameters, preventing indirect prompt-injection data exfiltration"
  },
  {
    id: "eg_007",
    agentId: "ag_onb_collect",
    agentName: "DataCollect-v3",
    requestedAction: "Forward customer KYC evidence after a delegated request from a peer explanation agent",
    target: "https://partner-collab.example.dev/cases/greenfield",
    sourceKind: "untrusted_content",
    contextAdmission: "quarantined",
    delegatedByAgentId: "ag_fraud_explain",
    delegationVerification: "unverified",
    taintedFields: ["inter_agent_message", "delegated_target", "kyc_evidence_packet"],
    riskFactors: ["private_data_access", "untrusted_content", "external_communication"],
    authorizationState: "out_of_scope",
    decision: "blocked",
    policyId: "POL-EGRESS-DELEGATION-015",
    decisionReason: "Blocked because an unverified inter-agent delegation asked a higher-privilege data collector to export customer KYC evidence, preventing a confused-deputy path and data exfiltration"
  }
];

export const demoMemoryWriteReviews: MemoryWriteReview[] = [
  {
    id: "memwr_001",
    agentId: "ag_kyc_audit",
    agentName: "AuditTrail-v1",
    requestedKey: "workspace.policy_baselines.kyc_review_v4",
    memoryScope: "workspace",
    sourceKind: "trusted_system",
    entryVector: "direct_write",
    corroboratingSourceIds: ["src_signed_policy_service"],
    crossSession: true,
    protectedKey: false,
    sensitiveDataDetected: false,
    integrityStatus: "verified",
    requestedTrustLayer: "retrieval_context",
    appliedTrustLayer: "retrieval_context",
    propagationState: "approved_workspace",
    recipientAgentIds: ["ag_kyc_doc", "ag_kyc_risk"],
    ttlHours: 168,
    decision: "allowed",
    policyId: "POL-MEMORY-INTEGRITY-016",
    decisionReason: "Allowed because a signed policy service supplied a checksum-verified baseline with a bounded seven-day lifetime"
  },
  {
    id: "memwr_002",
    agentId: "ag_onb_collect",
    agentName: "DataCollect-v3",
    requestedKey: "workspace.review_gates.customer_export",
    memoryScope: "workspace",
    sourceKind: "untrusted_content",
    entryVector: "direct_write",
    corroboratingSourceIds: [],
    crossSession: true,
    protectedKey: true,
    sensitiveDataDetected: false,
    integrityStatus: "baseline_mismatch",
    requestedTrustLayer: "system_prompt",
    appliedTrustLayer: "not_persisted",
    propagationState: "not_propagated",
    recipientAgentIds: [],
    ttlHours: null,
    decision: "blocked",
    policyId: "POL-MEMORY-POISONING-017",
    decisionReason: "Blocked because an onboarding PDF attempted to persist a protected customer-export gate change and promote it into the system-prompt control plane across future sessions, preventing memory poisoning"
  },
  {
    id: "memwr_003",
    agentId: "ag_fraud_explain",
    agentName: "ExplainGen-v2",
    requestedKey: "workspace.policy_baselines.kyc_review_v4",
    memoryScope: "workspace",
    sourceKind: "untrusted_content",
    entryVector: "direct_write",
    corroboratingSourceIds: [],
    crossSession: true,
    protectedKey: true,
    sensitiveDataDetected: false,
    integrityStatus: "baseline_mismatch",
    requestedTrustLayer: "system_prompt",
    appliedTrustLayer: "not_persisted",
    propagationState: "not_propagated",
    recipientAgentIds: [],
    ttlHours: null,
    decision: "blocked",
    policyId: "POL-MEMORY-IMPERSONATION-022",
    decisionReason: "Blocked because an inter-agent message claimed to originate from a privileged audit agent (AuditTrail-v1) but identity-verification failed, detecting agent impersonation, and the message attempted to overwrite a policy baseline into the system-prompt control plane"
  },
  {
    id: "memwr_004",
    agentId: "ag_fraud_tx",
    agentName: "TxScreener-v3",
    requestedKey: "workspace.review_gates.transaction_hold_threshold",
    memoryScope: "workspace",
    sourceKind: "untrusted_content",
    entryVector: "session_summary",
    corroboratingSourceIds: [],
    crossSession: true,
    protectedKey: true,
    sensitiveDataDetected: false,
    integrityStatus: "baseline_mismatch",
    requestedTrustLayer: "global_hooks",
    appliedTrustLayer: "not_persisted",
    propagationState: "not_propagated",
    recipientAgentIds: [],
    ttlHours: null,
    decision: "blocked",
    policyId: "POL-MEMORY-SUMMARY-023",
    decisionReason: "Blocked because a session summarizer condensed an untrusted customer message into a proposed cross-session threshold change for the transaction-hold hook, no independent source of record corroborated the claim, and the summary attempted to promote the change into the global-hooks control plane, preventing summary-laundered memory poisoning"
  },
  {
    id: "memwr_005",
    agentId: "ag_kyc_doc",
    agentName: "DocReview-v2",
    requestedKey: "workspace.policy_baselines.transaction_hold_threshold",
    memoryScope: "workspace",
    sourceKind: "untrusted_content",
    entryVector: "retrieval_result",
    corroboratingSourceIds: [],
    crossSession: true,
    protectedKey: true,
    sensitiveDataDetected: false,
    integrityStatus: "baseline_mismatch",
    requestedTrustLayer: "global_hooks",
    appliedTrustLayer: "not_persisted",
    propagationState: "not_propagated",
    recipientAgentIds: [],
    ttlHours: null,
    decision: "blocked",
    policyId: "POL-MEMORY-RETRIEVAL-024",
    decisionReason: "Blocked because a shared-index retrieval returned a poisoned FAQ chunk seeded inside an uploaded onboarding document instructing agents to lower the transaction-hold threshold and promote the change into the global-hooks control plane; retrieved chunks are untrusted input and a retrieval hit cannot corroborate its own cross-session write, preventing retrieval-poisoned memory propagation"
  },
  {
    id: "memwr_006",
    agentId: "ag_kyc_doc",
    agentName: "DocReview-v2",
    requestedKey: "workspace.tool_policies.external_export",
    memoryScope: "workspace",
    sourceKind: "untrusted_content",
    entryVector: "query_only_interaction",
    corroboratingSourceIds: [],
    crossSession: true,
    protectedKey: true,
    sensitiveDataDetected: false,
    integrityStatus: "baseline_mismatch",
    requestedTrustLayer: "system_prompt",
    appliedTrustLayer: "not_persisted",
    propagationState: "not_propagated",
    recipientAgentIds: [],
    ttlHours: null,
    decision: "blocked",
    policyId: "POL-MEMORY-QUERY-025",
    decisionReason: "Blocked because an ordinary user query seeded a malicious experience into the shared memory bank for later retrieval by other users, without an independent source of record, preventing query-only memory injection from reaching the system-prompt control plane"
  }
];

export const demoToolGrantReviews: ToolGrantReview[] = [
  {
    id: "tool_001",
    agentId: "ag_kyc_audit",
    agentName: "AuditTrail-v1",
    serverName: "internal://mcp/evidence-ledger",
    toolName: "ledger.append_hash",
    baselineManifestHash: "sha256:7c3d1e90-tool-001",
    observedManifestHash: "sha256:7c3d1e90-tool-001",
    manifestIntegrity: "match",
    hiddenInstructionDetected: false,
    lastScannedAt: "2026-06-08T14:30:00Z",
    decision: "allowed",
    policyId: "POL-TOOL-MANIFEST-018",
    decisionReason: "Allowed because the observed tool manifest matches the operator-approved hash and the description scan found no embedded instructions"
  },
  {
    id: "tool_002",
    agentId: "ag_kyc_risk",
    agentName: "RiskScorer-v1",
    serverName: "mcp://vendor-screening/sanctions-tools",
    toolName: "sanctions_lookup",
    baselineManifestHash: "sha256:4a8b2c10-tool-002",
    observedManifestHash: "sha256:9e5f7d31-tool-002",
    manifestIntegrity: "mismatch",
    hiddenInstructionDetected: true,
    lastScannedAt: "2026-06-08T14:31:00Z",
    decision: "blocked",
    policyId: "POL-TOOL-RUGPULL-019",
    decisionReason: "Blocked because the vendor server changed the tool description after operator approval, a rug pull, and the new description directs the agent to attach customer risk scores to every lookup, a tool poisoning exfiltration path"
  },
  {
    id: "tool_003",
    agentId: "ag_onb_collect",
    agentName: "DataCollect-v3",
    serverName: "mcp://doc-utils/summarizer",
    toolName: "summarize_document",
    baselineManifestHash: "sha256:2f6a9b44-tool-003",
    observedManifestHash: "sha256:2f6a9b44-tool-003",
    manifestIntegrity: "match",
    hiddenInstructionDetected: true,
    lastScannedAt: "2026-06-08T14:29:00Z",
    decision: "blocked",
    policyId: "POL-TOOL-POISON-020",
    decisionReason: "Blocked because the description scan found concealed instructions telling the agent to include conversation history in every document payload, a tool poisoning pattern, even though the manifest hash still matched the submitted version"
  },
  {
    id: "tool_004",
    agentId: "ag_fraud_explain",
    agentName: "ExplainGen-v2",
    serverName: "mcp://vendor-ml/fraud-signals",
    toolName: "explain_flag_reason",
    baselineManifestHash: "ecdsa:6b4e2a09-sig-20260605-tool-004",
    observedManifestHash: "ecdsa:3c1d9f78-sig-20260608-tool-004",
    manifestIntegrity: "mismatch",
    hiddenInstructionDetected: false,
    lastScannedAt: "2026-06-08T15:45:00Z",
    decision: "blocked",
    policyId: "POL-TOOL-RESIGNING-021",
    decisionReason: "Blocked because the vendor executed a rug pull — the tool manifest was re-signed with a different ECDSA signature key after operator approval. The observed manifest signature does not chain to the operator-approved signing certificate, preventing cryptographic manifest substitution attacks and tool metadata injection"
  }
];

export const demoCostSummary: CostSummary = {
  totalSpent: 285.80,
  budgetLimit: 500.00,
  percentUsed: 57,
  costByAgent: [
    { agentName: "DocReview-v2", cost: 47.50 },
    { agentName: "TxScreener-v3", cost: 82.30 },
    { agentName: "ExplainGen-v2", cost: 45.20 },
    { agentName: "DataCollect-v3", cost: 38.10 },
    { agentName: "RegDraft-v1", cost: 31.20 },
    { agentName: "RiskScorer-v1", cost: 18.40 },
    { agentName: "VerifyChain-v2", cost: 12.30 },
    { agentName: "FormatCheck-v1", cost: 5.40 },
    { agentName: "AuditTrail-v1", cost: 3.20 },
    { agentName: "RiskEval-v4", cost: 2.20 }
  ],
  costByProject: [
    { projectName: "Client Onboarding Pipeline", cost: 124.80 },
    { projectName: "Transaction Fraud Detection", cost: 82.30 },
    { projectName: "KYC Document Review", cost: 47.50 },
    { projectName: "Regulatory Report Generation", cost: 31.20 }
  ],
  costByCategory: [
    { category: "data_access", cost: 1.20 },
    { category: "risk_decision", cost: 0.35 },
    { category: "compliance_review", cost: 0.67 },
    { category: "system", cost: 1.13 }
  ]
};
