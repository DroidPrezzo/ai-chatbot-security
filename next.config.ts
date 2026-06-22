import type { NextConfig } from "next";

const attackServerUrl =
    process.env.ATTACK_SERVER_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
    // Emit a self-contained server bundle for a slim Docker image.
    output: "standalone",

    async rewrites() {
        return [
            {
                source: "/api/attacks/:path*",
                destination: `${attackServerUrl}/:path*`,
            },
        ];
    },

    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "X-Frame-Options",
                        value: "DENY",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=()",
                    },
                    {
                        key: "Content-Security-Policy",
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                            "font-src 'self' https://fonts.gstatic.com",
                            "img-src 'self' data: blob:",
                            "connect-src 'self'",
                            "frame-ancestors 'none'",
                        ].join("; "),
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
