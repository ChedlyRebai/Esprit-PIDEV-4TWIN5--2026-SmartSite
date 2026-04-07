# Incident Management microservice

This service provides a minimal NestJS-based API for reporting and managing incidents.

Endpoints:

- `GET /incidents` — list incidents
- `GET /incidents/:id` — get incident
- `POST /incidents` — create incident
- `PUT /incidents/:id` — update incident
- `DELETE /incidents/:id` — delete incident

How to run (from the service folder):

```bash
npm install
npm run start:dev
```

Default port: `3002` (or set `PORT` env var).
