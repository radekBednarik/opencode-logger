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
  "plugin": ["opencode-logger"]
}
```

## Configuration

You can customize the log directory and filename using environment variables.

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENCODE_LOGGER_DIR` | The directory where logs are stored. Can be absolute or relative to project root. | `logs/opencode` |
| `OPENCODE_LOGGER_FILENAME` | The filename for the log file. | `log.jsonl` |

### Setting via `opencode.json`

You can define these variables directly in your project's configuration file:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-logger"],
  "env": {
    "OPENCODE_LOGGER_DIR": ".logs",
    "OPENCODE_LOGGER_FILENAME": "dev-session.jsonl"
  }
}
```

### Setting via CLI

Alternatively, you can set them when starting the Opencode client:

```bash
OPENCODE_LOGGER_DIR=/tmp/my-logs opencode
```



