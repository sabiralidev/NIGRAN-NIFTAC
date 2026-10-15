# NIGRAN Server

This folder contains the backend services for the NIGRAN platform. The system is organized as separate Node.js services for each social media platform, allowing independent monitoring, data processing, and real-time updates.

## Supported Services

- Facebook service
- Instagram service
- TikTok service
- Twitter service
- YouTube service

## Tech Stack

- Node.js
- Express
- MongoDB with Mongoose
- Socket.IO
- JWT authentication
- Node Cron
- Axios
- dotenv

## Project Structure

```text
server/
  facebook/
  Instagram/
  TikTok/
  twitter/
  youtube/
```

Each platform folder contains its own package configuration, API routes, controllers, models, and background jobs.

## Getting Started

### 1. Install dependencies for a service

Example for the Twitter service:

```bash
cd server/twitter
npm install
```

You can repeat the same process for the other platform service folders.

### 2. Start a service

```bash
npm run dev
```

Or use production mode:

```bash
npm start
```

## Environment Configuration

Each service may require its own environment variables such as:

- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- API credentials for the relevant social platform

Create a local `.env` file in the service folder before starting it.

## Development Notes

- Keep service-specific logic isolated within each platform folder.
- Ensure database connectivity is available before running monitoring jobs.
- Use the development script for hot-reload-friendly local testing.

## Recommended Workflow

1. Start the required backend services.
2. Start the frontend client.
3. Access the dashboard and verify platform data flows correctly.
