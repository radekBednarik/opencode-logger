import { appendFile, mkdir } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import { DEFAULT_LOG_DIRECTORY, DEFAULT_LOG_FILENAME } from "./constants.js";

/**
 * Interface representing a single log entry in the log file.
 */
export interface LogEntry {
	/** ISO 8601 timestamp of when the event occurred. */
	timestamp: string;
	/** The type of event being logged (e.g., "session.created", "tool.execute.before"). */
	eventType: string;
	/** The data payload associated with the event. */
	payload: unknown;
}

/**
 * Handles initialization of the log directory and writing log entries to the file system.
 */
export class FileLogger {
	private logFilePath: string;

	/**
	 * Creates a new instance of FileLogger.
	 * @param projectRoot - The absolute path to the root of the project.
	 */
	constructor(projectRoot: string) {
		const logDir = this.resolveLogDirectory(projectRoot);
		const logFilename = this.getLogFilename();

		this.logFilePath = join(logDir, logFilename);
	}

	private resolveLogDirectory(projectRoot: string): string {
		const logDir =
			// biome-ignore lint/complexity/useLiteralKeys: process.env access
			process.env["OPENCODE_LOGGER_DIR"] ||
			join(projectRoot, DEFAULT_LOG_DIRECTORY);

		// If logDir is absolute, use it directly. Otherwise, resolve it relative to projectRoot
		// Note: The default join(projectRoot, DEFAULT_LOG_DIRECTORY) above already handles the relative default case,
		// but we check isAbsolute here specifically for the ENV var case if the user passed a relative path.
		return isAbsolute(logDir) ? logDir : resolve(projectRoot, logDir);
	}

	private getLogFilename(): string {
		// biome-ignore lint/complexity/useLiteralKeys: process.env access
		return process.env["OPENCODE_LOGGER_FILENAME"] || DEFAULT_LOG_FILENAME;
	}

	/**
	 * Initializes the logger by ensuring the log directory exists.
	 * This method should be called before attempting to log any events.
	 */
	async init() {
		try {
			const dirPath = join(this.logFilePath, "..");
			await mkdir(dirPath, { recursive: true });
		} catch (error) {
			console.error(
				`[Opencode Logger] Failed to create log directory: ${error}`,
			);
		}
	}

	/**
	 * Logs an event and its payload to the log file in JSONL format.
	 * @param eventType - The type of event to log.
	 * @param payload - The data associated with the event.
	 */
	async log(eventType: string, payload: unknown) {
		const entry: LogEntry = {
			timestamp: new Date().toISOString(),
			eventType,
			payload,
		};

		const line = `${JSON.stringify(entry)}\n`;

		try {
			await appendFile(this.logFilePath, line, "utf-8");
		} catch (error) {
			console.error(`[Opencode Logger] Failed to write to log file: ${error}`);
		}
	}
}
