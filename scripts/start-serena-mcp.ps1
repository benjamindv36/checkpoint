<#
PowerShell helper to run Serena MCP server (streamable HTTP transport)

Requirements:
- `uv` (uvx) installed and available on PATH. See `SERENA_SETUP.md` for install options.

Usage:
  PowerShell> .\scripts\start-serena-mcp.ps1

This starts Serena's MCP server on localhost:9121 and exposes an HTTP /mcp endpoint
which Claude Code can connect to (project-scoped `.mcp.json` is provided).
#>

param(
    [int]$Port = 9121
)

Write-Host "Starting Serena MCP server on port $Port..."

# Use uvx to run Serena directly from GitHub. If you installed serena locally, replace uvx call.
uvx --from git+https://github.com/oraios/serena serena start-mcp-server --transport streamable-http --port $Port
