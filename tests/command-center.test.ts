import { describe, it, expect } from "vitest";
import { demoAgents, demoDriftAlerts, demoCostSummary, demoArtifacts, demoAuditLog, demoEgressGateReviews, demoMemoryWriteReviews, demoToolGrantReviews } from "@/lib/demo-data";

describe("agent observability", () => {
  it("has 10 agent workers", () => {
    expect(demoAgents).toHaveLength(10);
  });

  it("every agent has a project", () => {
    for (const agent of demoAgents) {
      expect(agent.projectId).toBeTruthy();
    }
  });

  it("halted agents have loopDetected=true or status=halted", () => {
    const halted = demoAgents.filter(a => a.loopDetected || a.status === "halted");
    expect(halted.length).toBeGreaterThan(0);
    for (const agent of halted) {
      expect(agent.loopDetected || agent.status === "halted").toBe(true);
    }
  });
});

describe("drift detection", () => {
  it("has at least one high-severity drift", () => {
    const high = demoDriftAlerts.filter(d => d.severity === "high");
    expect(high.length).toBeGreaterThanOrEqual(1);
  });

  it("each drift has two different agents", () => {
    for (const drift of demoDriftAlerts) {
      expect(drift.agentAId).not.toBe(drift.agentBId);
    }
  });
});

describe("cost tracking", () => {
  it("total does not exceed budget", () => {
    expect(demoCostSummary.totalSpent).toBeLessThanOrEqual(demoCostSummary.budgetLimit);
  });

  it("percent matches calculation", () => {
    const expected = Math.round((demoCostSummary.totalSpent / demoCostSummary.budgetLimit) * 100);
    expect(demoCostSummary.percentUsed).toBe(expected);
  });

  it("provides category-level cost attribution from the audit log", () => {
    const actualByCategory = new Map<string, number>();
    for (const entry of demoAuditLog) {
      const prev = actualByCategory.get(entry.category) ?? 0;
      actualByCategory.set(entry.category, prev + entry.cost);
    }

    for (const bucket of demoCostSummary.costByCategory) {
      expect(bucket.cost).toBeGreaterThan(0);
      expect(Math.abs(bucket.cost - (actualByCategory.get(bucket.category) ?? 0))).toBeLessThan(0.02);
    }
  });

  it("covers every audit category present in the log", () => {
    const loggedCategories = new Set(demoAuditLog.map(e => e.category));
    const summaryCategories = new Set(demoCostSummary.costByCategory.map(b => b.category));
    expect(summaryCategories).toEqual(loggedCategories);
  });
});

describe("artifact review", () => {
  it("has pending review artifacts", () => {
    const pending = demoArtifacts.filter(a => a.status === "pending_review");
    expect(pending.length).toBeGreaterThan(0);
  });
});

