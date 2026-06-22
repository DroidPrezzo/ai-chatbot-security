import Nav from "@/components/Nav";
import FeatureCard from "@/components/FeatureCard";

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
                        <FeatureCard href="/chat" icon="💬" title="AI Chatbot">
                            Chat with phi3:mini in real-time. Toggle between defended and
                            undefended modes to see how your security layer performs.
                        </FeatureCard>
                        <FeatureCard href="/attacks" icon="🧪" title="Attack Simulation">
                            Run PyRIT-powered emoji injection attacks: obfuscation, Ecoji
                            encoding, Unicode smuggling, and variation selector injection.
                        </FeatureCard>
                        <FeatureCard href="/chat" icon="🛡️" title="Defense Layer">
                            Input sanitization middleware that strips emoji encoding,
                            normalizes Unicode, and detects prompt injection patterns.
                        </FeatureCard>
                        <FeatureCard href="/report" icon="📊" title="Risk Report">
                            Visual risk assessment with before/after defense comparisons,
                            pass/fail rates, and actionable recommendations.
                        </FeatureCard>
                    </div>
                </div>
            </main>
        </>
    );
}
