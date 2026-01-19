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


