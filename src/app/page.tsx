import {
  demoAgents,
  demoArtifacts,
  demoAuditLog,
  demoCostSummary,
  demoDriftAlerts,
  demoEgressGateReviews,
  isEgressDispatchAllowed,
  demoMemoryWriteReviews,
  demoMembers,
  demoToolGrantReviews,
  demoWorkspace
} from "@/lib/demo-data";
import type { AgentStatus, TrustLevel, DriftSeverity } from "@/lib/types";

/** Micro-components for clean dashboard rendering */
function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "green" | "red" | "amber" | "purple" | "indigo" }) {
  const t: Record<string, string> = {
    slate: "border-slate-200 bg-white text-slate-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-red-200 bg-red-50 text-red-700",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    purple: "border-indigo-200 bg-indigo-50 text-indigo-700",
    indigo: "border-indigo-200 bg-indigo-100 text-indigo-700"
  };
  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${t[tone]}`}>{children}</span>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur ${className}`}>{children}</section>;
}

function StatusDot({ status }: { status: AgentStatus }) {
  const c: Record<AgentStatus, string> = {
    idle: "bg-slate-300", running: "bg-emerald-500 animate-pulse", review_needed: "bg-amber-500",
    halted: "bg-red-500", completed: "bg-indigo-500", failed: "bg-red-600"
  };
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${c[status]}`} />;
}

function TrustBadge({ level }: { level: TrustLevel }) {
  const m: Record<TrustLevel, { label: string; tone: "green" | "amber" | "red" }> = {
    auto_approve: { label: "Auto", tone: "green" },
    review_required: { label: "Review", tone: "amber" },
    deny: { label: "Deny", tone: "red" }
  };
  return <Badge tone={m[level].tone}>{m[level].label}</Badge>;
}

function DriftSeverityBadge({ severity }: { severity: DriftSeverity }) {
  const m: Record<DriftSeverity, { label: string; tone: "green" | "amber" | "red" }> = {
    none: { label: "None", tone: "green" }, low: { label: "Low", tone: "green" },
    medium: { label: "Medium", tone: "amber" }, high: { label: "High", tone: "red" }
  };
  return <Badge tone={m[severity].tone}>{m[severity].label}</Badge>;
}

function ProgressBar({ value, max, tone = "indigo" }: { value: number; max: number; tone?: "indigo" | "red" | "emerald" }) {
  const pct = Math.min(100, (value / max) * 100);
  const bg = tone === "red" ? "bg-red-600" : tone === "emerald" ? "bg-emerald-600" : "bg-indigo-600";
  return <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className={`h-full rounded-full ${bg}`} style={{ width: `${pct}%` }} /></div>;
}

export default function Home() {
  const activeAgents = demoAgents.filter(a => a.status === "running").length;
  const haltedAgents = demoAgents.filter(a => a.loopDetected || a.status === "halted").length;
  const pendingReviews = demoArtifacts.filter(a => a.status === "pending_review").length;
  const highDrifts = demoDriftAlerts.filter(d => d.severity === "high").length;
  const blockedEgress = demoEgressGateReviews.filter(review => review.decision === "blocked").length;
  const quarantinedMemoryWrites = demoMemoryWriteReviews.filter(review => review.decision === "blocked").length;
  const blockedToolGrants = demoToolGrantReviews.filter(review => review.decision === "blocked").length;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-5 py-8 md:px-8 lg:px-10 bg-slate-50">
      {/* HEADER */}
      <header className="grid gap-6 rounded-[2rem] border border-white/80 bg-white/80 p-8 shadow-sm backdrop-blur lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge tone="purple">Multi-Agent Orchestration</Badge>
            <Badge tone="green">{demoWorkspace.name}</Badge>
            <Badge>{demoWorkspace.memberCount} members</Badge>
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-indigo-600">Command Center</p>
          <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-6xl">AI Agent Operations Dashboard</h1>
          <p className="max-w-3xl text-lg leading-8 text-slate-600">
            Real-time observability across {demoAgents.length} agent workers. Track costs, detect drift, catch loops,
            review outputs, and keep humans in control — not watching a firehose.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Active agents", value: activeAgents, sub: `${demoAgents.length} total` },
            { label: "Pending reviews", value: pendingReviews, sub: "artifacts awaiting" },
            { label: "Loop halts", value: haltedAgents, sub: "auto-detected" },
            { label: "High drift alerts", value: highDrifts, sub: "requiring action" }
          ].map(s => (
            <div key={s.label} className="rounded-2xl bg-slate-950 p-4 text-white">
              <p className="text-sm text-slate-300">{s.label}</p>
              <p className="text-3xl font-black">{s.value}</p>
              <p className="text-xs text-slate-400">{s.sub}</p>
            </div>
          ))}
        </div>
      </header>

      {/* AGENT OBSERVABILITY GRID */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-950">Agent Workers</h2>
          <div className="flex gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><StatusDot status="running" /> Running</span>
            <span className="flex items-center gap-1"><StatusDot status="idle" /> Idle</span>
            <span className="flex items-center gap-1"><StatusDot status="review_needed" /> Needs Review</span>
            <span className="flex items-center gap-1"><StatusDot status="halted" /> Halted</span>
            <span className="flex items-center gap-1"><StatusDot status="completed" /> Done</span>
            <span className="flex items-center gap-1"><StatusDot status="failed" /> Failed</span>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {demoAgents.map(agent => (
            <Card key={agent.id} className={agent.loopDetected ? "ring-2 ring-red-300" : ""}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StatusDot status={agent.status} />
                  <h3 className="font-bold text-slate-950">{agent.name}</h3>
                </div>
                <TrustBadge level={agent.trustLevel} />
              </div>
              <p className="mt-1 text-xs text-slate-500">{agent.type.replace(/_/g, " ")}</p>
              <p className="mt-2 text-sm leading-5 text-slate-700">{agent.currentTask}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                <span>{agent.tokensUsed.toLocaleString()} tokens</span>
                <span>·</span>
                <span>${agent.estimatedCost.toFixed(2)} est.</span>
                <span>·</span>
                <span>{agent.projectId === "proj_kyc" ? "KYC" : agent.projectId === "proj_fraud" ? "Fraud" : agent.projectId === "proj_reporting" ? "Reporting" : "Onboarding"}</span>
              </div>
              {agent.loopDetected && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  ⚠ Loop detected — agent auto-halted
                </div>
              )}
              {/* State trail */}
              <div className="mt-3 flex flex-wrap gap-1">
                {agent.stateHistory.map((s, i) => (
                  <span key={`${s}-${i}`} className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${i === agent.stateHistory.length - 1 ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"}`}>
                    {s.replace(/_/g, " ")}
                    {i < agent.stateHistory.length - 1 && <span className="ml-1 text-slate-300">→</span>}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* DRIFT ALERTS + COST */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold text-slate-950">Drift Detection</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            When two agents disagree on the same assumption, their outputs diverge. These alerts flag conflicts before they cascade.
          </p>
          <div className="mt-4 space-y-3">
            {demoDriftAlerts.map(alert => (
              <div key={alert.id} className={`rounded-2xl border p-4 ${alert.severity === "high" ? "border-red-200 bg-red-50/50" : "border-amber-200 bg-amber-50/50"}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-950">{alert.assumption}</p>
                  <DriftSeverityBadge severity={alert.severity} />
                </div>
                <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs text-slate-400">{alert.agentAName}</p>
                    <p className="font-medium text-slate-800">{alert.aValue}</p>
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs text-slate-400">{alert.agentBName}</p>
                    <p className="font-medium text-slate-800">{alert.bValue}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-slate-950">Cost Tracking</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Every agent run estimates cost before execution and reports actual cost after. Budget alerts fire at 80%.
          </p>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Monthly spend</span>
              <span className="text-sm font-semibold">
                ${demoCostSummary.totalSpent.toFixed(2)} <span className="text-slate-400">/ ${demoCostSummary.budgetLimit.toFixed(2)}</span>
              </span>
            </div>
            <div className="mt-2"><ProgressBar value={demoCostSummary.totalSpent} max={demoCostSummary.budgetLimit} tone={demoCostSummary.percentUsed > 80 ? "red" : "indigo"} /></div>
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">By agent</p>
            {demoCostSummary.costByAgent.slice(0, 6).map(a => (
              <div key={a.agentName} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <span className="truncate">{a.agentName}</span>
                <span className="font-semibold tabular-nums">${a.cost.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">By project</p>
            {demoCostSummary.costByProject.map(p => (
              <div key={p.projectName} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <span className="truncate">{p.projectName}</span>
                <span className="font-semibold tabular-nums">${p.cost.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* EGRESS GATE */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Egress Gate Reviews</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              Prompt-injection defenses treat content-derived targets as tainted. External actions are blocked or routed to review before data leaves the workspace.
            </p>
          </div>
          <Badge tone={blockedEgress > 0 ? "red" : "green"}>{blockedEgress} blocked</Badge>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {demoEgressGateReviews.map(review => (
            <div key={review.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-950">{review.agentName}</p>
                <Badge tone={review.decision === "blocked" ? "red" : review.decision === "review_required" ? "amber" : "green"}>
                  {review.decision.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-5 text-slate-700">{review.requestedAction}</p>
              <p className="mt-2 break-all text-xs text-slate-500">Target: {review.target}</p>
              {review.delegatedByAgentId && (
                <p className="mt-2 text-xs font-semibold text-red-700">
                  Delegated by: {review.delegatedByAgentId} · {review.delegationVerification.replace(/_/g, " ")}
                </p>
              )}
              <p className={`mt-2 text-xs font-semibold ${review.contextAdmission === "quarantined" ? "text-red-700" : review.contextAdmission === "human_review_required" ? "text-amber-700" : "text-emerald-700"}`}>
                Context admission: {review.contextAdmission.replace(/_/g, " ")} · source: {review.sourceKind.replace(/_/g, " ")}
              </p>
              <p className="mt-2 text-xs font-semibold text-indigo-600">{review.policyId}</p>
              {review.taintedFields.length > 0 && (
                <p className="mt-2 text-xs text-red-600">Tainted fields: {review.taintedFields.join(", ")}</p>
              )}
              {review.riskFactors.length > 0 && (
                <p className="mt-1 text-xs text-amber-700">Risk factors: {review.riskFactors.map(factor => factor.replace(/_/g, " ")).join(", ")}</p>
              )}
              <p className={`mt-1 text-xs font-semibold ${review.authorizationState === "out_of_scope" ? "text-red-700" : "text-slate-600"}`}>
                Authorization: {review.authorizationState.replace(/_/g, " ")}
              </p>
              <p className={`mt-1 text-xs font-semibold ${isEgressDispatchAllowed(review) ? "text-emerald-700" : "text-red-700"}`}>
                Execution: {isEgressDispatchAllowed(review) ? "released" : "held by egress gate"}
              </p>
              <p className="mt-1 text-xs font-semibold text-indigo-700">
                Workflow trace: {review.traceStatus} · {review.workflowId}
              </p>
              {review.upstreamReviewIds.length > 0 && (
                <p className="mt-1 text-xs text-red-600">Upstream gate reviews: {review.upstreamReviewIds.join(", ")}</p>
              )}
            </div>
          ))}
        </div>
      </Card>


      {/* PERSISTENT MEMORY GATE */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Persistent Memory Gate</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              Cross-session writes are scoped, integrity-checked, and retention-bounded before they can influence future agent runs.
            </p>
          </div>
          <Badge tone={quarantinedMemoryWrites > 0 ? "red" : "green"}>{quarantinedMemoryWrites} quarantined</Badge>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {demoMemoryWriteReviews.map(review => (
            <div key={review.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-950">{review.agentName}</p>
                <Badge tone={review.decision === "blocked" ? "red" : review.decision === "review_required" ? "amber" : "green"}>
                  {review.decision.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="mt-2 break-all text-sm font-medium text-slate-700">{review.requestedKey}</p>
              <p className="mt-2 text-xs text-slate-500">
                Scope: {review.memoryScope} · cross-session: {review.crossSession ? "yes" : "no"} · TTL: {review.ttlHours === null ? "not persisted" : `${review.ttlHours}h`}
              </p>
              <p className={`mt-2 text-xs font-semibold ${review.sourceKind === "untrusted_content" ? "text-amber-700" : "text-slate-600"}`}>
                Source: {review.sourceKind.replace(/_/g, " ")}
              </p>
              <p className={`mt-2 text-xs font-semibold ${(review.entryVector === "session_summary" || review.entryVector === "retrieval_result" || review.entryVector === "query_only_interaction") ? "text-amber-700" : "text-slate-600"}`}>
                Entry vector: {review.entryVector.replace(/_/g, " ")}
                {review.corroboratingSourceIds.length > 0
                  ? ` · corroborated by: ${review.corroboratingSourceIds.join(", ")}`
                  : " · no corroborating source"}
              </p>
              <p className={`mt-2 text-xs font-semibold ${review.appliedTrustLayer === "not_persisted" ? "text-red-700" : "text-indigo-700"}`}>
                Requested layer: {review.requestedTrustLayer.replace(/_/g, " ")} · applied: {review.appliedTrustLayer.replace(/_/g, " ")}
              </p>
              <p className={`mt-2 text-xs font-semibold ${review.propagationState === "not_propagated" ? "text-red-700" : "text-slate-600"}`}>
                Propagation: {review.propagationState.replace(/_/g, " ")} · recipients: {review.recipientAgentIds.length === 0 ? "none" : review.recipientAgentIds.join(", ")}
              </p>
              <p className={`mt-2 text-xs font-semibold ${review.integrityStatus === "baseline_mismatch" ? "text-red-700" : "text-emerald-700"}`}>
                Integrity: {review.integrityStatus.replace(/_/g, " ")}
                {review.protectedKey ? " · protected key" : ""}
                {review.sensitiveDataDetected ? " · sensitive data detected" : ""}
              </p>
              <p className="mt-2 text-xs font-semibold text-indigo-600">{review.policyId}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{review.decisionReason}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* TOOL GRANT REVIEWS */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Tool Grant Reviews</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              Connected tool manifests are hash-pinned at approval and re-scanned before each run. Rug-pulled descriptions and concealed instructions are blocked before an agent can call the tool.
            </p>
          </div>
          <Badge tone={blockedToolGrants > 0 ? "red" : "green"}>{blockedToolGrants} blocked</Badge>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {demoToolGrantReviews.map(review => (
            <div key={review.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-950">{review.agentName}</p>
                <Badge tone={review.decision === "blocked" ? "red" : review.decision === "review_required" ? "amber" : "green"}>
                  {review.decision.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="mt-2 text-sm font-medium text-slate-700">{review.toolName}</p>
              <p className="mt-1 break-all text-xs text-slate-500">Server: {review.serverName}</p>
              <p className={`mt-2 text-xs font-semibold ${review.manifestIntegrity === "mismatch" ? "text-red-700" : "text-emerald-700"}`}>
                Manifest integrity: {review.manifestIntegrity}
              </p>
              <p className={`mt-1 text-xs font-semibold ${review.hiddenInstructionDetected ? "text-red-700" : "text-emerald-700"}`}>
                Description scan: {review.hiddenInstructionDetected ? "hidden instructions detected" : "clean"}
              </p>
              <p className="mt-2 text-xs font-semibold text-indigo-600">{review.policyId}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{review.decisionReason}</p>
            </div>
          ))}
        </div>
      </Card>


      {/* ARTIFACT REVIEW + AUDIT LOG */}
      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <h2 className="text-xl font-bold text-slate-950">Run Artifact Review</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Agent outputs that require human approval before downstream action. Configured per-agent by trust level.
          </p>
          <div className="mt-4 space-y-4">
            {demoArtifacts.map(art => (
              <div key={art.id} className={`rounded-2xl border p-4 ${art.agentId === "ag_fraud_explain" ? "border-red-200 bg-red-50/30" : "border-amber-200 bg-amber-50/30"}`}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-950">{art.title}</p>
                    <p className="text-xs text-slate-400">{art.agentName} · {art.type}</p>
                  </div>
                  <Badge tone={art.agentId === "ag_fraud_explain" ? "red" : "amber"}>
                    {art.agentId === "ag_fraud_explain" ? "Loop-tainted" : "Review needed"}
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{art.content}</p>
                <div className="mt-3 flex gap-2">
                  <button className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white">Accept</button>
                  <button className="rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600">Request Changes</button>
                  <button className="rounded-xl border border-red-200 bg-white px-4 py-1.5 text-xs font-semibold text-red-600">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-slate-950">Audit Log</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Every agent action is recorded with cost, timestamp, and traceable detail. Filter by agent, project, or action type.
          </p>
          <div className="mt-4 space-y-2 max-h-[400px] overflow-auto">
            {demoAuditLog.map(entry => (
              <div key={entry.id} className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-indigo-600">{entry.action.replace(/_/g, " ")}</span>
                  <span className="tabular-nums text-slate-400">${entry.cost.toFixed(2)}</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-600">{entry.detail}</p>
                <div className="mt-2 rounded-lg bg-white px-2 py-1 text-[10px] leading-4 text-slate-500">
                  <span className="font-semibold text-slate-700">{entry.policyId}</span> · {entry.decisionReason}
                </div>
                <p className="mt-1 text-[10px] text-slate-400">{new Date(entry.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* MEMBERS */}
      <Card>
        <h2 className="text-xl font-bold text-slate-950">Workspace Members</h2>
        <div className="mt-4 flex flex-wrap gap-4">
          {demoMembers.map(m => (
            <div key={m.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">{m.avatarInitials}</span>
              <div>
                <p className="font-semibold text-slate-950">{m.name}</p>
                <p className="text-xs text-slate-500 capitalize">{m.role}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}
