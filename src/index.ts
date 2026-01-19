import type { Plugin, Hooks } from "@opencode-ai/plugin";
import { SUPPORTED_EVENTS, type SupportedEvent } from "./constants.js";
import { FileLogger } from "./file-logger.js";

export const loggerPlugin: Plugin = async (ctx) => {
	// ctx.directory is the project root in the context of the running plugin usually,
	// but let's be safe and check if we need to resolve it.
	// Based on the docs: directory: The current working directory.
	const logger = new FileLogger(ctx.directory);
	await logger.init();

	console.log("Opencode Logger Plugin initialized!");

	const hooks: Hooks = {
		event: async ({ event }) => {
			if (SUPPORTED_EVENTS.includes(event.type as SupportedEvent)) {
				await logger.log(event.type, event);
			}
		},
		"tool.execute.before": async (input, output) => {
			await logger.log("tool.execute.before", { input, output });
		},
		"tool.execute.after": async (input, output) => {
			await logger.log("tool.execute.after", { input, output });
		},
	};

	return hooks;
};
