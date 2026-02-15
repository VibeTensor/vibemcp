# Configuration

## Environment Variables

Create a `.env` file in the project root or working directory:

```sh
# Google OAuth 2.0 (for Gmail + Google Calendar)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Microsoft Azure (for Outlook + Outlook Calendar)
MICROSOFT_CLIENT_ID=your-application-client-id
MICROSOFT_TENANT_ID=common
```

## Google Cloud Setup

1. Go to [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials)
2. Create a new **OAuth 2.0 Client ID** (Application type: Desktop)
3. Add `http://localhost:4100/code` as an authorized redirect URI
4. Enable the **Gmail API** and **Google Calendar API** in [API Library](https://console.cloud.google.com/apis/library)
5. Copy the Client ID and Client Secret to your `.env`

### Google Scopes

VibeMCP requests these scopes during OAuth:

| Scope | Purpose |
|:------|:--------|
| `openid` | OpenID Connect identity |
| `userinfo.email` | User email address |
| `https://mail.google.com/` | Full Gmail access |
| `https://www.googleapis.com/auth/calendar` | Calendar read/write |

## Microsoft Azure Setup

1. Go to [Azure Portal > App Registrations](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Register a new application (any name)
3. Set **Supported account types** to "Personal Microsoft accounts only" or "All account types"
4. Under **Authentication**, enable **"Allow public client flows"** (required for Device Code)
5. Copy the Application (client) ID to your `.env`

::: tip
No redirect URI is needed for Microsoft. VibeMCP uses the Device Code flow, which is ideal for CLI tools.
:::

### Microsoft Scopes

| Scope | Purpose |
|:------|:--------|
| `Mail.ReadWrite` | Read and write emails |
| `Mail.Send` | Send emails |
| `Calendars.ReadWrite` | Calendar access |
| `User.Read` | User profile |

Personal accounts (hotmail/outlook/live) automatically exclude Teams and organizational scopes.

## MCP Client Configuration

### Claude Code

Add to `~/.claude.json`:

```json
{
  "mcpServers": {
    "vibemcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@vibetensor/vibemcp"]
    }
  }
}
```

### Claude Desktop

Add to your Claude Desktop config file:

```json
{
  "mcpServers": {
    "vibemcp": {
      "command": "npx",
      "args": ["-y", "@vibetensor/vibemcp"]
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
      "args": ["/absolute/path/to/vibemcp/dist/index.js"]
    }
  }
}
```

## File Structure

After authentication, VibeMCP creates these files:

| File | Purpose |
|:-----|:--------|
| `.env` | API credentials (user-created) |
| `accounts.json` | Registry of connected accounts |
| `.oauth2.{email}.json` | OAuth tokens per account |

All of these should be in your `.gitignore`.
