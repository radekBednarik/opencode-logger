import type { Plugin } from "@opencode-ai/plugin";

export const loggerPlugin: Plugin = async () => {
	console.log("Plugin initialized!");

	return {
		event: async ({ event }) => {
			if (event.type === "session.created") {
				console.log("INFO: Session created.");
			}
		},
	};
};
