/**
 * Share-link encoder/decoder.
 *
 * Serializes a {@link ShareableQuestionState} (template id + resolved
 * variables + optional metadata) into a compact, URL-safe base64 string that
 * can be embedded in a share URL, and parses it back. A schema version and
 * `pq:` prefix are included for forward compatibility. Pure-TS, no storage
 * dependencies.
 */
/** Schema version for the share-link payload. */
export const SHARE_LINK_VERSION: number = 1;
/** State captured in a share link. */
export interface ShareableQuestionState {
    /** Schema version for forward compatibility. */
    v: number;
    /** The template id that generated the question. */
    templateId: string;
    /** Resolved variable values. */
    variables: Record<string, unknown>;
    /** Response mode ("mcq" | "frq"). */
    responseMode?: string;
    /** Question type. */
    questionType?: string;
    /** Difficulty. */
    difficulty?: number;
    /** Epoch milliseconds when the link was generated. */
    timestamp?: number;
}
/** Encodes/decodes question state to/from a URL-safe base64 share link. The `pq.` prefix is used for new links because `.` is an unreserved character in RFC 3986 (fully URL-safe) and is not part of the base64url alphabet, making it an unambiguous delimiter. The legacy `pq:` prefix and its URL-encoded `pq%3A` form are accepted on decode for backward compatibility. */
export class ShareLinkCodec {
    private static readonly PREFIX: string = "pq.";
    private static readonly LEGACY_PREFIX: string = "pq:";
    private static readonly ENCODED_LEGACY_PREFIX: string = "pq%3A";
    /** Encode a shareable state into a URL-safe base64 share-link string with the `pq.` prefix. */
    public encode(state: Omit<ShareableQuestionState, "v">): string {
        const full: ShareableQuestionState = {v: SHARE_LINK_VERSION, ...state};
        return ShareLinkCodec.PREFIX + this.toBase64Url(JSON.stringify(full));
    }
    /** Decode a share-link string back into the shareable state. Throws on malformed input. Accepts the current `pq.` prefix, the legacy `pq:` prefix, and the URL-encoded `pq%3A` form. */
    public decode(payload: string): ShareableQuestionState {
        const prefix: string | null = this.matchPrefix(payload);
        if (prefix === null) {
            throw new Error("Invalid share link: missing prefix");
        }
        const body: string = payload.slice(prefix.length);
        const json: string = this.fromBase64Url(body);
        const parsed: unknown = JSON.parse(json);
        return this.validate(parsed);
    }
    /** Return true when `payload` looks like a share link (has a recognized prefix). */
    public looksLike(payload: string): boolean {
        return this.matchPrefix(payload) !== null;
    }
    /** Return the matching prefix string (current `pq.`, legacy `pq:`, or URL-encoded legacy `pq%3A`), or null when no prefix matches. */
    private matchPrefix(payload: string): string | null {
        if (payload.startsWith(ShareLinkCodec.PREFIX)) {
            return ShareLinkCodec.PREFIX;
        } else if (payload.startsWith(ShareLinkCodec.LEGACY_PREFIX)) {
            return ShareLinkCodec.LEGACY_PREFIX;
        } else if (payload.startsWith(ShareLinkCodec.ENCODED_LEGACY_PREFIX)) {
            return ShareLinkCodec.ENCODED_LEGACY_PREFIX;
        }
        return null;
    }
    /** Encode a UTF-8 source string as URL-safe base64. */
    private toBase64Url(value: string): string {
        const bytes: Uint8Array = new TextEncoder().encode(value);
        let binary: string = "";
        for (const b of bytes) {
            binary += String.fromCharCode(b);
        }
        const b64: string = btoa(binary);
        return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }
    /** Decode a URL-safe base64 string into a UTF-8 string. */
    private fromBase64Url(value: string): string {
        let b64: string = value.replace(/-/g, "+").replace(/_/g, "/");
        const pad: number = b64.length % 4;
        if (pad === 1) {
            throw new Error("Invalid base64url length");
        }
        if (pad === 2) {
            b64 += "==";
        } else if (pad === 3) {
            b64 += "=";
        }
        const binary: string = atob(b64);
        const bytes: Uint8Array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
    }
    /** Validate the parsed payload shape and return a typed state. */
    private validate(parsed: unknown): ShareableQuestionState {
        if (typeof parsed !== "object" || parsed === null) {
            throw new Error("Invalid share link: payload is not an object");
        }
        const obj: Record<string, unknown> = parsed as Record<string, unknown>;
        const v: unknown = obj["v"];
        if (typeof v !== "number") {
            throw new Error("Invalid share link: missing version");
        }
        const templateId: unknown = obj["templateId"];
        if (typeof templateId !== "string") {
            throw new Error("Invalid share link: missing templateId");
        }
        const variables: unknown = obj["variables"];
        if (typeof variables !== "object" || variables === null) {
            throw new Error("Invalid share link: missing variables");
        }
        const result: ShareableQuestionState = {
            v,
            templateId,
            variables: variables as Record<string, unknown>,
        };
        const responseMode: unknown = obj["responseMode"];
        if (typeof responseMode === "string") {
            result.responseMode = responseMode;
        }
        const questionType: unknown = obj["questionType"];
        if (typeof questionType === "string") {
            result.questionType = questionType;
        }
        const difficulty: unknown = obj["difficulty"];
        if (typeof difficulty === "number") {
            result.difficulty = difficulty;
        }
        const timestamp: unknown = obj["timestamp"];
        if (typeof timestamp === "number") {
            result.timestamp = timestamp;
        }
        return result;
    }
}
