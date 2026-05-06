# Notifications

Notifications service for Solvit.

## Development

```sh
pnpm --filter notifications dev
```

The service uses Mongoose and expects `MONGODB_URI` to be set. The default local
environment points to `mongodb://localhost:27017/solvit_notifications_development`.
