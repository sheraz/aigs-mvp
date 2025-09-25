const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Add this after the existing imports
const { dbOperations } = require('./database');
const { detectViolation } = require('./detector');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'AIGS API is running!',
    timestamp: new Date().toISOString()
  });
});

// Add these endpoints after the basic test endpoint

// 1. ENDPOINT: AI agents report actions (UPDATED WITH VIOLATION DETECTION)
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
            // io.emit('violation', {
              // ...result.violation,
              // id: Date.now(), // Temporary ID for real-time display
              // timestamp: new Date().toISOString()
            // });
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});