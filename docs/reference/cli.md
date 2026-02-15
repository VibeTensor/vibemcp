# CLI Reference

VibeMCP includes a command-line interface for account management and server operations.

## Usage

```bash
npx @vibetensor/vibemcp <command> [options]
```

Or if installed from source:

```bash
npx tsx src/cli.ts <command> [options]
```

## Commands

### `auth`

Authenticate with a provider.

```bash
# Google OAuth (opens browser)
npx @vibetensor/vibemcp auth google your@gmail.com

# Microsoft Device Code (prints code + URL)
npx @vibetensor/vibemcp auth microsoft your@outlook.com
```

**Google flow:**
1. Opens browser to Google OAuth consent screen
2. Starts local server on `http://localhost:4100/code`
3. After consent, captures the auth code and stores tokens

**Microsoft flow:**
1. Prints a device code and URL (`microsoft.com/devicelogin`)
2. You enter the code in your browser
3. Polls for completion and stores tokens

### `accounts`

Manage connected accounts.

```bash
# List all connected accounts
npx @vibetensor/vibemcp accounts list

# Remove an account
npx @vibetensor/vibemcp accounts remove your@gmail.com
```

### Default (no command)

Starts the MCP server on stdio:

```bash
npx @vibetensor/vibemcp
```

This is the command used by MCP clients (Claude Code, Claude Desktop).

## Environment Variables

The CLI reads from `.env` in the current directory:

| Variable | Required For | Description |
|:---------|:-------------|:------------|
| `GOOGLE_CLIENT_ID` | Google auth | OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | Google auth | OAuth 2.0 Client Secret |
| `MICROSOFT_CLIENT_ID` | Microsoft auth | Azure App Registration Client ID |
| `MICROSOFT_TENANT_ID` | Microsoft auth | Azure tenant (default: `common`) |

## Token Storage

OAuth tokens are stored as JSON files in the working directory:

```
.oauth2.your@gmail.com.json        # Google tokens
.oauth2.your@outlook.com.json      # Microsoft tokens
accounts.json                       # Account registry
```

These files contain sensitive credentials and should be added to `.gitignore`.
