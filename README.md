# Nova AI OS MVP (Mobile-first)

This version focuses on a **mobile-first experience** via a lightweight web UI.

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

Then open on phone browser:

- `http://<your-machine-ip>:8787`

## Modes

- `APP_MODE=mobile` (default): serves `public/index.html` and `/api/chat`
- `APP_MODE=telegram`: enables Telegram gateway

## Environment

- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `WORKSPACE_ROOT`
- `DATABASE_PATH`
- `MAX_HISTORY_MESSAGES`
- `APP_MODE`
- `MOBILE_PORT`
- `TELEGRAM_BOT_TOKEN` (telegram mode)
- `TELEGRAM_ALLOWED_CHAT_ID` (telegram mode)
