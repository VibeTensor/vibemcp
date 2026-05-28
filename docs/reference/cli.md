# CLI Reference

VibeMCP includes a CLI for account management and server operations.

## Usage

```bash
npx vibemcp [command] [options]
```

## Commands

### Default (No Command)

Starts the MCP server on stdio transport. This is what MCP clients use:

```bash
npx vibemcp
```

### `serve`

Explicit alias for starting the MCP server:

```bash
npx vibemcp serve
```

### `auth`

Authenticate with a provider.

```bash
# Google OAuth (opens browser)
npx vibemcp auth google your@gmail.com

# Microsoft Device Code (prints code + URL)
npx vibemcp auth microsoft your@outlook.com
```

**Google flow:**
1. Opens browser to Google OAuth consent screen
2. Starts a local callback server on `http://localhost:4100/code`
3. After you grant access, captures the auth code and stores tokens in `~/.vibemcp/`

**Microsoft flow:**
1. Prints a device code and URL (`microsoft.com/devicelogin`)
2. You enter the code in your browser and sign in
3. Polls for completion and stores tokens in `~/.vibemcp/`

### `accounts`

Manage connected accounts.

```bash
# List all connected accounts
npx vibemcp accounts list

# Remove an account
npx vibemcp accounts remove your@gmail.com
```

### `help`

Show usage information:

```bash
npx vibemcp help
```

### `version`

Show the installed version:

```bash
npx vibemcp version
```

## Environment Variables

The CLI loads environment variables in this order:

1. **Pre-set env vars** (from shell or MCP client config)
2. **`.env` in current working directory** (for local development)
3. **`~/.vibemcp/.env`** (persistent config)

| Variable | Required For | Description |
|:---------|:-------------|:------------|
| `GOOGLE_CLIENT_ID` | Google auth | OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | Google auth | OAuth 2.0 Client Secret |
| `MICROSOFT_CLIENT_ID` | Microsoft auth | Azure App Registration Client ID |
| `MICROSOFT_TENANT_ID` | Microsoft auth | Azure tenant (default: `common`) |
| `VIBEMCP_CONFIG_DIR` | - | Override config directory (default: `~/.vibemcp/`) |

## Token Storage

All OAuth tokens and account data are stored in `~/.vibemcp/`:

```
~/.vibemcp/
├── accounts.json                    # Account registry
├── .oauth2.user@gmail.com.json      # Google OAuth tokens
├── .oauth2.work@company.com.json    # Google OAuth tokens (second account)
├── ms-token-cache.json              # Microsoft MSAL token cache
└── .env                             # (Optional) persistent env config
```

These files contain sensitive credentials. They are stored in your home directory and isolated from any project.
