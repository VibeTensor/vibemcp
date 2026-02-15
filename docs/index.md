---
layout: home

hero:
  name: VibeMCP
  text: Token-Optimized Unified MCP Server
  tagline: One server. Two ecosystems. Half the tokens.
  image:
    src: /vmcp_icon.svg
    alt: VibeMCP
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/nicktensor/vibemcp
    - theme: alt
      text: npm
      link: https://www.npmjs.com/package/@vibetensor/vibemcp

features:
  - icon: "\u26A1"
    title: 51% Token Savings
    details: TOON format eliminates repeated JSON keys. Calendar events save up to 70%.
  - icon: "\uD83D\uDD17"
    title: Unified Gmail + Microsoft 365
    details: 31 tools spanning Gmail, Outlook, Google Calendar, and Outlook Calendar in one server.
  - icon: "\uD83D\uDD10"
    title: Multi-Account Auth
    details: Connect multiple Google and Microsoft accounts. Cross-account search and unified inbox.
  - icon: "\uD83D\uDEE1\uFE0F"
    title: Fully Self-Hosted
    details: No telemetry, no hosted OAuth, no data retention. Your credentials, your data.
---

## Benchmarks

Measured on live accounts, February 2026:

| Dataset | JSON Tokens | TOON Tokens | Savings |
|---------|:-----------:|:-----------:|:-------:|
| Gmail - 10 messages | 961 | 591 | **38%** |
| Outlook - 10 messages | 1,480 | 872 | **41%** |
| Google Calendar - 11 events | 1,462 | 441 | **70%** |
| **Combined** | **3,903** | **1,904** | **51%** |

## Quick Install

```bash
npx @vibetensor/vibemcp
```

Or add to your MCP client config:

```json
{
  "vibemcp": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@vibetensor/vibemcp"]
  }
}
```
