# Bolu Aderoju Initiative — Nigerian History Survey

Participant-facing survey application for the Bolu Aderoju Initiative.

## Stack
- React + Vite
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Render-ready

## Features
- Participant registration/login
- Mobile-first banking-app-inspired dashboard
- 20 Nigerian history questions
- One-time survey submission
- Score tracking
- ₦200,000 research-reward eligibility display
- No admin dashboard yet

## Render environment variables

Set these in the Render Web Service:

```text
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/bolu_aderoju_initiative
JWT_SECRET=generate-a-long-random-secret
```

Build command:

```text
npm install && npm run build
```

Start command:

```text
npm start
```

## MongoDB
Create a MongoDB Atlas cluster, create a database user, allow the Render service to connect, then put the Atlas connection string into `MONGODB_URI`.

The application creates the `users` and `surveyresponses` collections automatically.

## Important
The ₦200,000 shown by the participant dashboard is presented as the configured research reward/eligibility amount. It is not an actual bank balance. Connect the approved grant disbursement process separately.
