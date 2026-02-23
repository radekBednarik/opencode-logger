import {
	afterAll,
	afterEach,
	beforeAll,
	describe,
	expect,
	it,
	mock,
} from "bun:test";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { PluginInput } from "@opencode-ai/plugin";
import {
	DEFAULT_LOG_DIRECTORY,
	DEFAULT_LOG_FILENAME,
} from "../src/constants.js";
import { FileLogger } from "../src/file-logger.js";

const TEST_ROOT = process.cwd(); // In test environment, this will use CWD
const LOG_DIR_PATH = join(TEST_ROOT, DEFAULT_LOG_DIRECTORY);
const LOG_FILE_PATH = join(LOG_DIR_PATH, DEFAULT_LOG_FILENAME);

const mockPluginInput = {
	client: {
		app: {
			log: mock(() => Promise.resolve()),
		},
	},
} as unknown as PluginInput;

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
		const logger = new FileLogger(TEST_ROOT, mockPluginInput);
		await logger.init();

		expect(existsSync(LOG_DIR_PATH)).toBe(true);
	});

	it("should log events to the file in JSONL format", async () => {
		const logger = new FileLogger(TEST_ROOT, mockPluginInput);
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
		const logger = new FileLogger(TEST_ROOT, mockPluginInput);
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

			const logger = new FileLogger(TEST_ROOT, mockPluginInput);
			await logger.init();

			const expectedPath = join(customDirPath, customFile);
			expect(existsSync(customDirPath)).toBe(true);
			// We haven't logged anything yet, so file might not exist, but dir should.
			// Let's log something to verify file creation at correct path.
			await logger.log("custom.event", {});
			expect(existsSync(expectedPath)).toBe(true);
		});
	});

	describe("Log rotation", () => {
		const ROTATION_DIR = join(TEST_ROOT, "logs/rotation-tests");

		beforeAll(() => {
			if (existsSync(ROTATION_DIR)) {
				rmSync(ROTATION_DIR, { recursive: true, force: true });
			}
		});

		afterAll(() => {
			if (existsSync(ROTATION_DIR)) {
				rmSync(ROTATION_DIR, { recursive: true, force: true });
			}
		});

		afterEach(() => {
			delete process.env["OPENCODE_LOGGER_DIR"];
			delete process.env["OPENCODE_LOGGER_FILENAME"];
			delete process.env["OPENCODE_LOGGER_MAX_FILE_SIZE"];
			delete process.env["OPENCODE_LOGGER_MAX_FILES"];
		});

		function makeLogger(subDir: string): FileLogger {
			process.env["OPENCODE_LOGGER_DIR"] = join(ROTATION_DIR, subDir);
			return new FileLogger(TEST_ROOT, mockPluginInput);
		}

		it("should not rotate when file size is below the limit", async () => {
			const logger = makeLogger("no-rotate");
			process.env["OPENCODE_LOGGER_MAX_FILE_SIZE"] = "10000";
			await logger.init();

			await logger.log("test.event", { data: "small" });

			const dir = join(ROTATION_DIR, "no-rotate");
			const files = await readdir(dir);
			// Only the active log file should exist
			expect(files.length).toBe(1);
			expect(files[0]).toBe(DEFAULT_LOG_FILENAME);
		});

		it("should rotate when file size meets or exceeds the limit", async () => {
			const dir = join(ROTATION_DIR, "rotate-basic");
			process.env["OPENCODE_LOGGER_DIR"] = dir;
			// Set a very small limit so the first write triggers rotation on the second
			process.env["OPENCODE_LOGGER_MAX_FILE_SIZE"] = "1";

			const logger = new FileLogger(TEST_ROOT, mockPluginInput);
			await logger.init();

			// First write creates the file
			await logger.log("first.event", { seq: 1 });
			// Second write should detect size >= 1 byte and rotate
			await logger.log("second.event", { seq: 2 });

			const files = (await readdir(dir)).sort();
			// Expect 2 files: the rotated archive and the new active log
			expect(files.length).toBe(2);

			const activeFile = files.find((f) => f === DEFAULT_LOG_FILENAME);
			const rotatedFile = files.find((f) => f !== DEFAULT_LOG_FILENAME);

			expect(activeFile).toBeDefined();
			expect(rotatedFile).toBeDefined();

			// Rotated file name matches pattern: log.<timestamp>-<shortId>.jsonl
			expect(rotatedFile).toMatch(
				/^log\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-[0-9a-f]{8}\.jsonl$/,
			);
		});

		it("should preserve content from previous active file in the rotated archive", async () => {
			const dir = join(ROTATION_DIR, "rotate-content");
			process.env["OPENCODE_LOGGER_DIR"] = dir;
			process.env["OPENCODE_LOGGER_MAX_FILE_SIZE"] = "1";

			const logger = new FileLogger(TEST_ROOT, mockPluginInput);
			await logger.init();

			await logger.log("first.event", { seq: 1 });
			await logger.log("second.event", { seq: 2 });

			const files = (await readdir(dir)).sort();
			const rotatedFile = files.find((f) => f !== DEFAULT_LOG_FILENAME);
			const rotatedContent = readFileSync(
				join(dir, rotatedFile ?? ""),
				"utf-8",
			);
			const rotatedLines = rotatedContent.trim().split("\n");

			// The rotated file should contain the first event
			const firstEntry = JSON.parse(rotatedLines[0] || "");
			expect(firstEntry.eventType).toBe("first.event");

			// The active file should contain the second event
			const activeContent = readFileSync(
				join(dir, DEFAULT_LOG_FILENAME),
				"utf-8",
			);
			const activeLines = activeContent.trim().split("\n");
			const secondEntry = JSON.parse(activeLines[0] || "");
			expect(secondEntry.eventType).toBe("second.event");
		});

		it("should disable rotation when OPENCODE_LOGGER_MAX_FILE_SIZE is 0", async () => {
			const dir = join(ROTATION_DIR, "rotate-disabled");
			process.env["OPENCODE_LOGGER_DIR"] = dir;
			process.env["OPENCODE_LOGGER_MAX_FILE_SIZE"] = "0";

			const logger = new FileLogger(TEST_ROOT, mockPluginInput);
			await logger.init();

			// Write many events — no rotation should occur regardless of size
			for (let i = 0; i < 10; i++) {
				await logger.log("event.loop", { seq: i });
			}

			const files = await readdir(dir);
			expect(files.length).toBe(1);
			expect(files[0]).toBe(DEFAULT_LOG_FILENAME);
		});

		it("should fall back to default when OPENCODE_LOGGER_MAX_FILE_SIZE is non-numeric", async () => {
			const dir = join(ROTATION_DIR, "rotate-invalid-env");
			process.env["OPENCODE_LOGGER_DIR"] = dir;
			process.env["OPENCODE_LOGGER_MAX_FILE_SIZE"] = "not-a-number";

			// This should not throw — just fall back silently to the default (100 MB)
			const logger = new FileLogger(TEST_ROOT, mockPluginInput);
			await logger.init();
			await logger.log("safe.event", {});

			// With 100 MB default, a tiny write should never trigger rotation
			const files = await readdir(dir);
			expect(files.length).toBe(1);
		});

		it("should not throw when log file does not exist yet during rotation check", async () => {
			const dir = join(ROTATION_DIR, "rotate-no-file");
			process.env["OPENCODE_LOGGER_DIR"] = dir;
			process.env["OPENCODE_LOGGER_MAX_FILE_SIZE"] = "1";

			const logger = new FileLogger(TEST_ROOT, mockPluginInput);
			await logger.init();

			// No file exists yet — checkAndRotate must handle ENOENT gracefully
			await expect(logger.log("first.event", {})).resolves.toBeUndefined();
		});

		describe("Concurrency safety", () => {
			it("should not double-rotate or lose entries when log() is called concurrently", async () => {
				const dir = join(ROTATION_DIR, "rotate-concurrent");
				process.env["OPENCODE_LOGGER_DIR"] = dir;
				// Tiny limit so every non-empty file triggers rotation on the next write
				process.env["OPENCODE_LOGGER_MAX_FILE_SIZE"] = "1";
				// Keep all rotated files so we can count them exactly
				process.env["OPENCODE_LOGGER_MAX_FILES"] = "0";

				const logger = new FileLogger(TEST_ROOT, mockPluginInput);
				await logger.init();

				const N = 8;
				// Fire all log() calls simultaneously — without the mutex this would
				// cause multiple callers to pass the size check and race on rename().
				await Promise.all(
					Array.from({ length: N }, (_, i) =>
						logger.log("concurrent.event", { seq: i }),
					),
				);

				const files = await readdir(dir);
				const rotatedFiles = files.filter((f) => f !== DEFAULT_LOG_FILENAME);

				// Collect every log entry across all files
				const allEntries: { eventType: string; payload: { seq: number } }[] =
					[];
				for (const filename of files) {
					const content = readFileSync(join(dir, filename), "utf-8");
					for (const line of content.trim().split("\n")) {
						if (line) allEntries.push(JSON.parse(line));
					}
				}

				// Every entry must be present exactly once — no loss, no duplication
				expect(allEntries.length).toBe(N);
				const seqs = allEntries.map((e) => e.payload.seq).sort((a, b) => a - b);
				expect(seqs).toEqual(Array.from({ length: N }, (_, i) => i));

				// With N=8 writes and a 1-byte limit the first write creates the file;
				// each subsequent write rotates, giving N-1 = 7 rotated archives.
				// The mutex guarantees exactly one rotation per oversized file —
				// no two callers should ever race-rename the same file.
				expect(rotatedFiles.length).toBe(N - 1);
			});
		});

		describe("OPENCODE_LOGGER_MAX_FILES pruning", () => {
			it("should prune oldest rotated files when maxFiles limit is exceeded", async () => {
				const dir = join(ROTATION_DIR, "rotate-prune");
				process.env["OPENCODE_LOGGER_DIR"] = dir;
				// Rotate on every write (1-byte limit)
				process.env["OPENCODE_LOGGER_MAX_FILE_SIZE"] = "1";
				// Keep at most 2 rotated files
				process.env["OPENCODE_LOGGER_MAX_FILES"] = "2";

				const logger = new FileLogger(TEST_ROOT, mockPluginInput);
				await logger.init();

				// Write 5 events — this will create 4 rotated files (rotation happens before each write after the first)
				// Write 1: creates log.jsonl (no rotation — file doesn't exist yet)
				// Write 2: rotates log.jsonl → archive1, creates new log.jsonl, prunes if needed
				// Write 3: rotates → archive2, prunes if needed
				// Write 4: rotates → archive3, prunes (archive1 deleted, keep archive2+archive3)
				// Write 5: rotates → archive4, prunes (archive2 deleted, keep archive3+archive4)
				for (let i = 0; i < 5; i++) {
					await logger.log("prune.event", { seq: i });
					// Small delay to ensure distinct timestamps in filenames
					await Bun.sleep(10);
				}

				const files = await readdir(dir);
				const rotatedFiles = files.filter((f) => f !== DEFAULT_LOG_FILENAME);

				// Should have at most maxFiles rotated archives
				expect(rotatedFiles.length).toBeLessThanOrEqual(2);
				// Active file must still exist
				expect(files.includes(DEFAULT_LOG_FILENAME)).toBe(true);
			});

			it("should keep all rotated files when OPENCODE_LOGGER_MAX_FILES is 0 (unlimited)", async () => {
				const dir = join(ROTATION_DIR, "rotate-unlimited");
				process.env["OPENCODE_LOGGER_DIR"] = dir;
				process.env["OPENCODE_LOGGER_MAX_FILE_SIZE"] = "1";
				process.env["OPENCODE_LOGGER_MAX_FILES"] = "0";

				const logger = new FileLogger(TEST_ROOT, mockPluginInput);
				await logger.init();

				for (let i = 0; i < 4; i++) {
					await logger.log("unlimited.event", { seq: i });
					await Bun.sleep(10);
				}

				const files = await readdir(dir);
				const rotatedFiles = files.filter((f) => f !== DEFAULT_LOG_FILENAME);

				// 4 writes: first creates file, next 3 each rotate once → 3 rotated files
				expect(rotatedFiles.length).toBe(3);
			});
		});
	});
});
