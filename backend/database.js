const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database file (this creates a file called 'metis.db')
const dbPath = path.join(__dirname, 'metis.db');
const db = new sqlite3.Database(dbPath);

// Create tables when database starts
db.serialize(() => {
  // Agents table - stores AI systems we're monitoring
  db.run(`CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    permissions TEXT, -- JSON string of allowed actions
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Actions table - every action AI agents take
  db.run(`CREATE TABLE IF NOT EXISTS actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    details TEXT, -- JSON string with action details
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents (id)
  )`);

  // Violations table - actions that weren't allowed
  db.run(`CREATE TABLE IF NOT EXISTS violations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    severity TEXT NOT NULL, -- HIGH, MEDIUM, LOW
    reason TEXT,
    details TEXT, -- JSON string
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents (id)
  )`);
});

// Helper functions for database operations
const dbOperations = {
  // Get all violations
  getViolations: (callback) => {
    const query = `
      SELECT v.*, a.name as agent_name 
      FROM violations v 
      LEFT JOIN agents a ON v.agent_id = a.id 
      ORDER BY v.timestamp DESC 
      LIMIT 100
    `;
    db.all(query, [], callback);
  },

  // Add new violation
  addViolation: (violation, callback) => {
    const query = `
      INSERT INTO violations (agent_id, action_type, severity, reason, details)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.run(query, [
      violation.agent_id,
      violation.action_type, 
      violation.severity,
      violation.reason,
      JSON.stringify(violation.details)
    ], callback);
  },

  // Add new action
  addAction: (action, callback) => {
    const query = `
      INSERT INTO actions (agent_id, action_type, details)
      VALUES (?, ?, ?)
    `;
    db.run(query, [
      action.agent_id,
      action.action_type,
      JSON.stringify(action.details)
    ], callback);
  },

  // Get agent permissions
  getAgent: (agentId, callback) => {
    const query = `SELECT * FROM agents WHERE id = ?`;
    db.get(query, [agentId], callback);
  },

  // Add or update agent
  upsertAgent: (agent, callback) => {
    const query = `
      INSERT OR REPLACE INTO agents (id, name, permissions)
      VALUES (?, ?, ?)
    `;
    db.run(query, [
      agent.id,
      agent.name,
      JSON.stringify(agent.permissions)
    ], callback);
  }
};

module.exports = { db, dbOperations };