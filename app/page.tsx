import Link from "next/link";
import Nav from "@/components/Nav";

export default function Home() {
    return (
        <>
            <Nav />
            <main>
                {/* Hero */}
                <section className="hero">
                    <h1 className="hero-title">
                        Secure Your AI.
                        <br />
                        <span className="gradient-text">Before Attackers Do.</span>
                    </h1>
                    <p className="hero-subtitle">
                        An AI security platform powered by phi3:mini. Simulate emoji
                        injection attacks with PyRIT, deploy defense layers, and generate
                        risk reports — all in one dashboard.
                    </p>
                    <div className="hero-actions">
                        <Link href="/chat" className="btn btn-primary">
                            💬 Open Chat
                        </Link>
                        <Link href="/attacks" className="btn btn-secondary">
                            ⚡ Launch Attacks
                        </Link>
                        <Link href="/report" className="btn btn-secondary">
                            📊 View Report
                        </Link>
                    </div>
                </section>

                {/* Feature Cards */}
                <div className="page-container">
                    <div className="feature-grid">
                        <div className="feature-card">
                            <div className="feature-icon">💬</div>
                            <h3 className="feature-title">AI Chatbot</h3>
                            <p className="feature-description">
                                Chat with phi3:mini in real-time. Toggle between defended and
                                undefended modes to see how your security layer performs.
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🧪</div>
                            <h3 className="feature-title">Attack Simulation</h3>
                            <p className="feature-description">
                                Run PyRIT-powered emoji injection attacks: obfuscation, Ecoji
                                encoding, Unicode smuggling, and variation selector injection.
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🛡️</div>
                            <h3 className="feature-title">Defense Layer</h3>
                            <p className="feature-description">
                                Input sanitization middleware that strips emoji encoding,
                                normalizes Unicode, and detects prompt injection patterns.
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">📊</div>
                            <h3 className="feature-title">Risk Report</h3>
                            <p className="feature-description">
                                Visual risk assessment with before/after defense comparisons,
                                pass/fail rates, and actionable recommendations.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
