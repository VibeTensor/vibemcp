# VibeMCP Examples

## Claude Desktop Configuration

Copy `claude-desktop-config.json` to your Claude Desktop configuration:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

Replace `/path/to/vibemcp` with the absolute path to your VibeMCP installation, and fill in your OAuth credentials.

## Setup Steps

1. Clone and build VibeMCP:
   ```bash
   git clone https://github.com/VibeTensor/vibemcp.git
   cd vibemcp
   npm install && npm run build
   ```

2. Create `.env` with your OAuth credentials:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. Authenticate your accounts:
   ```bash
   node dist/cli.js auth google      # Opens browser
   node dist/cli.js auth microsoft   # Device code flow
   ```

4. Copy the Claude Desktop config and restart Claude.

5. You can now use commands like:
   - "List my recent emails"
   - "Search for emails from john@example.com"
   - "Send an email to jane@company.com about the meeting tomorrow"
   - "Show my calendar events for this week"
   - "Create a meeting with the team on Friday at 2pm"
