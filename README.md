# Naija History Survey

Mobile-first participant survey web app designed for Render.

## Features
- Account registration and login
- JSON file database (`server/db.json`)
- JWT authentication
- Bank-app-inspired participant dashboard
- 20 Nigerian history questions
- One-time survey submission
- ₦200,000 study-reward eligibility shown after completion
- No admin dashboard included yet

## Local
```bash
npm install
npm run dev
```

## Render
Create a Web Service from this project.
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Add environment variable: `JWT_SECRET` with a long random value.

### Important JSON database limitation
`server/db.json` is intentionally used as requested. On many Render services, the local filesystem is ephemeral, so data can be lost when the service is redeployed/restarted. For a real survey with thousands of participants, move the same data layer to persistent storage before launch.

### Reward wording
The ₦200,000 amount is presented as a configured research reward/eligibility amount, not as an actual bank balance or a promise of automatic withdrawal. Connect the approved grant disbursement process separately.
"# somar" 
