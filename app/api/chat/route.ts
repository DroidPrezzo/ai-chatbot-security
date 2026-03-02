import { NextRequest, NextResponse } from "next/server";

/** ============================================================
 *  DEFENSE LAYER — emoji + prompt injection sanitisation
 *  ============================================================ */

// Regex ranges covering most emoji / symbol / pictograph blocks
const EMOJI_PATTERN =
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{231A}-\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}]/gu;

// Variation selectors used in data-smuggling attacks
const VARIATION_SELECTORS = /[\u{FE00}-\u{FE0F}\u{E0100}-\u{E01EF}]/gu;

// Zero-width / invisible characters often used for injection
const INVISIBLE_CHARS = /[\u200B\u200C\u200D\u2060\uFEFF\u00AD]/g;

// Simple prompt injection pattern detection
const INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?previous\s+(instructions|prompts)/i,
    /you\s+are\s+now\s+/i,
    /act\s+as\s+(if|a)\s+/i,
    /pretend\s+(to\s+be|you\s+are)/i,
    /system\s*:\s*/i,
    /\[INST\]/i,
    /<<SYS>>/i,
    /jailbreak/i,
    /DAN\s+mode/i,
];

interface SanitizeResult {
    sanitized: string;
    original: string;
    threats: string[];
}

function sanitizeInput(text: string): SanitizeResult {
    const threats: string[] = [];
    let sanitized = text;

    // 1 — Strip variation selectors (data smuggling)
    if (VARIATION_SELECTORS.test(sanitized)) {
        threats.push("variation_selector_smuggling");
        sanitized = sanitized.replace(VARIATION_SELECTORS, "");
    }

    // 2 — Strip invisible / zero-width characters
    if (INVISIBLE_CHARS.test(sanitized)) {
        threats.push("invisible_character_injection");
        sanitized = sanitized.replace(INVISIBLE_CHARS, "");
    }

    // 3 — Strip emoji (obfuscation / ecoji)
    if (EMOJI_PATTERN.test(sanitized)) {
        threats.push("emoji_obfuscation");
        sanitized = sanitized.replace(EMOJI_PATTERN, "");
    }

    // 4 — Unicode NFKC normalisation (confusable homoglyphs → ASCII)
    sanitized = sanitized.normalize("NFKC");

    // 5 — Prompt injection pattern matching
    for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(sanitized)) {
            threats.push("prompt_injection_pattern");
            break;
        }
    }

    return { sanitized: sanitized.trim(), original: text, threats };
}

/** ============================================================
 *  API Route — POST /api/chat
 *  ============================================================ */

export async function POST(req: NextRequest) {
    try {
        const { message, defense, history } = await req.json();
        let processedMessage = message;
        let sanitizeResult: SanitizeResult | null = null;

        // Apply defense layer if enabled
        if (defense) {
            sanitizeResult = sanitizeInput(message);
            processedMessage = sanitizeResult.sanitized;

            // If input was entirely emoji / invisible → block it
            if (!processedMessage || processedMessage.length === 0) {
                return NextResponse.json({
                    response:
                        "🛡️ **Defense layer blocked this message.**\nThe input consisted entirely of emoji/invisible characters and was identified as a potential injection attack.",
                    sanitizedInput: "",
                    threats: sanitizeResult.threats,
                });
            }
        }

        // Build Ollama payload
        const ollamaMessages = [
            {
                role: "system",
                content:
                    "You are a helpful AI assistant. Respond concisely and accurately.",
            },
            ...(history || []).slice(-10),
            { role: "user", content: processedMessage },
        ];

        const ollamaRes = await fetch("http://localhost:11434/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "phi3:mini",
                messages: ollamaMessages,
                stream: false,
            }),
        });

        if (!ollamaRes.ok) {
            const errText = await ollamaRes.text();
            return NextResponse.json(
                {
                    response: `Ollama error: ${ollamaRes.status} — ${errText}`,
                    sanitizedInput: defense ? processedMessage : undefined,
                },
                { status: 502 }
            );
        }

        const data = await ollamaRes.json();

        return NextResponse.json({
            response: data.message?.content ?? "No response.",
            sanitizedInput: defense ? processedMessage : undefined,
            threats: sanitizeResult?.threats ?? [],
        });
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        return NextResponse.json(
            {
                response: `Connection failed — is Ollama running?\n\nError: ${errorMessage}`,
            },
            { status: 500 }
        );
    }
}
