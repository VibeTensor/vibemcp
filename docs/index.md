---
layout: home

hero:
  name: VibeMCP
  text: "One Server. Two Ecosystems.\nHalf the Tokens."
  tagline: The token-optimized MCP server that unifies Gmail and Microsoft 365 for AI assistants.
  image:
    src: /vmcp_icon.svg
    alt: VibeMCP
  actions:
    - theme: brand
      text: Get Started in 2 Minutes
      link: /guide/getting-started
    - theme: alt
      text: View Tools Reference
      link: /reference/tools
    - theme: alt
      text: GitHub
      link: https://github.com/VibeTensor/vibemcp

features:
  - icon: "&#9889;"
    title: 51% Fewer Tokens
    details: TOON format declares the schema once and streams rows with no repeated JSON keys. Calendar events save up to 70%.
    link: /guide/toon-format
    linkText: How TOON works
  - icon: "&#128231;"
    title: Gmail + Outlook in One Server
    details: 51 tools across Gmail, Outlook Mail, Google Calendar, Outlook Calendar, and Contacts. No need to install separate MCP servers.
    link: /reference/tools
    linkText: See all 51 tools
  - icon: "&#128101;"
    title: Multi-Account Support
    details: Connect multiple Google and Microsoft accounts. Cross-account search, unified inbox, and merged calendar views.
    link: /guide/multi-account
    linkText: Multi-account guide
  - icon: "&#128274;"
    title: Fully Self-Hosted
    details: Runs locally on your machine. No telemetry, no hosted OAuth proxy, no data sent anywhere. Your credentials stay yours.
    link: /reference/configuration
    linkText: Configuration guide
---

<div class="vp-doc" style="max-width: 688px; margin: 0 auto; padding: 0 24px;">

## Token Savings (Real Benchmarks)

Measured on live accounts with real data, February 2026:

| Dataset | JSON Tokens | TOON Tokens | Savings |
|:--------|:-----------:|:-----------:|:-------:|
| Gmail (10 messages) | 961 | 591 | **38%** |
| Outlook (10 messages) | 1,480 | 872 | **41%** |
| Google Calendar (11 events) | 1,462 | 441 | **70%** |
| **Combined** | **3,903** | **1,904** | **51%** |

Every tool call that returns data costs fewer tokens. Over a conversation with dozens of tool calls, the savings compound.

## How It Works

```mermaid
flowchart TD
    AI["Your AI Assistant\n(Claude, GPT, etc.)"]
    MCP["VibeMCP\nstdio MCP Server"]
    TOON["TOON Encoder\nSchema once → tab-delimited rows"]
    G["Google\nGmail + Calendar"]
    M["Microsoft\nOutlook + Calendar"]

    AI -->|"MCP Protocol"| MCP
    MCP --> TOON
    TOON --> G
    TOON --> M

    classDef server fill:#0ea5e9,stroke:#0284c7,color:#fff
    classDef encoder fill:#06b6d4,stroke:#0891b2,color:#fff
    classDef provider fill:#34d399,stroke:#059669,color:#fff

    class MCP server
    class TOON encoder
    class G,M provider
```

## Quick Start

### 1. Add to Claude Desktop / Claude Code

```json
{
  "mcpServers": {
    "vibemcp": {
      "command": "npx",
      "args": ["-y", "@vibetensor/vibemcp"],
      "env": {
        "GOOGLE_CLIENT_ID": "your-google-client-id",
        "GOOGLE_CLIENT_SECRET": "your-google-client-secret",
        "MICROSOFT_CLIENT_ID": "your-azure-client-id",
        "MICROSOFT_TENANT_ID": "common"
      }
    }
  }
}
```

### 2. Authenticate Through Your AI

```
You: "Add my Google account user@gmail.com"
AI:  Opens browser → you sign in → done

You: "Add my Microsoft account user@outlook.com"
AI:  Shows a device code → you enter it at microsoft.com/devicelogin → done
```

### 3. Start Using It

```
You: "Show my latest emails"
You: "Search for emails from john@example.com"
You: "Send an email to jane@company.com about the meeting"
You: "What's on my calendar this week?"
You: "Create a meeting with the team on Friday at 2pm"
```

[Full setup guide →](/guide/getting-started)

## Why Not Just Use Separate MCP Servers?

| | VibeMCP | gmail-mcp + ms-365-mcp |
|:--|:------:|:----------------------:|
| Servers to install | **1** | 2 |
| Token format | **TOON (51% savings)** | JSON |
| Multi-account | **Built-in** | Not supported |
| Unified inbox / calendar | **Yes** | No |
| Cross-account search | **Yes** | No |

## Built By

[VibeTensor Private Limited](https://vibetensor.com) - Building token-efficient AI infrastructure.

[PolyForm Noncommercial License](https://polyformproject.org/licenses/noncommercial/1.0.0/) - Free for personal use, research, education, and hobby projects.

</div>
