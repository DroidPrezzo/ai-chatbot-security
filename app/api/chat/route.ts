import { NextRequest, NextResponse } from "next/server";

/** ============================================================
 *  CONFIGURATION — read from environment with safe defaults
 *  ============================================================ */

const OLLAMA_BASE_URL = (() => {
    const url = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    // Validate protocol to prevent SSRF via env tampering
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            console.error(`[security] Invalid OLLAMA_BASE_URL protocol: ${parsed.protocol}. Falling back to default.`);
            return "http://localhost:11434";
        }
        return url;
    } catch {
        console.error(`[security] Invalid OLLAMA_BASE_URL: "${url}". Falling back to default.`);
        return "http://localhost:11434";
    }
})();

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "phi3:mini";
const SYSTEM_PROMPT =
    process.env.SYSTEM_PROMPT ||
    "You are a helpful AI assistant. Respond concisely and accurately.";

/** ============================================================
 *  INPUT LIMITS — prevent unbounded consumption (OWASP LLM10)
 *  ============================================================ */

const MAX_MESSAGE_LENGTH = 4000;
const MAX_HISTORY_LENGTH = 20;
const MAX_HISTORY_ENTRY_LENGTH = 2000;
const ALLOWED_ROLES = new Set(["user", "assistant"]);

/** ============================================================
 *  DEFENSE LAYER — emoji + prompt injection sanitisation
 *  ============================================================ */

// Regex ranges covering most emoji / symbol / pictograph blocks
// NOTE: Use separate patterns for test vs replace to avoid
// the lastIndex bug with the `g` flag on RegExp.prototype.test()
const EMOJI_PATTERN_TEST =
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{231A}-\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}]/u;
const EMOJI_PATTERN_REPLACE =
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{231A}-\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}]/gu;

// Variation selectors used in data-smuggling attacks
const VARIATION_SELECTORS_TEST = /[\u{FE00}-\u{FE0F}\u{E0100}-\u{E01EF}]/u;
const VARIATION_SELECTORS_REPLACE = /[\u{FE00}-\u{FE0F}\u{E0100}-\u{E01EF}]/gu;

// Zero-width / invisible characters often used for injection
const INVISIBLE_CHARS_TEST = /[\u200B\u200C\u200D\u2060\uFEFF\u00AD]/;
const INVISIBLE_CHARS_REPLACE = /[\u200B\u200C\u200D\u2060\uFEFF\u00AD]/g;

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
    if (VARIATION_SELECTORS_TEST.test(sanitized)) {
        threats.push("variation_selector_smuggling");
        sanitized = sanitized.replace(VARIATION_SELECTORS_REPLACE, "");
    }

    // 2 — Strip invisible / zero-width characters
    if (INVISIBLE_CHARS_TEST.test(sanitized)) {
        threats.push("invisible_character_injection");
        sanitized = sanitized.replace(INVISIBLE_CHARS_REPLACE, "");
    }

    // 3 — Strip emoji (obfuscation / ecoji)
    if (EMOJI_PATTERN_TEST.test(sanitized)) {
        threats.push("emoji_obfuscation");
        sanitized = sanitized.replace(EMOJI_PATTERN_REPLACE, "");
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
 *  VALIDATION HELPERS
 *  ============================================================ */

interface HistoryEntry {
    role: string;
    content: string;
}

function validateAndSanitizeHistory(
    history: unknown
): HistoryEntry[] {
    if (!Array.isArray(history)) return [];

    return history
        .slice(0, MAX_HISTORY_LENGTH)
        .filter((entry): entry is HistoryEntry => {
            if (typeof entry !== "object" || entry === null) return false;
            const e = entry as Record<string, unknown>;
            if (typeof e.role !== "string" || typeof e.content !== "string")
                return false;
            // Block injected "system" role messages — only allow user/assistant
            if (!ALLOWED_ROLES.has(e.role)) return false;
            return true;
        })
        .map((entry) => ({
            role: entry.role,
            // Truncate overly long history entries
            content: entry.content.slice(0, MAX_HISTORY_ENTRY_LENGTH),
        }));
}

/** Strips potentially sensitive internals from error text */
function sanitizeErrorMessage(rawError: string): string {
    // Remove file paths, IP addresses, and stack traces
    return rawError
        .replace(/\/[\w/.-]+/g, "[path]")
        .replace(/\d{1,3}(\.\d{1,3}){3}(:\d+)?/g, "[addr]")
        .replace(/at\s+.+\(.+\)/g, "")
        .slice(0, 200);
}

/** ============================================================
 *  API Route — POST /api/chat
 *  ============================================================ */

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message, defense, history } = body;

        // ── Input validation ────────────────────────────────
        if (typeof message !== "string" || message.length === 0) {
            return NextResponse.json(
                { response: "Message is required.", model: OLLAMA_MODEL },
                { status: 400 }
            );
        }

        if (message.length > MAX_MESSAGE_LENGTH) {
            return NextResponse.json(
                {
                    response: `Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters allowed.`,
                    model: OLLAMA_MODEL,
                },
                { status: 400 }
            );
        }

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
                    model: OLLAMA_MODEL,
                });
            }
        }

        // ── Validate & sanitize history ─────────────────────
        const safeHistory = validateAndSanitizeHistory(history);

        // Build Ollama payload
        const ollamaMessages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...safeHistory,
            { role: "user", content: processedMessage },
        ];

        const ollamaRes = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                messages: ollamaMessages,
                stream: false,
            }),
        });

        if (!ollamaRes.ok) {
            const errText = await ollamaRes.text();
            // Log the full error server-side for debugging
            console.error(`[ollama] Upstream error ${ollamaRes.status}: ${errText}`);
            return NextResponse.json(
                {
                    response: `Model service error (${ollamaRes.status}). Please try again.`,
                    sanitizedInput: defense ? processedMessage : undefined,
                    model: OLLAMA_MODEL,
                },
                { status: 502 }
            );
        }

        const data = await ollamaRes.json();

        return NextResponse.json({
            response: data.message?.content ?? "No response.",
            sanitizedInput: defense ? processedMessage : undefined,
            threats: sanitizeResult?.threats ?? [],
            model: OLLAMA_MODEL,
        });
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        // Log full error server-side, return sanitized version to client
        console.error(`[chat] Request failed: ${errorMessage}`);
        return NextResponse.json(
            {
                response: `Connection failed — is the model service running?\n\nError: ${sanitizeErrorMessage(errorMessage)}`,
                model: OLLAMA_MODEL,
            },
            { status: 500 }
        );
    }
}
