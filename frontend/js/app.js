// Global instances
let webSocketManager;
let toastManager;
let violationsList;
let agentStatus;
let metricsCard;

// Initialize components when page loads
document.addEventListener('DOMContentLoaded', function() {

    // Initialize toast manager
    toastManager = new ToastManager();
    
    // Initialize WebSocket manager
    webSocketManager = new WebSocketManager('https://aigs-mvp.onrender.com');

    // Initialize all dashboard components
    window.violationsList = new ViolationsList('violations-container');
    window.agentStatus = new AgentStatus('agent-status-container');
    window.metricsCard = new MetricsCard('metrics-container');
    
    console.log('Metis Dashboard initialized');
});