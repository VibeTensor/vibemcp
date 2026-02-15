# Getting Started

## Installation

### Option 1: npx (Recommended)

No installation needed -- run directly:

```bash
npx @vibetensor/vibemcp
```

### Option 2: npm install

```bash
npm install @vibetensor/vibemcp
```

### Option 3: Clone from source

```bash
git clone https://github.com/VibeTensor/vibemcp.git
cd vibemcp
npm install && npm run build
```

## Configure Environment

Create a `.env` file in your working directory (or the vibemcp project root):

```sh
# Google OAuth (for Gmail + Google Calendar)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Microsoft (for Outlook + Outlook Calendar)
MICROSOFT_CLIENT_ID=your-azure-client-id
MICROSOFT_TENANT_ID=common
```

See [Configuration](/reference/configuration) for credential setup instructions.

## Add to Your MCP Client

### Claude Code

Add to `~/.claude.json` under `mcpServers`:

```json
{
  "vibemcp": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@vibetensor/vibemcp"]
  }
}
```

### Claude Desktop

Add to your Claude Desktop MCP config:

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

### From source

```json
{
  "vibemcp": {
    "type": "stdio",
    "command": "node",
    "args": ["/path/to/vibemcp/dist/index.js"]
  }
}
```

## Authenticate

### Google Account

Use the built-in MCP tools through your AI assistant:

```
> Add my Google account
  → add_google_account opens browser for OAuth
  → complete_google_auth finishes the flow
```

Or via CLI:

```bash
npx @vibetensor/vibemcp auth google your@gmail.com
```

### Microsoft Account

```
> Add my Microsoft account
  → add_microsoft_account returns a device code
  → Enter the code at microsoft.com/devicelogin
  → complete_microsoft_auth finishes the flow
```

Or via CLI:

```bash
npx @vibetensor/vibemcp auth microsoft your@outlook.com
```

### Verify

```bash
npx @vibetensor/vibemcp accounts list
```

## First Query

Once authenticated, try:

```
> Show my latest emails
```

VibeMCP returns TOON-formatted output:

```
messages[10]{id,subject,from,date,snippet}
19485abc	Team standup notes	alice@company.com	2026-02-16	Here are the notes from...
28ef9d01	Invoice #4521	billing@vendor.com	2026-02-15	Your invoice for February...
...
```

Switch to JSON anytime:

```
> Show my latest emails in JSON format
```

## Troubleshooting

### "No accounts connected"
Run `list_accounts` or `accounts_status` to check. You need to authenticate at least one Google or Microsoft account.

### Google OAuth fails
- Ensure `http://localhost:4100/code` is listed as an authorized redirect URI in your Google Cloud Console
- Verify Gmail API and Google Calendar API are enabled
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct in `.env`

### Microsoft Device Code expires
The device code is valid for ~15 minutes. If it expires, run `add_microsoft_account` again to get a fresh code.

### "AADSTS" errors (Microsoft)
- Ensure "Allow public client flows" is enabled in Azure Portal > App Registration > Authentication
- For personal accounts (hotmail/outlook/live), set Supported account types to include personal accounts

### Token file issues
OAuth tokens are stored as `.oauth2.{email}.json` files. If authentication seems broken, delete the token file and re-authenticate.
