# Privacy Policy

**Last Updated:** February 2026

## Overview

VibeMCP is a **self-hosted, open-source** MCP server. It runs entirely on your local machine. VibeTensor Private Limited ("VibeTensor", "we") does not operate any hosted service, does not collect any data, and has no access to your accounts or information.

This document explains how VibeMCP handles data locally on your machine.

## Data VibeMCP Accesses

When you use VibeMCP, it accesses the following data through Google and Microsoft APIs **on your behalf**, using **your own API credentials**:

| Data Type | Access Level | Purpose |
|-----------|-------------|---------|
| Gmail messages | Read/Write/Send | List, search, read, compose, and send emails |
| Google Calendar events | Read/Write | List, create, update, and delete calendar events |
| Outlook messages | Read/Write/Send | List, search, read, compose, and send emails |
| Outlook Calendar events | Read/Write | List, create, update, and delete calendar events |
| Account profile | Read | Display account email and verify authentication |

## Data VibeMCP Stores

VibeMCP stores the following files locally on your machine:

| File | Contents | Purpose |
|------|----------|---------|
| `.env` | Your Google/Microsoft API credentials | Authenticate with Google Cloud and Azure APIs |
| `.oauth2.{email}.json` | Google OAuth access and refresh tokens | Maintain authenticated sessions with Google APIs |
| `~/.vibemcp-ms-cache.json` | Microsoft MSAL token cache | Maintain authenticated sessions with Microsoft APIs |
| `accounts.json` | List of registered account emails | Track which accounts are configured |

**VibeMCP does NOT store:**
- Email message content
- Calendar event details
- Contact information
- Attachment data
- Any data from API responses

VibeMCP is a passthrough. It fetches data from APIs on demand and returns it to your MCP client (e.g., Claude Code). Nothing is cached or persisted beyond authentication tokens.

## Data Transmission

- **To Google/Microsoft**: VibeMCP sends API requests to `googleapis.com` and `graph.microsoft.com` using HTTPS. These requests fetch your data using your own OAuth tokens.
- **To your MCP client**: VibeMCP returns API responses to the MCP client over local stdio (standard input/output). This never leaves your machine.
- **To VibeTensor**: Nothing. VibeMCP does not phone home, collect analytics, send telemetry, or transmit any data to VibeTensor or any third party.

## Third-Party Services

VibeMCP interacts with the following third-party services, governed by their respective privacy policies:

- **Google APIs**: Governed by [Google Privacy Policy](https://policies.google.com/privacy) and [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy)
- **Microsoft Graph API**: Governed by [Microsoft Privacy Statement](https://privacy.microsoft.com/privacystatement)

## Your Responsibilities

Since VibeMCP is self-hosted, you are responsible for:

1. **Securing credential files**: Ensure `.env`, `.oauth2.*.json`, and other token files have appropriate file permissions
2. **Not committing credentials**: The `.gitignore` file excludes sensitive files, but verify before pushing to any repository
3. **Revoking access**: If you stop using VibeMCP, revoke OAuth access:
   - Google: [https://myaccount.google.com/permissions](https://myaccount.google.com/permissions)
   - Microsoft: [https://account.live.com/consent/Manage](https://account.live.com/consent/Manage)
4. **Complying with API terms**: When you register your own Google Cloud project or Azure App Registration, you agree to their terms of service

## Google API Services User Data Policy Compliance

VibeMCP's use of Google API data adheres to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements:

- Data is used only to provide the user-facing features described in this document
- Data is not transferred to third parties (VibeMCP has no network connectivity beyond the Google/Microsoft APIs)
- Data is not used for advertising, marketing, or profiling
- Data is not used to determine creditworthiness or for lending purposes
- Human access to data is limited to the authenticated user viewing their own data through their MCP client

## OAuth Consent Screen Template

When setting up your Google Cloud OAuth consent screen, you may need to provide a privacy policy URL. You can host this document (or an adapted version) and link to it. The key points to include:

1. What data the application accesses
2. How the data is used (locally, not transmitted)
3. How to revoke access
4. Contact information

## Changes to This Policy

Since VibeMCP is open-source, changes to this privacy policy are tracked in the git repository. Review the commit history for any modifications.

## Contact

- **Email**: info@vibetensor.com
- **GitHub**: [https://github.com/VibeTensor/vibemcp](https://github.com/VibeTensor/vibemcp)
