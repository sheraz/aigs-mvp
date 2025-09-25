const { dbOperations } = require('./database');

// Main violation detection function (UPDATED with advanced checks)
function detectViolation(agentId, actionType, actionDetails, callback) {
  // Step 1: Get agent's permissions from database
  dbOperations.getAgent(agentId, (err, agent) => {
    if (err) {
      return callback(err, null);
    }

    // Step 2: If agent doesn't exist, it's a violation
    if (!agent) {
      const violation = {
        agent_id: agentId,
        action_type: actionType,
        severity: 'HIGH',
        reason: 'Unknown agent attempting action',
        details: actionDetails
      };
      return callback(null, { isViolation: true, violation });
    }

    // Step 3: Parse agent permissions (stored as JSON string)
    let permissions;
    try {
      permissions = JSON.parse(agent.permissions || '[]');
    } catch (e) {
      permissions = [];
    }

    // Step 4: Check if action is allowed
    const isAllowed = checkPermission(actionType, permissions, actionDetails);

    if (!isAllowed) {
      // Create violation record
      const violation = {
        agent_id: agentId,
        action_type: actionType,
        severity: calculateSeverity(actionType, actionDetails),
        reason: `Action '${actionType}' not in permitted actions: [${permissions.join(', ')}]`,
        details: actionDetails
      };
      return callback(null, { isViolation: true, violation });
    }

    // NEW: Check for advanced violations even if basic permission exists
    checkAdvancedViolations(agentId, actionType, actionDetails, (err, advancedResult) => {
      if (err) return callback(err, null);
      
      if (advancedResult.isViolation) {
        return callback(null, advancedResult);
      }

      // No violations detected
      return callback(null, { isViolation: false, violation: null });
    });
  });
}

// Check if specific action is allowed
function checkPermission(actionType, permissions, actionDetails) {
  // Basic permission check - is action in allowed list?
  if (permissions.includes(actionType)) {
    return true;
  }

  // Advanced permission checks
  if (actionType === 'access_data') {
    // Check if agent has specific data access permissions
    const dataType = actionDetails.dataType || 'unknown';
    return permissions.includes(`access_${dataType}_data`);
  }

  if (actionType === 'send_communication') {
    // Check communication permissions
    const commType = actionDetails.type || 'unknown';
    return permissions.includes(`send_${commType}`);
  }

  // Default: not permitted
  return false;
}

// Calculate how serious the violation is
function calculateSeverity(actionType, actionDetails) {
  // High risk actions
  const highRiskActions = [
    'access_financial_data',
    'access_personal_data', 
    'delete_data',
    'modify_permissions',
    'access_admin_functions'
  ];

  if (highRiskActions.includes(actionType)) {
    return 'HIGH';
  }

  // Medium risk actions
  const mediumRiskActions = [
    'access_data',
    'send_email',
    'create_user',
    'modify_data'
  ];

  if (mediumRiskActions.includes(actionType)) {
    return 'MEDIUM';
  }

  // Everything else is low risk
  return 'LOW';
}

// NEW: Check for suspicious patterns (DAY 6 ADVANCED RULES)
function checkAdvancedViolations(agentId, actionType, actionDetails, callback) {
  // Check for rapid successive actions (potential automation attack)
  checkRapidActions(agentId, actionType, (err, isRapid) => {
    if (err) return callback(err, null);
    
    if (isRapid) {
      const violation = {
        agent_id: agentId,
        action_type: actionType,
        severity: 'HIGH',
        reason: 'Rapid successive actions detected - possible automation attack',
        details: { ...actionDetails, pattern: 'rapid_actions' }
      };
      return callback(null, { isViolation: true, violation });
    }

    // Check for off-hours activity
    checkOffHoursActivity(actionType, (isOffHours) => {
      if (isOffHours && isSensitiveAction(actionType)) {
        const violation = {
          agent_id: agentId,
          action_type: actionType,
          severity: 'MEDIUM',
          reason: 'Sensitive action performed outside business hours',
          details: { ...actionDetails, pattern: 'off_hours' }
        };
        return callback(null, { isViolation: true, violation });
      }

      // No advanced violations detected
      callback(null, { isViolation: false, violation: null });
    });
  });
}

// Check if agent is performing actions too quickly
function checkRapidActions(agentId, actionType, callback) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  // Query recent actions from same agent
  const query = `
    SELECT COUNT(*) as count 
    FROM actions 
    WHERE agent_id = ? AND action_type = ? AND timestamp > ?
  `;
  
  const { db } = require('./database');
  db.get(query, [agentId, actionType, fiveMinutesAgo], (err, row) => {
    if (err) return callback(err, false);
    
    // More than 10 of same action in 5 minutes = suspicious
    const isRapid = row.count > 10;
    callback(null, isRapid);
  });
}

// Check if action is happening outside business hours
function checkOffHoursActivity(actionType) {
  const now = new Date();
  const hour = now.getHours();
  
  // Business hours: 9 AM to 6 PM, Monday to Friday
  const isBusinessHours = (hour >= 9 && hour <= 18);
  const isWeekday = (now.getDay() >= 1 && now.getDay() <= 5);
  
  return !(isBusinessHours && isWeekday);
}

// Check if action is sensitive
function isSensitiveAction(actionType) {
  const sensitiveActions = [
    'access_financial_data',
    'access_personal_data',
    'modify_permissions',
    'delete_data',
    'access_admin_functions'
  ];
  
  return sensitiveActions.includes(actionType);
}

module.exports = { detectViolation };