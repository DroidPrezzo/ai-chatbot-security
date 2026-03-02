"use client";

import { useState, useRef, useEffect } from "react";
import Nav from "@/components/Nav";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    defended: boolean;
    sanitized?: string;
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [defenseOn, setDefenseOn] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
            timestamp: new Date(),
            defended: defenseOn,
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: input,
                    defense: defenseOn,
                    history: messages.map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                }),
            });

            const data = await res.json();

            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.response || "No response from model.",
                timestamp: new Date(),
                defended: defenseOn,
                sanitized: data.sanitizedInput,
            };

            setMessages((prev) => [...prev, assistantMsg]);
        } catch {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content:
                    "⚠️ Connection error. Make sure Ollama is running with phi3:mini loaded.\n\nRun: `ollama serve` and `ollama pull phi3:mini`",
                timestamp: new Date(),
                defended: defenseOn,
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (d: Date) =>
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return (
        <>
            <Nav />
            <div className="chat-container">
                <div className="chat-header">
                    <div className="chat-header-info">
                        <h2 style={{ fontSize: "1.1rem", fontWeight: 600 }}>AI Chat</h2>
                        <span className="chat-model-badge">phi3:mini</span>
                    </div>
                    <div className="defense-toggle">
                        <label>Defense {defenseOn ? "ON" : "OFF"}</label>
                        <div className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={defenseOn}
                                onChange={(e) => setDefenseOn(e.target.checked)}
                                id="defense-toggle"
                            />
                            <span className="toggle-slider" />
                        </div>
                    </div>
                </div>

                <div className="chat-messages">
                    {messages.length === 0 && (
                        <div
                            style={{
                                textAlign: "center",
                                color: "var(--text-muted)",
                                marginTop: "4rem",
                            }}
                        >
                            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🤖</div>
                            <p style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                                Start a conversation with phi3:mini
                            </p>
                            <p style={{ fontSize: "0.85rem" }}>
                                Toggle the defense switch to test input sanitization
                            </p>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`message message-${msg.role}`}
                        >
                            <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
                            <div className="message-meta">
                                {formatTime(msg.timestamp)}
                                {msg.role === "assistant" && (
                                    <span
                                        className={`message-defense-tag ${msg.defended ? "defense-on" : "defense-off"}`}
                                        style={{ marginLeft: "0.5rem" }}
                                    >
                                        {msg.defended ? "🛡️ Defended" : "⚠️ Undefended"}
                                    </span>
                                )}
                            </div>
                            {msg.sanitized && msg.sanitized !== msg.content && (
                                <div
                                    style={{
                                        marginTop: "0.5rem",
                                        fontSize: "0.75rem",
                                        color: "var(--text-muted)",
                                        padding: "0.5rem",
                                        background: "rgba(16,185,129,0.08)",
                                        borderRadius: "6px",
                                    }}
                                >
                                    🧹 Input was sanitized before processing
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="typing-indicator">
                            <div className="typing-dot" />
                            <div className="typing-dot" />
                            <div className="typing-dot" />
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-container">
                    <form className="chat-input-wrapper" onSubmit={handleSubmit}>
                        <textarea
                            className="chat-input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message... (try emoji-encoded prompts to test defenses)"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                            rows={1}
                            id="chat-input"
                        />
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || !input.trim()}
                            id="send-button"
                        >
                            {loading ? <span className="spinner" /> : "Send"}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
