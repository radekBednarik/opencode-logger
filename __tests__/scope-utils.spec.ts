import { describe, expect, it } from "bun:test";
import { shouldLogEvent } from "../src/utils.js";

describe("shouldLogEvent", () => {
	it("should allow all events if scope is undefined", () => {
		expect(shouldLogEvent("session.created", undefined)).toBe(true);
	});

	it("should allow all events if scope is empty string", () => {
		expect(shouldLogEvent("session.created", "")).toBe(true);
	});

	it("should allow all events if scope is '*'", () => {
		expect(shouldLogEvent("session.created", "*")).toBe(true);
		expect(shouldLogEvent("random.event", "*")).toBe(true);
	});

	it("should allow exact matches", () => {
		const scope = "session.created, file.edited";
		expect(shouldLogEvent("session.created", scope)).toBe(true);
		expect(shouldLogEvent("file.edited", scope)).toBe(true);
	});

	it("should deny events not in the exact match list", () => {
		const scope = "session.created, file.edited";
		expect(shouldLogEvent("session.deleted", scope)).toBe(false);
	});

	it("should allow group wildcards", () => {
		const scope = "session.*";
		expect(shouldLogEvent("session.created", scope)).toBe(true);
		expect(shouldLogEvent("session.deleted", scope)).toBe(true);
		expect(shouldLogEvent("session.updated", scope)).toBe(true);
	});

	it("should deny events not matching group wildcards", () => {
		const scope = "session.*";
		expect(shouldLogEvent("file.edited", scope)).toBe(false);
	});

	it("should handle mixed exact matches and wildcards", () => {
		const scope = "session.*, file.edited, lsp.client.*";
		expect(shouldLogEvent("session.created", scope)).toBe(true);
		expect(shouldLogEvent("file.edited", scope)).toBe(true);
		expect(shouldLogEvent("lsp.client.diagnostics", scope)).toBe(true);
		expect(shouldLogEvent("file.created", scope)).toBe(false);
	});

	it("should handle whitespace in comma-separated list", () => {
		const scope = " session.created ,  file.edited  ";
		expect(shouldLogEvent("session.created", scope)).toBe(true);
		expect(shouldLogEvent("file.edited", scope)).toBe(true);
	});

	it("should correctly handle partial prefix matches without dot if not intended", () => {
		const scope = "user.*";
		expect(shouldLogEvent("user.created", scope)).toBe(true);
		expect(shouldLogEvent("username.update", scope)).toBe(false);
	});
});
