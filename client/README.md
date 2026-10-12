# NIGRAN Client

A modern React + Vite frontend for the NIGRAN social media monitoring platform. This client provides a polished dashboard for viewing alerts, account activity, analytics, and platform-specific insights across Facebook, Instagram, TikTok, Twitter, and YouTube.

## Features

- Responsive dashboard experience
- Platform-based views for social media monitoring
- Real-time alerts and activity tracking
- Analytics cards and visual summaries
- Authentication flows for login and registration
- Clean UI built with React, Tailwind CSS, and Vite

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- React Router
- Axios
- Socket.IO Client
- Recharts
- Framer Motion

## Getting Started

### 1. Install dependencies

```bash
cd client
npm install
```

### 2. Start the development server

```bash
npm run dev
```

The app will be available at the local Vite URL shown in the terminal.

## Project Structure

```text
client/
  public/
  src/
    components/
    context/
    hooks/
    pages/
    services/
    utils/
```

## Useful Scripts

- `npm run dev` - Start the development server
- `npm run build` - Create a production build
- `npm run preview` - Preview the production build locally

## Notes

- Make sure the backend services are running before using dashboard features that depend on APIs.
- If you add new environment-based configuration, keep it documented in a local `.env` file and avoid committing secrets.
