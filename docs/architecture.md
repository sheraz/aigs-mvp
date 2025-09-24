# AIGS MVP Architecture

## System Overview
![Architecture Diagram](./AIGS MVP Architecture Visual v1.0.jpg)

## Components
- Backend: Node.js + Express + SQLite
- Frontend: React + Next.js
- Hosting: Render + Vercel

## Database Scheme (BasicMVP)
- agents (id, name, permissions, created_at)
- actions (id, agent_id, action_type, details, timestamp)  
- violations (id, agent_id, action_type, severity, reason, timestamp)

## API EPs (CoreMVP)
- POST /agent/action - AI agents report actions
- GET /violations - Retrieve violation list
- POST /permissions - Set agent permissions
- GET /status - System health check

## Render (FE)
https://aigs-mvp.onrender.com/

## Personal Access Token (Github)

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