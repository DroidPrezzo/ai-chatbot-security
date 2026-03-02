import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "YewoAI — AI Chatbot Security Platform",
    description:
        "Test, attack, and defend your AI chatbot against emoji injection and prompt manipulation using PyRIT.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
