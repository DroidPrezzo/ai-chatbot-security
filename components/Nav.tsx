"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
    { href: "/", label: "Dashboard" },
    { href: "/chat", label: "Chat" },
    { href: "/attacks", label: "Attack Lab" },
    { href: "/report", label: "Risk Report" },
];

export default function Nav() {
    const pathname = usePathname();

    return (
        <nav className="nav">
            <Link href="/" className="nav-brand">
                <span className="nav-brand-icon">🛡️</span>
                <span className="nav-brand-text">YewoAI</span>
            </Link>
            <ul className="nav-links">
                {NAV_ITEMS.map((item) => (
                    <li key={item.href}>
                        <Link
                            href={item.href}
                            className={`nav-link ${pathname === item.href ? "active" : ""}`}
                        >
                            {item.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
