/**
 * Directory where logs will be stored relative to the project root.
 */
export const DEFAULT_LOG_DIRECTORY = "logs/opencode";

/**
 * Filename for the log file.
 */
export const DEFAULT_LOG_FILENAME = "log.jsonl";

/**
 * List of event types supported by the logger plugin.
 * These events correspond to various lifecycle hooks and actions within the Opencode environment.
 */
export const SUPPORTED_EVENTS = [
	"command.executed",
	"file.edited",
	"file.watcher.updated",
	"installation.updated",
	"lsp.client.diagnostics",
	"lsp.updated",
	"message.part.removed",
	"message.part.updated",
	"message.removed",
	"message.updated",
	"permission.asked",
	"permission.replied",
	"server.connected",
	"session.created",
	"session.compacted",
	"session.deleted",
	"session.diff",
	"session.error",
	"session.idle",
	"session.status",
	"session.updated",
	"todo.updated",
	"tool.execute.after",
	"tool.execute.before",
	"tui.prompt.append",
	"tui.command.execute",
	"tui.toast.show",
] as const;

/**
 * Type definition derived from the supported events constant.
 */
export type SupportedEvent = (typeof SUPPORTED_EVENTS)[number];
