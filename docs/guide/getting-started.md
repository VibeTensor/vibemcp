# Getting Started

Get VibeMCP running in under 5 minutes.

## Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Google OAuth credentials** (for Gmail/Calendar) - [Setup guide](#google-cloud-setup)
- **Microsoft App Registration** (for Outlook/Calendar) - [Setup guide](#microsoft-azure-setup)

You only need one provider. Set up whichever you use.

## Step 1: Add VibeMCP to Your AI Client

### Claude Desktop

Add to your Claude Desktop config file:

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
        "GOOGLE_CLIENT_ID": "your-google-client-id.apps.googleusercontent.com",
        "GOOGLE_CLIENT_SECRET": "your-google-client-secret",
        "MICROSOFT_CLIENT_ID": "your-azure-client-id",
        "MICROSOFT_TENANT_ID": "common"
      }
    }
  }
}
```

### Claude Code

Add to `~/.claude.json` under `mcpServers`:

```json
{
  "mcpServers": {
    "vibemcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "vibemcp"],
      "env": {
        "GOOGLE_CLIENT_ID": "your-google-client-id.apps.googleusercontent.com",
        "GOOGLE_CLIENT_SECRET": "your-google-client-secret",
        "MICROSOFT_CLIENT_ID": "your-azure-client-id",
        "MICROSOFT_TENANT_ID": "common"
      }
    }
  }
}
```

### From Source

```bash
git clone https://github.com/VibeTensor/vibemcp.git
cd vibemcp
npm install && npm run build
```

Then use the built files in your MCP config:

```json
{
  "mcpServers": {
    "vibemcp": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/vibemcp/dist/cli.js"],
      "env": {
        "GOOGLE_CLIENT_ID": "your-google-client-id",
        "GOOGLE_CLIENT_SECRET": "your-google-client-secret"
      }
    }
  }
}
```

::: tip Environment Variables
Credentials can also be provided via a `.env` file in your working directory or in `~/.vibemcp/.env`. The MCP client `env` block is the easiest approach with no files to manage.
:::

## Step 2: Restart Your AI Client

After saving the config, restart Claude Desktop or Claude Code so it picks up the new MCP server.

## Step 3: Authenticate Your Accounts

### Google Account

Through your AI assistant:

```
You: "Add my Google account user@gmail.com"
```

VibeMCP will:
1. Open your browser to the Google consent screen
2. You sign in and grant access
3. Your AI calls `complete_google_auth` to finish

Or via CLI:

```bash
npx vibemcp auth google user@gmail.com
```

### Microsoft Account

```
You: "Add my Microsoft account user@outlook.com"
```

VibeMCP will:
1. Show a device code (e.g., `ABCD1234`)
2. You go to [microsoft.com/devicelogin](https://microsoft.com/devicelogin) and enter the code
3. Your AI calls `complete_microsoft_auth` to finish

Or via CLI:

```bash
npx vibemcp auth microsoft user@outlook.com
```

### Verify Accounts

```bash
npx vibemcp accounts list
```

Or through your AI:

```
You: "List my connected accounts"
```

## Step 4: Start Using It

Once authenticated, just talk naturally:

```
You: "Show my latest emails"
You: "Search for emails from john@example.com"
You: "Send an email to jane@company.com about the project update"
You: "What's on my calendar this week?"
You: "Create a meeting with the team on Friday at 2pm"
You: "Show my unified inbox across all accounts"
```

VibeMCP returns TOON-formatted output by default:

```
messages[10]{id,subject,from,date,snippet}
19485abc	Team standup notes	alice@company.com	2026-02-16	Here are the notes from...
28ef9d01	Invoice #4521	billing@vendor.com	2026-02-15	Your February invoice...
```

Your AI reads this format naturally. Switch to JSON anytime by asking:

```
You: "Show my latest emails in JSON format"
```

## Google Cloud Setup

1. Go to [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials)
2. Create a new **OAuth 2.0 Client ID** (Application type: **Desktop**)
3. Add `http://localhost:4100/code` as an authorized **redirect URI**
4. Enable the [Gmail API](https://console.cloud.google.com/apis/library/gmail.googleapis.com) and [Google Calendar API](https://console.cloud.google.com/apis/library/calendar-json.googleapis.com) in your project
5. Copy the **Client ID** and **Client Secret** into your MCP config

::: warning OAuth Consent Screen
If your app is in "Testing" mode, only test users you've added can authenticate. Add your email as a test user in the OAuth consent screen settings.
:::

## Microsoft Azure Setup

1. Go to [Azure Portal > App Registrations](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Register a new application (any name, e.g., "VibeMCP")
3. Set **Supported account types** to include the account types you need:
   - "Personal Microsoft accounts only" for hotmail/outlook/live
   - "Accounts in any org directory + personal" for both work and personal
4. Under **Authentication**, enable **"Allow public client flows"** (required for Device Code)
5. Copy the **Application (client) ID** into your MCP config

::: tip No Redirect URI Needed
Microsoft uses Device Code Flow, so no redirect URI configuration is needed. This is why it works perfectly in CLI environments.
:::

## Where VibeMCP Stores Data

All data is stored in `~/.vibemcp/`:

| File | Purpose |
|:-----|:--------|
| `~/.vibemcp/accounts.json` | Registry of connected accounts |
| `~/.vibemcp/.oauth2.{email}.json` | Google OAuth tokens per account |
| `~/.vibemcp/ms-token-cache.json` | Microsoft MSAL token cache |

These files contain sensitive credentials. They are stored in your home directory and should never be committed to git.

## Troubleshooting

### "No accounts connected"

Run `list_accounts` or `accounts_status` to check your accounts. You need to authenticate at least one Google or Microsoft account first.

### Google OAuth Fails

- Ensure `http://localhost:4100/code` is listed as an authorized redirect URI in your Google Cloud Console
- Verify Gmail API and Google Calendar API are enabled in your project
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set correctly
- If app is in "Testing" mode, add your email as a test user

### Microsoft Device Code Expires

The device code is valid for ~15 minutes. If it expires, run `add_microsoft_account` again for a fresh code.

### "AADSTS" Errors (Microsoft)

- Ensure "Allow public client flows" is enabled in Azure Portal > App Registration > Authentication
- For personal accounts (hotmail/outlook/live), set Supported account types to include personal accounts
- If you see `AADSTS70016`, the device code has expired. Get a new one

### Token / Auth Issues

OAuth tokens are stored in `~/.vibemcp/`. If authentication seems broken:

```bash
# Remove the account and re-authenticate
npx vibemcp accounts remove user@gmail.com
npx vibemcp auth google user@gmail.com
```
