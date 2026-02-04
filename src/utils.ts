/**
 * Determines if a specific event type should be logged based on the configured scope.
 *
 * The scope is a comma-separated string that can contain:
 * 1. "*" to allow all events.
 * 2. Specific event names (e.g., "session.created").
 * 3. Group wildcards ending in ".*" (e.g., "session.*").
 *
 * @param eventType - The type of the event to check.
 * @param scope - The configuration string defining allowed events.
 * @returns True if the event should be logged, false otherwise.
 */
export function shouldLogEvent(eventType: string, scope?: string): boolean {
	if (!scope || scope === "*" || scope.trim() === "") {
		return true;
	}

	const allowedPatterns = scope.split(",").map((s) => s.trim());

	for (const pattern of allowedPatterns) {
		if (pattern === "*") {
			return true;
		}

		// Check for wildcard group (e.g., "session.*")
		if (pattern.endsWith(".*")) {
			const prefix = pattern.slice(0, -2);
			if (eventType.startsWith(`${prefix}.`)) {
				return true;
			}
		}

		if (pattern === eventType) {
			return true;
		}
	}

	return false;
}
