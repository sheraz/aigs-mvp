const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
const { dbOperations } = require('./database');
const { detectViolation } = require('./detector');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:8000", // frontend URL
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// WebSocket connection tracking
let connectedClients = 0;

// Handle WebSocket connections
io.on('connection', (socket) => {
  connectedClients++;
  console.log(`Dashboard connected. Total clients: ${connectedClients}`);

  // Send recent violations when dashboard connects
  dbOperations.getViolations((err, violations) => {
    if (!err && violations.length > 0) {
      socket.emit('initial_violations', violations);
    }
  });

  // Handle dashboard disconnection
  socket.on('disconnect', () => {
    connectedClients--;
    console.log(`Dashboard disconnected. Total clients: ${connectedClients}`);
  });

  // Handle demo mode requests
  socket.on('start_demo', () => {
    console.log('Starting demo mode...');
    startDemoMode(socket);
  });
});

// Demo mode - simulate violations for presentations
function startDemoMode(socket) {
  const demoViolations = [
    {
      id: 'demo-1',
      agent_id: 'financial-advisor-ai',
      agent_name: 'Financial Advisor AI',
      action_type: 'access_customer_bank_details',
      severity: 'HIGH',
      reason: 'Agent attempted to access bank details without customer consent',
      details: { customerId: 'CUST_12345', accountType: 'savings' },
      timestamp: new Date().toISOString()
    },
    {
      id: 'demo-2',
      agent_id: 'hr-screening-ai',
      agent_name: 'HR Screening AI',
      action_type: 'access_protected_characteristics',
      severity: 'HIGH',
      reason: 'AI attempted to access protected characteristics during hiring process',
      details: { candidateId: 'CAND_67890', characteristic: 'age_data' },
      timestamp: new Date(Date.now() + 3000).toISOString()
    },
    {
      id: 'demo-3',
      agent_id: 'customer-service-ai',
      agent_name: 'Customer Service AI',
      action_type: 'share_personal_data_externally',
      severity: 'MEDIUM',
      reason: 'Agent attempted to share personal data with external service',
      details: { customerId: 'CUST_54321', externalService: 'marketing-platform' },
      timestamp: new Date(Date.now() + 6000).toISOString()
    }
  ];

  // Send demo violations with delays for dramatic effect
  demoViolations.forEach((violation, index) => {
    setTimeout(() => {
      socket.emit('violation', violation);
      console.log(`🎭 Demo violation sent: ${violation.action_type}`);
    }, index * 3000); // 3 second delays
  });
}

// Test endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AIGS API is running!',
    timestamp: new Date().toISOString()
  });
});

// 1. ENDPOINT: AI agents report actions (WITH VIOLATION DETECTION + WEBSOCKETS)
app.post('/agent/action', (req, res) => {
  const { agentId, action, details } = req.body;

  // Validate required fields
  if (!agentId || !action) {
    return res.status(400).json({
      error: 'Missing required fields: agentId and action'
    });
  }

  // Store the action first
  const actionData = {
    agent_id: agentId,
    action_type: action,
    details: details || {}
  };

  dbOperations.addAction(actionData, (err) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to store action' });
    }

    // Now check for violations
    detectViolation(agentId, action, details || {}, (err, result) => {
      if (err) {
        console.error('Violation detection error:', err);
        return res.status(500).json({ error: 'Failed to check permissions' });
      }

      const response = {
        status: 'processed',
        message: 'Action logged successfully',
        timestamp: new Date().toISOString(),
        violation: result.isViolation
      };

      if (result.isViolation) {
        // Store violation in database
        dbOperations.addViolation(result.violation, (err) => {
          if (err) {
            console.error('Failed to store violation:', err);
          } else {
            console.log(`🚨 VIOLATION DETECTED: ${agentId} attempted ${action}`);

            // Send real-time alert to connected dashboards
            io.emit('violation', {
              ...result.violation,
              id: Date.now(), // Temporary ID for real-time display
              timestamp: new Date().toISOString()
            });
          }
        });

        response.alert = 'Action violated permissions';
        response.severity = result.violation.severity;
      }

      res.json(response);
    });
  });
});

// 2. ENDPOINT: Get all violations (for dashboard)
app.get('/violations', (req, res) => {
  dbOperations.getViolations((err, violations) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch violations' });
    }

    // Parse JSON strings back to objects
    const parsedViolations = violations.map(violation => ({
      ...violation,
      details: JSON.parse(violation.details || '{}')
    }));

    res.json(parsedViolations);
  });
});

// 3. ENDPOINT: Set agent permissions
app.post('/permissions', (req, res) => {
  const { agentId, name, permissions } = req.body;

  // Validate required fields
  if (!agentId || !permissions) {
    return res.status(400).json({
      error: 'Missing required fields: agentId and permissions'
    });
  }

  const agentData = {
    id: agentId,
    name: name || agentId,
    permissions: permissions // Should be array like ["read_data", "write_files"]
  };

  dbOperations.upsertAgent(agentData, (err) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to update permissions' });
    }

    res.json({
      status: 'updated',
      message: `Permissions set for ${agentId}`,
      agent: agentData
    });
  });
});

// 4. BONUS ENDPOINT: Get agent info
app.get('/agent/:agentId', (req, res) => {
  const { agentId } = req.params;

  dbOperations.getAgent(agentId, (err, agent) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch agent' });
    }

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Parse permissions JSON
    const parsedAgent = {
      ...agent,
      permissions: JSON.parse(agent.permissions || '[]')
    };

    res.json(parsedAgent);
  });
});

// Demo mode endpoint
app.post('/demo/start', (req, res) => {
  console.log('Demo mode triggered via API');

  // Broadcast to all connected dashboards
  io.emit('demo_started', {
    message: 'Demo mode activated',
    timestamp: new Date().toISOString()
  });

  // Create and emit demo violations
  const demoViolations = [
    {
      id: Date.now(),
      agent_id: 'demo-financial-ai',
      agent_name: 'Financial AI Assistant',
      action_type: 'access_customer_data',
      severity: 'HIGH',
      reason: 'Unauthorized access to customer financial records',
      timestamp: new Date().toISOString()
    },
    {
      id: Date.now() + 1,
      agent_id: 'demo-hr-ai',
      agent_name: 'HR AI Assistant',
      action_type: 'process_employee_data',
      severity: 'MEDIUM',
      reason: 'Processing employee data without proper consent',
      timestamp: new Date(Date.now() + 2000).toISOString()
    }
  ];

  // Emit violations with delay
  demoViolations.forEach((violation, index) => {
    setTimeout(() => {
      io.emit('violation', violation);
    }, index * 3000); // 3 second delay between violations
  });

  res.json({
    status: 'demo_started',
    message: 'Demo violations will be sent to connected dashboards',
    connectedClients: connectedClients
  });
});

// POST /violations - Direct violation reporting endpoint
app.post('/violations', (req, res) => {
  const violation = req.body;

  // Log the violation
  console.log('New violation received:', violation);

  // Broadcast to connected WebSocket clients
  io.emit('violation', violation);

  // Store in database (optional)
  dbOperations.addViolation(violation, (err) => {
    if (err) {
      console.error('Failed to store violation:', err);
    }
  });

  res.status(201).json({
    success: true,
    message: 'Violation recorded',
    violationId: violation.agent_id + '_' + Date.now()
  });
});

// Get system status
app.get('/status', (req, res) => {
  res.json({
    status: 'running',
    connectedClients: connectedClients,
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Start server with WebSocket support
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} with WebSocket support`);
});
