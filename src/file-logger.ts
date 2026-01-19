import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { LOG_DIRECTORY, LOG_FILENAME } from "./constants.js";

export interface LogEntry {
	timestamp: string;
	eventType: string;
	payload: unknown;
}

export class FileLogger {
	private logFilePath: string;

	constructor(projectRoot: string) {
		this.logFilePath = join(projectRoot, LOG_DIRECTORY, LOG_FILENAME);
	}

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
