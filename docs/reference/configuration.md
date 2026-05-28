# Configuration

## Environment Variables

VibeMCP needs OAuth credentials to access Gmail and Microsoft APIs. There are three ways to provide them:

### Option 1: MCP Client Config (Recommended)

Pass credentials directly in your MCP client configuration. This is the simplest option with no files to manage.

```json
{
  "mcpServers": {
    "vibemcp": {
      "command": "npx",
      "args": ["-y", "vibemcp"],
      "env": {
        "GOOGLE_CLIENT_ID": "your-client-id.apps.googleusercontent.com",
        "GOOGLE_CLIENT_SECRET": "your-client-secret",
        "MICROSOFT_CLIENT_ID": "your-azure-client-id",
        "MICROSOFT_TENANT_ID": "common"
      }
    }
  }
}
```

### Option 2: `.env` File

Create a `.env` file in your working directory:

```sh
# Google OAuth 2.0 (for Gmail + Google Calendar)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Microsoft Azure (for Outlook + Outlook Calendar)
MICROSOFT_CLIENT_ID=your-application-client-id
MICROSOFT_TENANT_ID=common
```

### Option 3: Persistent `.env` in Config Dir

Place a `.env` file at `~/.vibemcp/.env`. This is loaded automatically when no `.env` exists in the working directory.

### Loading Order

VibeMCP checks for `.env` in this order:
1. **Current working directory** - `$PWD/.env`
2. **Config directory** - `~/.vibemcp/.env`
3. **Pre-set environment variables** - from MCP client `env` block

MCP client `env` block variables are always available regardless of `.env` file loading.

## All Environment Variables

| Variable | Required | Default | Description |
|:---------|:---------|:--------|:------------|
| `GOOGLE_CLIENT_ID` | For Gmail/Calendar | - | Google OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | For Gmail/Calendar | - | Google OAuth 2.0 Client Secret |
| `GOOGLE_OAUTH_PORT` | No | `4100` | Port for Google OAuth callback server |
| `MICROSOFT_CLIENT_ID` | For Outlook/Calendar | - | Azure App Registration Client ID |
| `MICROSOFT_TENANT_ID` | No | `common` | Azure tenant ID |
| `VIBEMCP_OUTPUT_FORMAT` | No | `toon` | Default output format: `toon` or `json` |
| `VIBEMCP_CONFIG_DIR` | No | `~/.vibemcp/` | Override config directory location |

## Google Cloud Setup

1. Go to [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials)
2. Create a new **OAuth 2.0 Client ID** (Application type: **Desktop**)
3. Add `http://localhost:4100/code` as an authorized redirect URI
4. Enable the **Gmail API**, **Google Calendar API**, and **People API** in [API Library](https://console.cloud.google.com/apis/library)
5. Copy the Client ID and Client Secret

### Google Scopes

VibeMCP requests these scopes during OAuth:

| Scope | Purpose |
|:------|:--------|
| `openid` | OpenID Connect identity |
| `userinfo.email` | User email address |
| `gmail.readonly` | Read emails and threads |
| `gmail.modify` | Modify labels, archive, trash |
| `gmail.send` | Send emails |
| `gmail.compose` | Create and edit drafts |
| `gmail.settings.basic` | Manage filters and vacation settings |
| `calendar` | Calendar read/write |
| `contacts.readonly` | Read contacts (People API) |

## Microsoft Azure Setup

1. Go to [Azure Portal > App Registrations](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Register a new application
3. Set **Supported account types** to "Personal Microsoft accounts only" or "All account types"
4. Under **Authentication**, enable **"Allow public client flows"** (required for Device Code)
5. Copy the Application (client) ID

::: tip No Redirect URI Needed
VibeMCP uses the Device Code flow for Microsoft, which doesn't require a redirect URI. This makes it ideal for CLI and MCP server environments.
:::

### Microsoft Scopes

**All accounts (personal + business):**

| Scope | Purpose |
|:------|:--------|
| `Mail.ReadWrite` | Read and write emails |
| `Mail.Send` | Send emails |
| `Calendars.ReadWrite` | Calendar access |
| `User.Read` | User profile |
| `Contacts.Read` | Read contacts |
| `People.Read` | People search and resolution |

**Business accounts only (additional):**

| Scope | Purpose |
|:------|:--------|
| `Chat.ReadWrite` | Teams chat access |
| `User.ReadBasic.All` | Read basic user info |
| `ChannelMessage.Send` | Post to Teams channels |
| `Team.ReadBasic.All` | Read team info |
| `Channel.ReadBasic.All` | Read channel info |

Personal accounts (hotmail/outlook/live) automatically use only the base scopes. Teams scopes are not supported by personal Microsoft accounts.

## MCP Client Configuration

### Claude Desktop

Config file location:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "vibemcp": {
      "command": "npx",
      "args": ["-y", "vibemcp"],
      "env": {
        "GOOGLE_CLIENT_ID": "your-client-id.apps.googleusercontent.com",
        "GOOGLE_CLIENT_SECRET": "your-client-secret",
        "MICROSOFT_CLIENT_ID": "your-azure-client-id",
        "MICROSOFT_TENANT_ID": "common"
      }
    }
  }
}
```

### Claude Code

Add to `~/.claude.json`:

```json
{
  "mcpServers": {
    "vibemcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "vibemcp"],
      "env": {
        "GOOGLE_CLIENT_ID": "your-client-id.apps.googleusercontent.com",
        "GOOGLE_CLIENT_SECRET": "your-client-secret",
        "MICROSOFT_CLIENT_ID": "your-azure-client-id",
        "MICROSOFT_TENANT_ID": "common"
      }
    }
  }
}
```

### From Source

```json
{
  "mcpServers": {
    "vibemcp": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/vibemcp/dist/cli.js"],
      "env": {
        "GOOGLE_CLIENT_ID": "your-client-id.apps.googleusercontent.com",
        "GOOGLE_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

## File Structure

VibeMCP stores all persistent data in `~/.vibemcp/`:

| File | Purpose |
|:-----|:--------|
| `~/.vibemcp/accounts.json` | Registry of connected accounts |
| `~/.vibemcp/.oauth2.{email}.json` | Google OAuth tokens per account |
| `~/.vibemcp/ms-token-cache.json` | Microsoft MSAL token cache |
| `~/.vibemcp/.env` | (Optional) persistent environment config |

The config directory can be overridden with `VIBEMCP_CONFIG_DIR`.

::: warning Security
These files contain OAuth tokens. They should never be committed to version control. The `~/.vibemcp/` directory is in your home folder and is not part of any project.
:::
