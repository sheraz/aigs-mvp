# Metis Architecture

## System Overview
![Architecture Diagram](./AIGS MVP Architecture Visual v1.0.jpg)

Real-time AI monitoring dashboard with enterprise-grade AppController pattern architecture.

## Current Status: PRODUCTION READY
- Architecture refactor: COMPLETE
- Demo/Live mode switching: FUNCTIONAL
- Real-time violation detection: OPERATIONAL
- WebSocket integration: STABLE

## Core Architecture Pattern

### AppController (Central State Manager)
**AppController Structure:**
- State: isDemoMode, isDemoRunning, activeScenario, demoViolations
- Methods: toggleDemoMode(), startScenario(), stopDemo(), resetDemo()
- Subscription system for real-time component updates
- Event bridge to DemoManager for backward compatibility

### Component Architecture
**Component Structure:**
- DemoModeToggle: AppController subscriptions (real-time state)
- ScenarioSelector: AppController subscriptions + loading state
- ViolationsList: AppController manager access
- MetricsCard: AppController manager access
- ToastManager: AppController integration

## Technology Stack

### Backend
- **Runtime**: Node.js + Express
- **Database**: SQLite (production ready)
- **Real-time**: WebSocket + Server-Sent Events
- **API**: RESTful endpoints

### Frontend
- **Framework**: React + Next.js
- **State Management**: AppController pattern
- **Real-time Updates**: WebSocket + subscription system
- **UI**: Responsive dashboard with demo/live modes

### Infrastructure
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Render
- **Database**: SQLite file-based storage
- **Monitoring**: Real-time violation detection

## Database Schema

### Core Tables
**Agent management:**
- agents (id, name, permissions, created_at)

**Action tracking:**
- actions (id, agent_id, action_type, details, timestamp)

**Violation detection:**
- violations (id, agent_id, action_type, severity, reason, timestamp)

**Demo scenarios:**
- demo_scenarios (id, name, description, violation_types)

## API Endpoints

### Production Endpoints
- POST /agent/action - AI agents report actions
- GET /violations - Retrieve violation list  
- POST /permissions - Set agent permissions
- GET /status - System health check
- GET /metrics - System performance data

### Demo Management
- POST /demo/start - Start demo scenario
- POST /demo/stop - Stop demo scenario  
- GET /demo/scenarios - List available scenarios
- POST /demo/violation - Trigger demo violation

## Real-time Processing

### WebSocket Events
- demo_started - Demo scenario initiated
- violation_detected - Real violation occurred
- demo_violation - Simulated violation for demo
- metrics_updated - System metrics refresh

### Event Flow
AI Agent Action → API Endpoint → Violation Detection → WebSocket Event → Dashboard Update

## Deployment URLs

### Production Environment
- **Frontend (Render)**: https://aigs-mvp.onrender.com/
- **Backend API**: https://metis-backend.onrender.com/
- **Status**: Fully operational with real-time monitoring

### Demo Capabilities
- Toggle between demo/live modes
- Pre-configured violation scenarios
- Real-time simulation for presentations
- Risk-free investor demonstrations

## Next Phase: Real AI Agent Testing

### Implementation Ready
1. Create test AI agent (Node.js script)
2. Generate unauthorized activities
3. Validate end-to-end monitoring
4. Demonstrate <2 second detection

### Success Criteria
- 10+ violation types detected
- 100% violations appear in dashboard
- <2 second latency from action to display
- Complete audit trail with actionable details

## Architecture Benefits

### Technical Advantages
- **Zero state conflicts** between demo/live modes
- **Real-time synchronization** across all components  
- **Hybrid architecture** supports subscription + event patterns
- **WebSocket integration** maintains backend communication
- **Component lifecycle management** with proper cleanup

### Business Value
- **Dual-mode operation** enables safe investor demos
- **Enterprise-ready** architecture with proper state management
- **Real-time monitoring** capabilities proven and functional
- **Scalable foundation** supporting enterprise requirements

## Key Files Updated
- AppController.js - Central state manager
- DemoManager.js - WebSocket handling (no state)
- DemoModeToggle.js - AppController subscriptions
- ScenarioSelector.js - Real-time state management
- ToastManager.js - AppController integration
- ViolationsList.js - Manager access pattern
- MetricsCard.js - AppController integration

## Architecture Validation
- **State Management**: Centralized through AppController
- **Real-time Updates**: WebSocket + subscription system
- **Demo/Live Modes**: Conflict-free switching
- **Component Sync**: Real-time state propagation
- **Error Handling**: Toast notifications functional

**Status**: Ready for Phase 2 - Real AI agent testing and business validation