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
	// Command Events
	"command.executed",
	// Experimental Events
	"experimental.session.compacting",
	// File Events
	"file.edited",
	"file.watcher.updated",
	// Installation Events
	"installation.updated",
	// LSP Events
	"lsp.client.diagnostics",
	"lsp.updated",
	// Message Events
	"message.part.removed",
	"message.part.updated",
	"message.removed",
	"message.updated",
	// Permission Events
	"permission.asked",
	"permission.replied",
	// Server Events
	"server.connected",
	// Session Events
	"session.compacted",
	"session.created",
	"session.deleted",
	"session.diff",
	"session.error",
	"session.idle",
	"session.status",
	"session.updated",
	// Shell Events
	"shell.env",
	// Todo Events
	"todo.updated",
	// Tool Events
	"tool.execute.after",
	"tool.execute.before",
	// TUI Events
	"tui.command.execute",
	"tui.prompt.append",
	"tui.toast.show",
] as const;

/**
 * Type definition derived from the supported events constant.
 */
export type SupportedEvent = (typeof SUPPORTED_EVENTS)[number];
