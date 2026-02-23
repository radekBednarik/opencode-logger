# opencode-logger

This small package is intended to be used as [Opencode](https://opencode.ai) plugin.

See [plugins documentation](https://opencode.ai/docs/plugins/).

This plugin handles logging of all supported [events](https://opencode.ai/docs/plugins/#events).

Events are logged as [jsonl](https://jsonlines.org/) to the

```bash
<project-root>/logs/opencode/log.jsonl
```

## Usage

In your project open (or set) your `opencode.json` or `opencode.jsonc` file
and add:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-logger"],
}
```

## Configuration

You can customize the log directory, filename, and logging scope using environment variables.

| Variable                        | Description                                                                               | Default              |
| ------------------------------- | ----------------------------------------------------------------------------------------- | -------------------- |
| `OPENCODE_LOGGER_DIR`           | The directory where logs are stored. Can be absolute or relative to project root.         | `logs/opencode`      |
| `OPENCODE_LOGGER_FILENAME`      | The filename for the log file.                                                            | `log.jsonl`          |
| `OPENCODE_LOGGER_SCOPE`         | Comma-separated list of event types to log. Supports wildcards (e.g., `session.*`).       | `*` (Log all events) |
| `OPENCODE_LOGGER_MAX_FILE_SIZE` | Maximum log file size in bytes before automatic rotation. Set to `0` to disable rotation. | `104857600` (100 MB) |
| `OPENCODE_LOGGER_MAX_FILES`     | Maximum number of rotated log files to keep. Set to `0` to keep all.                      | `0` (unlimited)      |

### Setting via CLI

You can set them when starting the Opencode client:

```bash
OPENCODE_LOGGER_DIR=/tmp/my-logs opencode
```

### Setting by exporting ENV variables

Or export them, for example in your `~/.bashrc`

```bash
export OPENCODE_LOGGER_DIR=/tmp/my-logs
export OPENCODE_LOGGER_FILENAME=custom-name.jsonl
```

### Logging Scope

You can filter which events are logged using the `OPENCODE_LOGGER_SCOPE` environment variable.
It accepts a comma-separated string of event types or patterns.

- `*` (Default): Logs all events.
- `session.*`: Logs all events starting with `session.` (e.g., `session.created`, `session.updated`).
- `command.executed,file.edited`: Logs only these specific events.

**Example:**

```bash
export OPENCODE_LOGGER_SCOPE="session.*,command.executed"
```

### Log Rotation

You can control when log files are rotated and how many archived files are retained.

- `OPENCODE_LOGGER_MAX_FILE_SIZE`: Once the active log file reaches this size (in bytes), it is rotated. Set to `0` to disable rotation entirely.
- `OPENCODE_LOGGER_MAX_FILES`: After rotation, only this many archived files are kept (oldest deleted first). Set to `0` to keep all rotated files indefinitely.

**Example:**

```bash
# Rotate at 10 MB, keep last 5 archived files
export OPENCODE_LOGGER_MAX_FILE_SIZE=10485760
export OPENCODE_LOGGER_MAX_FILES=5
```
