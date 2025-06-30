# 🧠 Slack Support Ticket Modal → GoHighLevel Integration

This app powers a custom Slack slash command `/balance new` that opens a modal form to collect support ticket details and routes them to a GoHighLevel (GHL) webhook for automation and task creation (e.g., in ClickUp).

---

## 🚀 Features

- Slash command `/balance new`
- Slack modal form with required/optional fields
- Slack request verification (HMAC SHA256)
- Securely posts submission data to a GHL webhook
- Fully typed and deployable via Next.js API routes

---

## 📁 Project Structure

```bash
pages/
├── api/
│   ├── slack-command.ts      # Handles slash command and opens modal
│   └── slack-interact.ts     # Handles modal submission and sends to GHL
.env.local                     # Environment variables (excluded from Git)