describe("egress gate", () => {
  it("blocks external actions tainted by untrusted content", () => {
    const untrustedExternalActions = demoEgressGateReviews.filter(
      review => review.sourceKind === "untrusted_content" && !review.target.startsWith("internal://")
    );

    expect(untrustedExternalActions.length).toBeGreaterThan(0);
    for (const review of untrustedExternalActions) {
      expect(review.decision).toBe("blocked");
      expect(review.taintedFields.length).toBeGreaterThan(0);
    }
  });

  it("keeps context admission aligned with source trust", () => {
    for (const review of demoEgressGateReviews) {
      if (review.sourceKind === "untrusted_content") {
        expect(review.contextAdmission).toBe("quarantined");
        expect(review.decision).toBe("blocked");
      } else if (review.sourceKind === "operator_instruction") {
        expect(review.contextAdmission).toBe("human_review_required");
        expect(review.decision).toBe("review_required");
      } else {
        expect(review.contextAdmission).toBe("admitted");
        expect(review.decision).toBe("allowed");
      }
    }
  });

  it("binds every egress decision to the agent authorization scope", () => {
    const outOfScope = demoEgressGateReviews.filter(review => review.authorizationState === "out_of_scope");
    const humanReview = demoEgressGateReviews.filter(review => review.authorizationState === "human_review_required");

    expect(outOfScope.length).toBeGreaterThan(0);
    expect(humanReview.length).toBeGreaterThan(0);
    expect(outOfScope.every(review => review.decision === "blocked")).toBe(true);
    expect(humanReview.every(review => review.decision === "review_required")).toBe(true);
  });

  it("documents a policy and rationale for every egress decision", () => {
    for (const review of demoEgressGateReviews) {
      expect(review.policyId).toMatch(/^POL-EGRESS-/);
      expect(review.decisionReason.length).toBeGreaterThan(80);
    }
  });

  it("blocks lethal-trifecta egress before private data leaves through untrusted external channels", () => {
    const lethalTrifecta = demoEgressGateReviews.filter(
      review =>
        review.riskFactors.includes("private_data_access") &&
        review.riskFactors.includes("untrusted_content") &&
        review.riskFactors.includes("external_communication")
    );

    expect(lethalTrifecta.length).toBeGreaterThan(0);
    for (const review of lethalTrifecta) {
      expect(review.sourceKind).toBe("untrusted_content");
      expect(review.target).not.toMatch(/^internal:\/\//);
      expect(review.decision).toBe("blocked");
      expect(review.decisionReason.toLowerCase()).toContain("exfiltration");
    }
  });

  it("blocks untrusted documents from selecting external targets for customer evidence packets", () => {
    const evidencePacketAttempts = demoEgressGateReviews.filter(
      review =>
        review.sourceKind === "untrusted_content" &&
        review.taintedFields.includes("kyc_evidence_packet") &&
        review.taintedFields.includes("external_upload_url")
    );

    expect(evidencePacketAttempts.length).toBeGreaterThan(0);
    for (const review of evidencePacketAttempts) {
      expect(review.target).not.toMatch(/^internal:\/\//);
      expect(review.decision).toBe("blocked");
      expect(review.decisionReason).toContain("data exfiltration");
    }
  });

  it("blocks third-party API responses from authorizing sensitive exports", () => {
    const apiResponseExports = demoEgressGateReviews.filter(
      review =>
        review.sourceKind === "untrusted_content" &&
        review.taintedFields.includes("api_response_webhook_url")
    );

    expect(apiResponseExports.length).toBeGreaterThan(0);
    for (const review of apiResponseExports) {
      expect(review.target).not.toMatch(/^internal:\/\//);
      expect(review.decision).toBe("blocked");
      expect(review.taintedFields).toEqual(expect.arrayContaining(["customer_risk_scores"]));
      expect(review.decisionReason.toLowerCase()).toContain("tool abuse");
      expect(review.decisionReason.toLowerCase()).toContain("data exfiltration");
    }
  });

  it("blocks external image rendering from leaking telemetry through URL parameters", () => {
    const externalRenders = demoEgressGateReviews.filter(review =>
      review.taintedFields.includes("external_image_url")
    );

    expect(externalRenders.length).toBeGreaterThan(0);
    for (const review of externalRenders) {
      expect(review.sourceKind).toBe("untrusted_content");
      expect(review.target).not.toMatch(/^internal:\/\//);
      expect(review.taintedFields).toEqual(expect.arrayContaining(["url_query_parameter", "account_telemetry"]));
      expect(review.authorizationState).toBe("out_of_scope");
      expect(review.decision).toBe("blocked");
      expect(review.decisionReason.toLowerCase()).toContain("image rendering");
      expect(review.decisionReason.toLowerCase()).toContain("data exfiltration");
    }
  });

  it("blocks unverified inter-agent delegation before a higher-privilege agent acts", () => {
    const unverifiedDelegations = demoEgressGateReviews.filter(
      review => review.delegationVerification === "unverified"
    );

    expect(unverifiedDelegations.length).toBeGreaterThan(0);
    for (const review of unverifiedDelegations) {
      expect(review.delegatedByAgentId).toBeTruthy();
      expect(review.sourceKind).toBe("untrusted_content");
      expect(review.authorizationState).toBe("out_of_scope");
      expect(review.decision).toBe("blocked");
      expect(review.decisionReason.toLowerCase()).toContain("confused-deputy");
      expect(review.decisionReason.toLowerCase()).toContain("data exfiltration");
    }
  });

  it("keeps delegated egress requests attributable to known agent workers", () => {
    const agentIds = new Set(demoAgents.map(agent => agent.id));

    for (const review of demoEgressGateReviews) {
      if (review.delegationVerification === "not_applicable") {
        expect(review.delegatedByAgentId).toBeNull();
        continue;
      }

      expect(review.delegatedByAgentId).not.toBeNull();
      expect(agentIds.has(review.agentId)).toBe(true);
      expect(agentIds.has(review.delegatedByAgentId!)).toBe(true);
      expect(review.delegatedByAgentId).not.toBe(review.agentId);
    }
  });
});


describe("persistent memory gate", () => {
  it("quarantines untrusted attempts to modify protected cross-session memory", () => {
    const poisoningAttempts = demoMemoryWriteReviews.filter(
      review => review.policyId === "POL-MEMORY-POISONING-017"
    );

    expect(poisoningAttempts.length).toBeGreaterThan(0);
    for (const review of poisoningAttempts) {
      expect(review.integrityStatus).toBe("baseline_mismatch");
      expect(review.decision).toBe("blocked");
      expect(review.ttlHours).toBeNull();
      expect(review.decisionReason.toLowerCase()).toContain("memory poisoning");
    }
  });

  it("prevents untrusted memory from entering trusted instruction layers", () => {
    const controlPlaneRequests = demoMemoryWriteReviews.filter(review =>
      review.requestedTrustLayer === "system_prompt" || review.requestedTrustLayer === "global_hooks"
    );

    expect(controlPlaneRequests.length).toBeGreaterThan(0);
    for (const review of controlPlaneRequests) {
      expect(review.sourceKind).toBe("untrusted_content");
      expect(review.appliedTrustLayer).toBe("not_persisted");
      expect(review.decision).toBe("blocked");
      expect(review.decisionReason.toLowerCase()).toContain("control plane");
    }
  });

  it("blocks poisoned memory from propagating to peer agents", () => {
    const agentIds = new Set(demoAgents.map(agent => agent.id));
    const poisoningAttempts = demoMemoryWriteReviews.filter(
      review => review.sourceKind === "untrusted_content" || review.integrityStatus === "baseline_mismatch"
    );

    expect(poisoningAttempts.length).toBeGreaterThan(0);
    for (const review of poisoningAttempts) {
      expect(review.propagationState).toBe("not_propagated");
      expect(review.recipientAgentIds).toHaveLength(0);
      expect(review.decision).toBe("blocked");
    }

    const approvedPropagation = demoMemoryWriteReviews.filter(
      review => review.propagationState === "approved_workspace"
    );
    expect(approvedPropagation.length).toBeGreaterThan(0);
    for (const review of approvedPropagation) {
      expect(review.sourceKind).toBe("trusted_system");
      expect(review.integrityStatus).toBe("verified");
      expect(review.recipientAgentIds.length).toBeGreaterThan(0);
      expect(review.recipientAgentIds.every(agentId => agentIds.has(agentId))).toBe(true);
    }
  });

  it("detects agent impersonation when an untrusted inter-agent message claims a privileged identity", () => {
    const impersonationAttempts = demoMemoryWriteReviews.filter(
      review => review.policyId === "POL-MEMORY-IMPERSONATION-022"
    );

    expect(impersonationAttempts).toHaveLength(1);
    for (const review of impersonationAttempts) {
      expect(review.sourceKind).toBe("untrusted_content");
      expect(review.integrityStatus).toBe("baseline_mismatch");
      expect(review.protectedKey).toBe(true);
      expect(review.requestedTrustLayer).toBe("system_prompt");
      expect(review.appliedTrustLayer).toBe("not_persisted");
      expect(review.decision).toBe("blocked");
      expect(review.decisionReason.toLowerCase()).toContain("impersonation");
      expect(review.decisionReason.toLowerCase()).toContain("identity-verification");
    }
  });

  it("only persists verified cross-session memory with bounded retention", () => {
    const persisted = demoMemoryWriteReviews.filter(review => review.crossSession && review.decision === "allowed");

    expect(persisted.length).toBeGreaterThan(0);
    for (const review of persisted) {
      expect(review.sourceKind).toBe("trusted_system");
      expect(review.integrityStatus).toBe("verified");
      expect(review.requestedTrustLayer).toBe("retrieval_context");
      expect(review.appliedTrustLayer).toBe("retrieval_context");
      expect(review.ttlHours).toBeGreaterThan(0);
      expect(review.ttlHours).toBeLessThanOrEqual(168);
    }
  });

  it("blocks session-summary-derived memory when no independent source corroborates the claim", () => {
    const summaryWrites = demoMemoryWriteReviews.filter(
      review => review.entryVector === "session_summary"
    );

    expect(summaryWrites.length).toBeGreaterThan(0);
    for (const review of summaryWrites) {
      expect(review.sourceKind).toBe("untrusted_content");
      expect(review.corroboratingSourceIds).toHaveLength(0);
      expect(review.appliedTrustLayer).toBe("not_persisted");
      expect(review.decision).toBe("blocked");
      expect(review.decisionReason.toLowerCase()).toContain("summary-laundered");
      expect(review.decisionReason.toLowerCase()).toContain("corroborated");
    }
  });

  it("requires corroborating sources for every non-blocked cross-session write", () => {
    const persisted = demoMemoryWriteReviews.filter(
      review => review.crossSession && review.decision !== "blocked"
    );

    expect(persisted.length).toBeGreaterThan(0);
    for (const review of persisted) {
      expect(review.corroboratingSourceIds.length).toBeGreaterThan(0);
    }
  });

  it("treats retrieval results as untrusted input that cannot re-persist policy memory", () => {
    const retrievalWrites = demoMemoryWriteReviews.filter(
      review => review.entryVector === "retrieval_result"
    );

    expect(retrievalWrites.length).toBeGreaterThan(0);
    for (const review of retrievalWrites) {
      expect(review.sourceKind).toBe("untrusted_content");
      expect(review.protectedKey).toBe(true);
      expect(review.integrityStatus).toBe("baseline_mismatch");
      expect(review.decision).toBe("blocked");
      expect(review.decisionReason.toLowerCase()).toContain("retrieval");
    }
  });

  it("never lets a retrieved chunk corroborate its own cross-session write", () => {
    const retrievalWrites = demoMemoryWriteReviews.filter(
      review => review.entryVector === "retrieval_result"
    );

    expect(retrievalWrites.length).toBeGreaterThan(0);
    for (const review of retrievalWrites) {
      expect(review.corroboratingSourceIds).toHaveLength(0);
      expect(review.crossSession).toBe(true);
      expect(review.appliedTrustLayer).toBe("not_persisted");
      expect(review.propagationState).toBe("not_propagated");
      expect(review.recipientAgentIds).toHaveLength(0);
    }
  });

  it("blocks seeded retrieval chunks from promoting policy changes into the control plane", () => {
    const retrievalWrites = demoMemoryWriteReviews.filter(
      review => review.entryVector === "retrieval_result"
    );

    expect(retrievalWrites.length).toBeGreaterThan(0);
    for (const review of retrievalWrites) {
      expect(review.requestedTrustLayer).toBe("global_hooks");
      expect(review.appliedTrustLayer).toBe("not_persisted");
      expect(review.decision).toBe("blocked");
      expect(review.decisionReason.toLowerCase()).toContain("control plane");
    }
  });

  it("blocks query-only memory injection into a shared workspace", () => {
    const queryOnlyWrites = demoMemoryWriteReviews.filter(
      review => review.policyId === "POL-MEMORY-QUERY-025"
    );

    expect(queryOnlyWrites).toHaveLength(1);
    for (const review of queryOnlyWrites) {
      expect(review.entryVector).toBe("query_only_interaction");
      expect(review.sourceKind).toBe("untrusted_content");
      expect(review.crossSession).toBe(true);
      expect(review.protectedKey).toBe(true);
      expect(review.corroboratingSourceIds).toHaveLength(0);
      expect(review.requestedTrustLayer).toBe("system_prompt");
      expect(review.appliedTrustLayer).toBe("not_persisted");
      expect(review.propagationState).toBe("not_propagated");
      expect(review.decision).toBe("blocked");
      expect(review.decisionReason.toLowerCase()).toContain("shared memory");
      expect(review.decisionReason.toLowerCase()).toContain("query-only");
    }
  });

  it("records an entry vector for every memory write review", () => {
    expect(demoMemoryWriteReviews.length).toBeGreaterThan(0);
    for (const review of demoMemoryWriteReviews) {
      expect(["direct_write", "session_summary", "retrieval_result", "query_only_interaction"]).toContain(review.entryVector);
    }
  });
});

describe("tool grant reviews", () => {
  it("blocks rug-pulled tools whose manifest changed after operator approval", () => {
    const rugPulled = demoToolGrantReviews.filter(review => review.manifestIntegrity === "mismatch");

    expect(rugPulled.length).toBeGreaterThan(0);
    for (const review of rugPulled) {
      expect(review.baselineManifestHash).not.toBe(review.observedManifestHash);
      expect(review.decision).toBe("blocked");
      expect(review.decisionReason.toLowerCase()).toContain("rug pull");
    }
  });

  it("blocks tools whose descriptions carry hidden instructions", () => {
    const poisonedDescriptions = demoToolGrantReviews.filter(review => review.hiddenInstructionDetected);

    expect(poisonedDescriptions.length).toBeGreaterThan(0);
    for (const review of poisonedDescriptions) {
      expect(review.decision).not.toBe("allowed");
      expect(review.decisionReason.toLowerCase()).toContain("tool poisoning");
    }
  });

  it("only allows tools with matching manifests and clean description scans", () => {
    const allowed = demoToolGrantReviews.filter(review => review.decision === "allowed");

    expect(allowed.length).toBeGreaterThan(0);
    for (const review of allowed) {
      expect(review.manifestIntegrity).toBe("match");
      expect(review.hiddenInstructionDetected).toBe(false);
      expect(review.baselineManifestHash).toBe(review.observedManifestHash);
    }
  });

  it("keeps tool grant reviews attributable to known agent workers", () => {
    const agentIds = new Set(demoAgents.map(agent => agent.id));

    expect(demoToolGrantReviews.length).toBeGreaterThan(0);
    for (const review of demoToolGrantReviews) {
      expect(agentIds.has(review.agentId)).toBe(true);
    }
  });

  it("detects and blocks tools re-signed with different cryptographic keys without re-approval", () => {
    const resignedTools = demoToolGrantReviews.filter(
      review => review.policyId === "POL-TOOL-RESIGNING-021"
    );

    expect(resignedTools.length).toBeGreaterThan(0);
    for (const review of resignedTools) {
      expect(review.manifestIntegrity).toBe("mismatch");
      expect(review.baselineManifestHash).not.toBe(review.observedManifestHash);
      expect(review.decision).toBe("blocked");
      expect(review.decisionReason.toLowerCase()).toContain("re-signed");
      expect(review.decisionReason.toLowerCase()).toContain("manifest substitution");
    }
  });
});


describe("permissioned audit trail", () => {
  it("records immutable hashes for every audit event", () => {
    for (const entry of demoAuditLog) {
      expect(entry.immutableHash).toMatch(/^sha256:/);
    }
  });

  it("ties every permission decision to an auditable policy and rationale", () => {
    for (const entry of demoAuditLog) {
      expect(entry.policyId).toMatch(/^POL-/);
      expect(entry.decisionReason.length).toBeGreaterThan(40);
    }
  });

  it("routes risk and compliance decisions through explicit review gates", () => {
    const gated = demoAuditLog.filter(entry => ["risk_decision", "compliance_review"].includes(entry.category));

    expect(gated.length).toBeGreaterThan(0);
    expect(gated.some(entry => entry.permissionDecision === "review_required")).toBe(true);
  });

  it("blocks system events when agents loop or upstream systems fail", () => {
    const blockedSystemEvents = demoAuditLog.filter(entry => entry.category === "system" && entry.permissionDecision === "blocked");

    expect(blockedSystemEvents.map(entry => entry.action)).toEqual(expect.arrayContaining(["loop_halted", "api_timeout"]));
  });

  it("never auto-approves material regulatory actions — risk flags, compliance drafts, and anomaly reports always route through review", () => {
    const materialRegulatoryActions = demoAuditLog.filter(
      entry =>
        entry.category === "risk_decision" ||
        (entry.category === "compliance_review" && entry.action !== "validation_passed")
    );

    expect(materialRegulatoryActions.length).toBeGreaterThan(0);
    for (const entry of materialRegulatoryActions) {
      expect(entry.permissionDecision).not.toBe("allowed");
    }
  });
});
