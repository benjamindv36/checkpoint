# Serena MCP server — setup and run

This project includes a project-scoped `.mcp.json` that configures Claude Code (and other MCP clients)
to connect to a Serena MCP server running on `http://localhost:9121/mcp`.

Quick overview
- Install `uv` (Astral `uv`) so that `uvx` is available. See options below.
- Start the Serena MCP server using the included PowerShell helper `scripts/start-serena-mcp.ps1`.
- In Claude Code, add the MCP server if needed, or rely on the project `.mcp.json` so team members have the server available.

Windows (recommended)

1) Install `uv` (choose one):

PowerShell (winget):
```
winget install --id=astral-sh.uv -e
```

Fallback via pipx (if you have pipx installed):
```
pipx install uv
```

If `pipx` is not installed, see https://pipxproject.github.io/pipx/ for installation.

2) Start Serena MCP server (PowerShell):
```
.\n+scripts\start-serena-mcp.ps1
```

This launches Serena using `uvx` and starts the MCP server in streamable HTTP mode on `http://localhost:9121/mcp`.

Alternative: run Serena with Docker (experimental):

```
docker run --rm -i --network host -v C:\path\to\projects:/workspaces/projects ghcr.io/oraios/serena:latest serena start-mcp-server --transport streamable-http --port 9121
```


Add the MCP server to Claude Code (optional — project `.mcp.json` may be sufficient):

```
claude mcp add --transport http serena --scope project http://localhost:9121/mcp
```

Enable Claude to spawn Serena on startup (stdio)

If you want Claude Code to launch Serena automatically (so Claude spawns the MCP server when it is needed), add a project-scoped stdio entry to `.mcp.json`. On Windows, stdio servers must be wrapped with `cmd /c` so `npx` and shell commands execute correctly. The repository already includes a `serena-stdio` entry in `.mcp.json` with the following form:

```
{
	"mcpServers": {
		"serena-stdio": {
			"command": "cmd",
			"args": ["/c", "uvx --from git+https://github.com/oraios/serena serena start-mcp-server"],
			"env": {}
		}
	}
}
```

How this works:
- When Claude Code is configured to use the project-scoped MCP servers it will see `serena-stdio` and will launch the configured command. Claude will communicate with the process over stdio.
- Make sure you do not have a conflicting Serena instance already running on the same project (stop the HTTP server started earlier if you want Claude to manage the process).

To add the stdio server via the `claude` CLI instead of editing `.mcp.json` manually, use `claude mcp add-json` (note that JSON must be properly escaped in PowerShell). Example (PowerShell):

```
claude mcp add-json serena-stdio '{"command":"cmd","args":["/c","uvx --from git+https://github.com/oraios/serena serena start-mcp-server"],"env":{}}' --scope project
```

Important notes:
- If Claude fails to start the stdio process, check that `uvx` is on the PATH in the environment where Claude runs and that any antivirus or Windows policy is not blocking process spawn.
- If you'd rather have more isolation, use the HTTP entry (`serena`) and let Claude connect to `http://localhost:9121/mcp` instead.

Notes and recommendations
- Using `streamable-http` avoids the Windows-specific `cmd /c` wrapper required for stdio `npx` servers.
- If you prefer stdio mode (Claude launches the process), use the `start-mcp-server` default (no `--transport`) and follow Claude's Windows `cmd /c` guidance.
- If you run the server manually, make sure it's reachable at the URL in `.mcp.json` before launching Claude Code.
- Be cautious when connecting third-party MCP servers — make sure you trust the server.

References
- Claude MCP docs: https://code.claude.com/docs/en/mcp
- uv install: https://docs.astral.sh/uv/getting-started/installation/
- Serena docs: https://oraios.github.io/serena/02-usage/
