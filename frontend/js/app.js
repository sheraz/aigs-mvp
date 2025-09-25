// Initialize components when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all dashboard components
    window.violationsList = new ViolationsList('violations-container');
    window.agentStatus = new AgentStatus('agent-status-container');
    window.metricsCard = new MetricsCard('metrics-container');
    
    console.log('Metis Dashboard initialized');
});