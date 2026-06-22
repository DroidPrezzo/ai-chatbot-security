"use client";

import { useState, useEffect } from "react";
import Nav from "@/components/Nav";

interface AttackResult {
    id: string;
    name: string;
    category: string;
    defended: boolean;
    blocked: boolean;
    threats: string[];
    response: string;
    // Session metadata (added by the attack lab). Older results may lack these.
    runId?: string;
    runAt?: string;
}

interface SessionMetrics {
    runId: string;
    runAt: string;
    defended: boolean;
    score: number;
    riskLevel: "critical" | "high" | "medium" | "low";
    total: number;
    blocked: number;
    passed: number;
    blockRate: number;
    categories: { name: string; attacks: number; blocked: number }[];
}

// One "session" is a single run of the suite (one click of Run With/Without
// Defense). Results are grouped by their runId so separate runs stay separate
// instead of being aggregated into a single blended score.
function groupBySession(results: AttackResult[]) {
    const groups = new Map<string, AttackResult[]>();
    for (const r of results) {
        const key = r.runId ?? `legacy-${r.defended ? "def" : "undef"}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(r);
    }
    return [...groups.entries()]
        .map(([runId, rs]) => computeSessionMetrics(runId, rs))
        // Newest session first.
        .sort((a, b) => (a.runAt < b.runAt ? 1 : -1));
}

function computeSessionMetrics(
    runId: string,
    results: AttackResult[]
): SessionMetrics {
    const blocked = results.filter((r) => r.blocked).length;
    const passed = results.length - blocked;
    const blockRate = results.length > 0 ? blocked / results.length : 0;
    const score = Math.round(blockRate * 100);
    const riskLevel: SessionMetrics["riskLevel"] =
        score >= 80 ? "low" : score >= 60 ? "medium" : score >= 40 ? "high" : "critical";

    const cats = [...new Set(results.map((r) => r.category))];
    const categories = cats.map((cat) => ({
        name: cat,
        attacks: results.filter((r) => r.category === cat).length,
        blocked: results.filter((r) => r.category === cat && r.blocked).length,
    }));

    return {
        runId,
        runAt: results[0]?.runAt ?? "",
        defended: results[0]?.defended ?? false,
        score,
        riskLevel,
        total: results.length,
        blocked,
        passed,
        blockRate,
        categories,
    };
}

const RISK_COLORS = {
    critical: "var(--danger)",
    high: "#f97316",
    medium: "var(--warning)",
    low: "var(--success)",
};

function formatRunAt(runAt: string): string {
    if (!runAt) return "Earlier run";
    const d = new Date(runAt);
    return isNaN(d.getTime()) ? "Earlier run" : d.toLocaleString();
}

function SessionCard({ s }: { s: SessionMetrics }) {
    return (
        <div className="card" style={{ marginBottom: "2rem" }}>
            {/* Session header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "1rem",
                    marginBottom: "1.5rem",
                }}
            >
                <div>
                    <span
                        className={`badge ${s.defended ? "badge-success" : "badge-danger"}`}
                        style={{ fontSize: "0.85rem" }}
                    >
                        {s.defended ? "🛡️ Defended Run" : "🔓 Undefended Run"}
                    </span>
                    <div
                        style={{
                            fontSize: "0.8rem",
                            color: "var(--text-secondary)",
                            marginTop: "0.4rem",
                        }}
                    >
                        {formatRunAt(s.runAt)} · {s.total} scenarios
                    </div>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div
                        style={{
                            fontSize: "2rem",
                            fontWeight: 700,
                            color: RISK_COLORS[s.riskLevel],
                            lineHeight: 1,
                        }}
                    >
                        {s.score}
                    </div>
                    <div
                        style={{
                            fontSize: "0.7rem",
                            color: "var(--text-secondary)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                        }}
                    >
                        {s.riskLevel} risk
                    </div>
                </div>
            </div>

            {/* Summary stats */}
            <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
                <div className="stat-card">
                    <div className="stat-label">Scenarios</div>
                    <div className="stat-value">{s.total}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Blocked</div>
                    <div className="stat-value success">{s.blocked}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Passed</div>
                    <div className="stat-value danger">{s.passed}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Block Rate</div>
                    <div
                        className={`stat-value ${s.blockRate > 0.7 ? "success" : "danger"}`}
                    >
                        {Math.round(s.blockRate * 100)}%
                    </div>
                </div>
            </div>

            {/* Category breakdown */}
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Attacks</th>
                            <th>Blocked</th>
                            <th>Passed</th>
                            <th>Block Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        {s.categories.map((cat) => (
                            <tr key={cat.name}>
                                <td style={{ fontWeight: 500 }}>{cat.name}</td>
                                <td>{cat.attacks}</td>
                                <td style={{ color: "var(--success)" }}>{cat.blocked}</td>
                                <td style={{ color: "var(--danger)" }}>
                                    {cat.attacks - cat.blocked}
                                </td>
                                <td>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.75rem",
                                        }}
                                    >
                                        <div
                                            className="progress-bar"
                                            style={{ width: "80px" }}
                                        >
                                            <div
                                                className={`progress-fill ${cat.blocked / cat.attacks > 0.7 ? "success" : "danger"}`}
                                                style={{
                                                    width: `${(cat.blocked / cat.attacks) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <span style={{ fontSize: "0.85rem" }}>
                                            {Math.round((cat.blocked / cat.attacks) * 100)}%
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function ReportPage() {
    const [sessions, setSessions] = useState<SessionMetrics[]>([]);

    // Load results from localStorage (shared with attack page) and group them
    // into sessions. Re-runs the grouping whenever storage changes.
    useEffect(() => {
        const load = () => {
            const stored = localStorage.getItem("attack-results");
            if (!stored) {
                setSessions([]);
                return;
            }
            try {
                const parsed: AttackResult[] = JSON.parse(stored);
                setSessions(groupBySession(parsed));
            } catch {
                /* ignore malformed data */
            }
        };
        load();
        window.addEventListener("storage", load);
        return () => window.removeEventListener("storage", load);
    }, []);

    return (
        <>
            <Nav />
            <div className="page-container">
                <div className="section-header">
                    <h1 className="section-title">📊 Risk Report</h1>
                    <p className="section-subtitle">
                        Security assessment grouped by run — each session is scored
                        separately so defended and undefended runs stay distinct
                    </p>
                </div>

                {sessions.length === 0 ? (
                    <div
                        className="card"
                        style={{ textAlign: "center", padding: "4rem 2rem" }}
                    >
                        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📋</div>
                        <h2
                            style={{
                                fontSize: "1.2rem",
                                fontWeight: 600,
                                marginBottom: "0.5rem",
                            }}
                        >
                            No Attack Data Yet
                        </h2>
                        <p
                            style={{
                                color: "var(--text-secondary)",
                                marginBottom: "1.5rem",
                            }}
                        >
                            Run attacks from the Attack Lab first to generate a risk report.
                        </p>
                        <a href="/attacks" className="btn btn-primary">
                            ⚡ Go to Attack Lab
                        </a>
                    </div>
                ) : (
                    <>
                        <p
                            style={{
                                fontSize: "0.85rem",
                                color: "var(--text-secondary)",
                                marginBottom: "1.5rem",
                            }}
                        >
                            {sessions.length} session{sessions.length === 1 ? "" : "s"} —
                            newest first
                        </p>
                        {sessions.map((s) => (
                            <SessionCard key={s.runId} s={s} />
                        ))}
                    </>
                )}
            </div>
        </>
    );
}
