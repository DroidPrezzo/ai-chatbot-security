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
                        <span className="gradient-text">Before Attackers get in.</span>
                    </h1>
                    <p className="hero-subtitle">
                        An AI security platform powered by phi3:mini. Simulate emoji
                        injection attacks with PyRIT, deploy defense layers, and generate
                        risk reports — all in one dashboard.
                    </p>
                </section>

                {/* Feature Cards — each card links to its section */}
                <div className="page-container">
                    <div className="feature-grid">
                        <Link href="/chat" className="feature-card">
                            <div className="feature-icon">💬</div>
                            <h3 className="feature-title">AI Chatbot</h3>
                            <p className="feature-description">
                                Chat with phi3:mini in real-time. Toggle between defended and
                                undefended modes to see how your security layer performs.
                            </p>
                        </Link>
                        <Link href="/attacks" className="feature-card">
                            <div className="feature-icon">🧪</div>
                            <h3 className="feature-title">Attack Simulation</h3>
                            <p className="feature-description">
                                Run PyRIT-powered emoji injection attacks: obfuscation, Ecoji
                                encoding, Unicode smuggling, and variation selector injection.
                            </p>
                        </Link>
                        <Link href="/chat" className="feature-card">
                            <div className="feature-icon">🛡️</div>
                            <h3 className="feature-title">Defense Layer</h3>
                            <p className="feature-description">
                                Input sanitization middleware that strips emoji encoding,
                                normalizes Unicode, and detects prompt injection patterns.
                            </p>
                        </Link>
                        <Link href="/report" className="feature-card">
                            <div className="feature-icon">📊</div>
                            <h3 className="feature-title">Risk Report</h3>
                            <p className="feature-description">
                                Visual risk assessment with before/after defense comparisons,
                                pass/fail rates, and actionable recommendations.
                            </p>
                        </Link>
                    </div>
                </div>
            </main>
        </>
    );
}
