# VibeMCP Examples

## Claude Desktop / Claude Code Configuration

Copy `claude-desktop-config.json` to your Claude Desktop configuration:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

Fill in your OAuth credentials. VibeMCP stores tokens in `~/.vibemcp/`.

## Setup Steps

1. Add VibeMCP to your Claude Desktop config (see above) and restart Claude.

2. Through your AI assistant, authenticate your accounts:
   ```
   > Add my Google account user@gmail.com
   > Add my Microsoft account user@outlook.com
   ```

3. Start using it:
   ```
   > Show my latest emails
   > Search for emails from john@example.com
   > Send an email to jane@company.com about the meeting tomorrow
   > Show my calendar events for this week
   > Create a meeting with the team on Friday at 2pm
   ```

## Alternative: CLI Authentication

If you prefer to authenticate before using Claude Desktop:

```bash
npx @vibetensor/vibemcp auth google user@gmail.com       # Opens browser
npx @vibetensor/vibemcp auth microsoft user@outlook.com   # Device code flow
npx @vibetensor/vibemcp accounts list                     # Verify accounts
```

## Environment Variables

Credentials can be provided via:

1. **MCP client env** (recommended) — set in Claude Desktop config JSON
2. **`.env` file** in your current working directory
3. **`~/.vibemcp/.env`** — persistent config location

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_CLIENT_ID` | For Gmail | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | For Gmail | Google OAuth Client Secret |
| `MICROSOFT_CLIENT_ID` | For Outlook | Azure App Registration Client ID |
| `MICROSOFT_TENANT_ID` | For Outlook | Azure Tenant ID (default: `common`) |
| `VIBEMCP_OUTPUT_FORMAT` | No | `toon` (default) or `json` |
| `VIBEMCP_CONFIG_DIR` | No | Override config dir (default: `~/.vibemcp/`) |
