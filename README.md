# NIGRAN

NIGRAN is a full-stack social media monitoring and analytics platform designed to help users track alerts, mentions, and activity across major platforms including Facebook, Instagram, TikTok, Twitter, and YouTube.

This project combines a modern React frontend with multiple backend services to deliver a unified dashboard for monitoring public social conversations and platform activity.

## Project Overview

Monitoring X provides:

- A responsive web dashboard for social media monitoring
- Real-time alerts and activity updates
- Account-based tracking and analytics
- Platform-specific views for Facebook, Instagram, TikTok, Twitter, and YouTube
- Authentication and user management
- A modular backend architecture with separate services per platform

## Architecture

The project is organized into two main parts:

- Client: React + Vite frontend
- Server: Node.js backend services for each platform

### Client

The client application is located in the [client](client) folder and includes:

- Dashboard pages
- Platform-specific components
- Authentication screens
- Analytics and visualization UI
- Real-time communication with backend services

### Server

The backend is located in the [server](server) folder and contains separate services for:

- [server/facebook](server/facebook)
- [server/Instagram](server/Instagram)
- [server/TikTok](server/TikTok)
- [server/twitter](server/twitter)
- [server/youtube](server/youtube)

Each service handles its own routes, controllers, models, jobs, and real-time socket integration.

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- Socket.IO Client
- Recharts
- Framer Motion

### Backend

- Node.js
- Express
- MongoDB with Mongoose
- Socket.IO
- JWT Authentication
- Node Cron
- dotenv

## Features

- User authentication and registration
- Social media account monitoring
- Activity timeline and alert management
- Dashboard analytics and summaries
- Real-time updates for new alerts and mentions
- Modular services for scalable platform expansion

## Folder Structure

```text
PSS NIGRAN/
  client/
    src/
    public/
  server/
    facebook/
    Instagram/
    TikTok/
    twitter/
    youtube/
```

## Getting Started

### 1. Install frontend dependencies

```bash
cd client
npm install
```

### 2. Install backend dependencies for a service

Example:

```bash
cd server/twitter
npm install
```

Repeat this process for the other services you want to run.

### 3. Start the frontend

```bash
cd client
npm run dev
```

### 4. Start a backend service

```bash
cd server/twitter
npm run dev
```

## Environment Configuration

Each backend service may require its own environment variables such as:

- PORT
- MONGODB_URI
- JWT_SECRET
- Platform API credentials

Create a local `.env` file inside the relevant service folder before starting it.

## Development Notes

- Keep the frontend and backend services running together for full functionality.
- Ensure MongoDB is available before starting services that depend on database access.
- Use the development scripts for local testing and debugging.

## Project Goals

The purpose of this project is to provide a professional, scalable, and user-friendly monitoring platform for tracking social media activity and generating useful insights from real-time data.

## Summary

NIGRAN is a comprehensive solution for social media monitoring, combining modern frontend design with a powerful multi-service backend architecture to deliver an efficient and professional dashboard experience.
