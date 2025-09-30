module.exports = {
    proxyUrl: process.env.PROXY_URL || 'http://localhost:8080/ai-proxy',
    wsPort: process.env.WS_PORT || 8081,
    httpPort: process.env.HTTP_PORT || 8082,
    defaultRequestInterval: process.env.REQUEST_INTERVAL || 5000, // milliseconds
    agentName: process.env.AGENT_NAME || 'Controllable AI Agent'
};