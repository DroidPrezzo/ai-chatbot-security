"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

interface Props {
    href: string;
    icon: string;
    title: string;
    children: ReactNode;
}

// A clickable dashboard card. It renders a real anchor (so keyboard focus,
// right-click, and modifier-clicks all behave normally), but a plain left
// click is handled by the Next router in-page. Driving the navigation in JS
// and preventing the anchor's default keeps it in the SAME tab even when the
// app is viewed inside an embedded preview frame that would otherwise pop the
// href into a new tab.
export default function FeatureCard({ href, icon, title, children }: Props) {
    const router = useRouter();

    return (
        <a
            href={href}
            className="feature-card"
            onClick={(e) => {
                // Let the browser handle new-tab/new-window intents.
                if (
                    e.defaultPrevented ||
                    e.button !== 0 ||
                    e.metaKey ||
                    e.ctrlKey ||
                    e.shiftKey ||
                    e.altKey
                ) {
                    return;
                }
                e.preventDefault();
                router.push(href);
            }}
        >
            <div className="feature-icon">{icon}</div>
            <h3 className="feature-title">{title}</h3>
            <p className="feature-description">{children}</p>
        </a>
    );
}
