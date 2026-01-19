export const LOG_DIRECTORY = "logs/opencode";
export const LOG_FILENAME = "events.jsonl";

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
	"permission.replied",
	"permission.updated",
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

export type SupportedEvent = (typeof SUPPORTED_EVENTS)[number];
