const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

// Your Metis backend URL for reporting violations
const METIS_BACKEND = 'https://aigs-mvp.onrender.com';

// Define unauthorized endpoints for AI agents
const UNAUTHORIZED_ENDPOINTS = [
    'api.github.com',
    'api.stripe.com', 
    'admin.company.com',
    'gmail.com',
    'localhost:3306'
];

// Define authorized endpoints for testing
const AUTHORIZED_ENDPOINTS = [
    'httpbin.org',
    'jsonplaceholder.typicode.com',
    'api.company.com',
    'public-api.service.com'
];

function isAuthorizedEndpoint(url) {
    return AUTHORIZED_ENDPOINTS.some(allowed => url.includes(allowed));
}

function isUnauthorizedEndpoint(url) {
    return UNAUTHORIZED_ENDPOINTS.some(blocked => url.includes(blocked));
}

async function reportActivityToMetis(activityType, details) {
    try {
        const activity = {
            agent_id: details.agentId,
            agent_name: details.agentName || details.agentId,
            action_type: activityType,
            severity: details.severity || 'INFO',
            reason: details.reason,
            timestamp: new Date().toISOString(),
            details: {
                detectedBy: 'MetisMonitor',
                targetUrl: details.targetUrl,
                method: details.method,
                userAgent: details.userAgent,
                externalDetection: true,
                authorized: details.authorized || false
            }
        };

        const logPrefix = details.authorized ? '✅ AUTHORIZED' : '🚨 VIOLATION';
        console.log(`${logPrefix}:`, activity.reason);
        
        const response = await fetch(`${METIS_BACKEND}/violations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(activity)
        });

        if (response.ok) {
            const status = details.authorized ? 'authorized activity' : 'violation';
            console.log(`📊 ${status} reported to Metis dashboard`);
        }
    } catch (error) {
        console.error('Failed to report activity:', error.message);
    }
}

app.use('/ai-proxy/*', (req, res) => {
    const targetUrl = req.headers['x-target-url'] || req.params[0];
    const agentId = req.headers['x-agent-id'] || 'unknown-agent';
    
    console.log(`🔍 MONITORING: Agent ${agentId} accessing ${targetUrl}`);
    
    // Check for violations here
    if (isUnauthorizedEndpoint(targetUrl)) {
        reportActivityToMetis('unauthorized_network_access', {
            agentId: agentId,
            agentName: `AI Agent ${agentId}`,
            targetUrl: targetUrl,
            method: req.method,
            userAgent: req.headers['user-agent'],
            severity: 'HIGH',
            authorized: false,
            reason: `Attempted access to restricted endpoint: ${targetUrl}`
        });
    } else if (isAuthorizedEndpoint(targetUrl)) {
        reportActivityToMetis('authorized_network_access', {
            agentId: agentId,
            agentName: `AI Agent ${agentId}`,
            targetUrl: targetUrl,
            method: req.method,
            userAgent: req.headers['user-agent'],
            severity: 'INFO',
            authorized: true,
            reason: `Authorized access to approved endpoint: ${targetUrl}`
        });
    }
    
    // Proxy the request manually
    res.json({ status: 'monitored', target: targetUrl });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'monitoring',
        timestamp: new Date().toISOString(),
        message: 'Enhanced AI Monitoring Proxy Active'
    });
});

const PORT = process.env.PROXY_PORT || 8080;
app.listen(PORT, () => {
    console.log(`🛡️  Enhanced AI Monitoring Proxy running on port ${PORT}`);
    console.log(`Monitoring AI agent traffic for authorized and unauthorized activity`);
});