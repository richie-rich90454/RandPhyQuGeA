import {describe, it, expect} from "vitest";
import {ShareLinkCodec, SHARE_LINK_VERSION} from "../share/ShareLinkCodec";
describe("ShareLinkCodec.encode", () => {
    it("produces a string with the pq: prefix", () => {
        const codec = new ShareLinkCodec();
        const link = codec.encode({templateId: "T1", variables: {x: 3}});
        expect(link.startsWith("pq:")).toBe(true);
    });
    it("produces URL-safe base64 (no +, /, or =)", () => {
        const codec = new ShareLinkCodec();
        const link = codec.encode({templateId: "T1", variables: {x: 3}});
        const body = link.slice(3);
        expect(body).not.toContain("+");
        expect(body).not.toContain("/");
        expect(body).not.toContain("=");
    });
    it("includes schema version 1 in the payload", () => {
        const codec = new ShareLinkCodec();
        const link = codec.encode({templateId: "T1", variables: {}});
        const decoded = codec.decode(link);
        expect(decoded.v).toBe(SHARE_LINK_VERSION);
        expect(decoded.v).toBe(1);
    });
});
describe("ShareLinkCodec round-trip", () => {
    it("round-trips a minimal state with only templateId and variables", () => {
        const codec = new ShareLinkCodec();
        const link = codec.encode({templateId: "Q1", variables: {x: 5, y: 10}});
        const decoded = codec.decode(link);
        expect(decoded.templateId).toBe("Q1");
        expect(decoded.variables).toEqual({x: 5, y: 10});
        expect(decoded.responseMode).toBeUndefined();
        expect(decoded.questionType).toBeUndefined();
        expect(decoded.difficulty).toBeUndefined();
        expect(decoded.timestamp).toBeUndefined();
    });
    it("round-trips all optional fields", () => {
        const codec = new ShareLinkCodec();
        const link = codec.encode({
            templateId: "Q2",
            variables: {a: 1},
            responseMode: "mcq",
            questionType: "MC",
            difficulty: 3,
            timestamp: 1234567890,
        });
        const decoded = codec.decode(link);
        expect(decoded.templateId).toBe("Q2");
        expect(decoded.variables).toEqual({a: 1});
        expect(decoded.responseMode).toBe("mcq");
        expect(decoded.questionType).toBe("MC");
        expect(decoded.difficulty).toBe(3);
        expect(decoded.timestamp).toBe(1234567890);
    });
    it("round-trips unicode content in variables", () => {
        const codec = new ShareLinkCodec();
        const link = codec.encode({templateId: "Q3", variables: {label: "héllo π ≥", sym: "αβγ"}});
        const decoded = codec.decode(link);
        expect(decoded.variables).toEqual({label: "héllo π ≥", sym: "αβγ"});
    });
    it("round-trips a large numeric variable", () => {
        const codec = new ShareLinkCodec();
        const link = codec.encode({templateId: "Q4", variables: {n: 6.022e23}});
        const decoded = codec.decode(link);
        expect(decoded.variables).toEqual({n: 6.022e23});
    });
});
describe("ShareLinkCodec.decode errors", () => {
    it("throws when the prefix is missing", () => {
        const codec = new ShareLinkCodec();
        expect(() => codec.decode("notalink")).toThrow("missing prefix");
    });
    it("throws when the base64 body is invalid", () => {
        const codec = new ShareLinkCodec();
        expect(() => codec.decode("pq:!!!")).toThrow();
    });
    it("throws when the decoded payload is not an object", () => {
        const codec = new ShareLinkCodec();
        const body = btoa('"just a string"');
        expect(() => codec.decode("pq:" + body)).toThrow("not an object");
    });
    it("throws when version is missing", () => {
        const codec = new ShareLinkCodec();
        const body = btoa(JSON.stringify({templateId: "Q1", variables: {}}));
        expect(() => codec.decode("pq:" + body)).toThrow("missing version");
    });
    it("throws when templateId is missing", () => {
        const codec = new ShareLinkCodec();
        const body = btoa(JSON.stringify({v: 1, variables: {}}));
        expect(() => codec.decode("pq:" + body)).toThrow("missing templateId");
    });
    it("throws when variables is missing", () => {
        const codec = new ShareLinkCodec();
        const body = btoa(JSON.stringify({v: 1, templateId: "Q1"}));
        expect(() => codec.decode("pq:" + body)).toThrow("missing variables");
    });
    it("throws when variables is null", () => {
        const codec = new ShareLinkCodec();
        const body = btoa(JSON.stringify({v: 1, templateId: "Q1", variables: null}));
        expect(() => codec.decode("pq:" + body)).toThrow("missing variables");
    });
});
describe("ShareLinkCodec.looksLike", () => {
    it("returns true for a string with the pq: prefix", () => {
        const codec = new ShareLinkCodec();
        expect(codec.looksLike("pq:abc")).toBe(true);
    });
    it("returns false for a string without the prefix", () => {
        const codec = new ShareLinkCodec();
        expect(codec.looksLike("https://example.com")).toBe(false);
    });
    it("returns true for an actual encoded link", () => {
        const codec = new ShareLinkCodec();
        const link = codec.encode({templateId: "Q1", variables: {}});
        expect(codec.looksLike(link)).toBe(true);
    });
});
