import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
	DEFAULT_LOG_DIRECTORY,
	DEFAULT_LOG_FILENAME,
} from "../src/constants.js";
import { FileLogger } from "../src/file-logger.js";

const TEST_ROOT = process.cwd(); // In test environment, this will use CWD
const LOG_DIR_PATH = join(TEST_ROOT, DEFAULT_LOG_DIRECTORY);
const LOG_FILE_PATH = join(LOG_DIR_PATH, DEFAULT_LOG_FILENAME);

describe("FileLogger", () => {
	beforeAll(() => {
		// Clean up before tests
		if (existsSync(LOG_DIR_PATH)) {
			rmSync(LOG_DIR_PATH, { recursive: true, force: true });
		}
	});

	afterAll(() => {
		// Clean up after tests
		if (existsSync(LOG_DIR_PATH)) {
			rmSync(LOG_DIR_PATH, { recursive: true, force: true });
		}
	});

	it("should initialize and create the log directory", async () => {
		const logger = new FileLogger(TEST_ROOT);
		await logger.init();

		expect(existsSync(LOG_DIR_PATH)).toBe(true);
	});

	it("should log events to the file in JSONL format", async () => {
		const logger = new FileLogger(TEST_ROOT);
		await logger.init();

		const testEvent = "test.event";
		const testPayload = { foo: "bar" };

		await logger.log(testEvent, testPayload);

		expect(existsSync(LOG_FILE_PATH)).toBe(true);

		const content = readFileSync(LOG_FILE_PATH, "utf-8");
		const lines = content.trim().split("\n");
		expect(lines.length).toBe(1);

		const entry = JSON.parse(lines[0] || "");
		expect(entry.eventType).toBe(testEvent);
		expect(entry.payload).toEqual(testPayload);
		expect(entry.timestamp).toBeDefined();
	});

	it("should append multiple logs correctly", async () => {
		const logger = new FileLogger(TEST_ROOT);
		await logger.init();

		await logger.log("event.one", { id: 1 });
		await logger.log("event.two", { id: 2 });

		const content = readFileSync(LOG_FILE_PATH, "utf-8");
		const lines = content.trim().split("\n");
		// Depending on previous test, it might be 3 or 2. Let's just check the last two.

		// Since we are appending, we need to read all lines and check the last two added
		const lastEntry = JSON.parse(lines[lines.length - 1] || "");
		const secondLastEntry = JSON.parse(lines[lines.length - 2] || "");

		expect(secondLastEntry.eventType).toBe("event.one");
		expect(lastEntry.eventType).toBe("event.two");
	});

	describe("Environment Variable Overrides", () => {
		const customDir = "custom_logs";
		const customFile = "custom.log";
		const customDirPath = join(TEST_ROOT, customDir);

		afterAll(() => {
			if (existsSync(customDirPath)) {
				rmSync(customDirPath, { recursive: true, force: true });
			}
			// Cleanup absolute path test if needed (careful with actual absolute paths in tests)
			// Using a safe temporary absolute path would be better, but for now we'll stick to relative overrides that resolve to absolute.
			delete process.env["OPENCODE_LOGGER_DIR"];
			delete process.env["OPENCODE_LOGGER_FILENAME"];
		});

		it("should use OPENCODE_LOGGER_DIR and OPENCODE_LOGGER_FILENAME when set", async () => {
			process.env["OPENCODE_LOGGER_DIR"] = customDir;
			process.env["OPENCODE_LOGGER_FILENAME"] = customFile;

			const logger = new FileLogger(TEST_ROOT);
			await logger.init();

			const expectedPath = join(customDirPath, customFile);
			expect(existsSync(customDirPath)).toBe(true);
			// We haven't logged anything yet, so file might not exist, but dir should.
			// Let's log something to verify file creation at correct path.
			await logger.log("custom.event", {});
			expect(existsSync(expectedPath)).toBe(true);
		});
	});
});
