import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { LOG_DIRECTORY, LOG_FILENAME } from "./constants.js";

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
		this.logFilePath = join(projectRoot, LOG_DIRECTORY, LOG_FILENAME);
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
