import {
	appendFile,
	mkdir,
	readdir,
	rename,
	stat,
	unlink,
} from "node:fs/promises";
import { basename, extname, isAbsolute, join, resolve } from "node:path";
import type { PluginInput } from "@opencode-ai/plugin";
import {
	DEFAULT_LOG_DIRECTORY,
	DEFAULT_LOG_FILENAME,
	DEFAULT_MAX_FILE_SIZE,
	DEFAULT_MAX_FILES,
} from "./constants.js";

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
 * Supports automatic log file rotation when the active file exceeds a configurable size.
 */
export class FileLogger {
	private logDir: string;
	private baseFilename: string;
	private logFilePath: string;
	private maxFileSize: number;
	private maxFiles: number;
	private pluginInput: PluginInput;

	/**
	 * Creates a new instance of FileLogger.
	 * @param projectRoot - The absolute path to the root of the project.
	 * @param pluginInput - Opencode plugin input
	 */
	constructor(projectRoot: string, pluginInput: PluginInput) {
		this.logDir = this.resolveLogDirectory(projectRoot);
		this.baseFilename = this.getLogFilename();
		this.logFilePath = join(this.logDir, this.baseFilename);
		this.pluginInput = pluginInput;
		this.maxFileSize = this.parseEnvInt(
			"OPENCODE_LOGGER_MAX_FILE_SIZE",
			DEFAULT_MAX_FILE_SIZE,
		);
		this.maxFiles = this.parseEnvInt(
			"OPENCODE_LOGGER_MAX_FILES",
			DEFAULT_MAX_FILES,
		);
	}

	private resolveLogDirectory(projectRoot: string): string {
		const logDir =
			process.env["OPENCODE_LOGGER_DIR"] ||
			join(projectRoot, DEFAULT_LOG_DIRECTORY);

		// If logDir is absolute, use it directly. Otherwise, resolve it relative to projectRoot
		// Note: The default join(projectRoot, DEFAULT_LOG_DIRECTORY) above already handles the relative default case,
		// but we check isAbsolute here specifically for the ENV var case if the user passed a relative path.
		return isAbsolute(logDir) ? logDir : resolve(projectRoot, logDir);
	}

	private getLogFilename(): string {
		return process.env["OPENCODE_LOGGER_FILENAME"] || DEFAULT_LOG_FILENAME;
	}

	private parseEnvInt(varName: string, defaultValue: number): number {
		const raw = process.env[varName];
		if (raw === undefined || raw === "") return defaultValue;
		const parsed = Number.parseInt(raw, 10);
		return Number.isNaN(parsed) ? defaultValue : parsed;
	}

	/**
	 * Initializes the logger by ensuring the log directory exists.
	 * This method must be called before attempting to log any events.
	 */
	async init() {
		try {
			await mkdir(this.logDir, { recursive: true });
		} catch (error) {
			console.error(`[Opencode-logger]: Failed to initialize.\n${error}`);
		}
	}

	/**
	 * Logs an event and its payload to the log file in JSONL format.
	 * Automatically rotates the file if the configured maximum size has been reached.
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
			await this.checkAndRotate();
			await appendFile(this.logFilePath, line, "utf-8");
		} catch (error) {
			await this.pluginInput.client.app.log({
				body: {
					service: "opencode-logger",
					level: "error",
					message: "Failed to write to log file.",
					extra: {
						error,
					},
				},
			});
		}
	}

	/**
	 * Checks whether the active log file has exceeded the maximum size and, if so, rotates it.
	 * If maxFileSize is 0, rotation is disabled.
	 */
	private async checkAndRotate(): Promise<void> {
		if (this.maxFileSize === 0) return;

		let fileSize: number;
		try {
			const fileStat = await stat(this.logFilePath);
			fileSize = fileStat.size;
		} catch {
			// File does not exist yet — no rotation needed
			return;
		}

		if (fileSize >= this.maxFileSize) {
			await this.rotate();
		}
	}

	/**
	 * Renames the active log file to a timestamped archive name and resets the active path.
	 * Prunes oldest rotated files if maxFiles is configured.
	 */
	private async rotate(): Promise<void> {
		const ext = extname(this.baseFilename);
		const base = basename(this.baseFilename, ext);
		const timestamp = new Date()
			.toISOString()
			.replace(/:/g, "-")
			.replace(/\..+$/, "");
		const shortId = crypto.randomUUID().slice(0, 8);
		const rotatedFilename = `${base}.${timestamp}-${shortId}${ext}`;
		const rotatedFilePath = join(this.logDir, rotatedFilename);

		try {
			await rename(this.logFilePath, rotatedFilePath);
		} catch (error) {
			await this.pluginInput.client.app.log({
				body: {
					service: "opencode-logger",
					level: "error",
					message: "Failed to rotate log file.",
					extra: { error },
				},
			});
			return;
		}

		// logFilePath stays pointing to the base filename — next appendFile will create a fresh file
		if (this.maxFiles > 0) {
			await this.pruneOldFiles();
		}
	}

	/**
	 * Deletes the oldest rotated log files when the number of archived files exceeds maxFiles.
	 */
	private async pruneOldFiles(): Promise<void> {
		const ext = extname(this.baseFilename);
		const base = basename(this.baseFilename, ext);
		// Rotated files match: <base>.<timestamp>-<shortId><ext>
		const rotationPattern = new RegExp(
			`^${escapeRegExp(base)}\\..+${escapeRegExp(ext)}$`,
		);

		let entries: string[];
		try {
			entries = await readdir(this.logDir);
		} catch {
			return;
		}

		const rotatedFiles = entries
			.filter((name) => rotationPattern.test(name))
			.sort(); // ISO timestamp prefix sorts lexicographically = chronologically

		const excess = rotatedFiles.length - this.maxFiles;
		if (excess <= 0) return;

		const toDelete = rotatedFiles.slice(0, excess);
		for (const filename of toDelete) {
			try {
				await unlink(join(this.logDir, filename));
			} catch {
				// Best-effort: ignore individual deletion failures
			}
		}
	}
}

function escapeRegExp(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
