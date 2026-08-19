# Bolu Aderoju Initiative Survey

MongoDB-backed participant survey app for Render.

## Render environment
MONGODB_URI=your MongoDB Atlas URI
JWT_SECRET=your long random secret

Build: `npm install && npm run build`
Start: `npm start`

Health check: `/api/health`

The survey submission endpoint explicitly parses JSON before routes and safely handles missing request bodies, fixing the Render error:
`Cannot destructure property 'answers' of 'req.body' as it is undefined`.

The participant reward claim button opens the initiative Paystack Payment Page:
https://paystack.shop/pay/boluaderoju
