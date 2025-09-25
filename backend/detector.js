const { dbOperations } = require('./database');

// Main violation detection function
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

    // No violation - action is permitted
    return callback(null, { isViolation: false, violation: null });
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

module.exports = { detectViolation };