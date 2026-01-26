import type { Plugin, Hooks } from "@opencode-ai/plugin";
import { SUPPORTED_EVENTS, type SupportedEvent } from "./constants.js";
import { FileLogger } from "./file-logger.js";

/**
 * The main Opencode Logger plugin entry point.
 * Initializes the file logger and registers hooks for supported events.
 *
 * @param ctx - The plugin context provided by Opencode, containing project details.
 * @returns A promise that resolves to the plugin hooks configuration.
 */
export const loggerPlugin: Plugin = async (ctx) => {
	const logger = new FileLogger(ctx.directory, ctx);
	await logger.init();

	console.log("[Opencode Logger] Plugin initialized!");

	const hooks: Hooks = {
		event: async ({ event }) => {
			if (SUPPORTED_EVENTS.includes(event.type as SupportedEvent)) {
				await logger.log(event.type, event);
			}
		},
	};

	return hooks;
};
