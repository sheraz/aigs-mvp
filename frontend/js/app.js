// Global app controller instance
let appController;

// Initialize components when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize app controller first
    appController = new AppController();
    window.appController = appController; // Temporary global access

    // Initialize managers in correct order
    const toastManager = new ToastManager();
    const webSocketManager = new WebSocketManager('https://aigs-mvp.onrender.com');
    const demoManager = new DemoManager();
    
    // Register managers with app controller
    appController.registerManager('toast', toastManager);
    appController.registerManager('webSocket', webSocketManager);
    appController.registerManager('demo', demoManager);
    
    // Initialize dashboard components (will be refactored in later phases)
    window.violationsList = new ViolationsList('violations-container');
    window.agentStatus = new AgentStatus('agent-status-container');
    window.metricsCard = new MetricsCard('metrics-container');
    window.demoModeToggle = new DemoModeToggle('demo-toggle-container');
    window.scenarioSelector = new ScenarioSelector('scenario-selector-container');
        
    console.log('Metis Dashboard initialized with AppController');
});