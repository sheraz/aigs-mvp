// Global instances
let webSocketManager;
let toastManager;
let demoManager;
let violationsList;
let agentStatus;
let metricsCard;
let demoModeToggle;
let scenarioSelector;

// Initialize components when page loads
document.addEventListener('DOMContentLoaded', function() {

    // Initialize managers in correct order
    toastManager = new ToastManager();
    webSocketManager = new WebSocketManager('https://aigs-mvp.onrender.com');
    window.demoManager = new DemoManager();
    
    // Initialize all dashboard components
    window.violationsList = new ViolationsList('violations-container');
    window.agentStatus = new AgentStatus('agent-status-container');
    window.metricsCard = new MetricsCard('metrics-container');

    // Initialize demo components - NEW
    demoModeToggle = new DemoModeToggle('demo-toggle-container');
    scenarioSelector = new ScenarioSelector('scenario-selector-container');
        
    console.log('Metis Dashboard initialized with demo apparently');
});