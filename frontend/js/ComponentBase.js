class ComponentBase {
    constructor(containerId, appController) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.appController = appController;
        this.subscriptionId = null;
        
        if (!this.container) {
            console.error(`Container with ID '${containerId}' not found`);
            return;
        }

        // Subscribe to state changes
        this.subscriptionId = this.appController.subscribe(this, (newState, oldState) => {
            this.onStateChange(newState, oldState);
        });
        
        this.initialize();
    }

    // Override in child classes
    initialize() {
        // Component-specific initialization
    }

    // Override in child classes
    onStateChange(newState, oldState) {
        // Handle state changes
    }

    // Helper method to update state
    updateState(updates) {
        this.appController.setState(updates);
    }

    // Helper method to get current state
    getState() {
        return this.appController.getState();
    }

    // Cleanup
    destroy() {
        if (this.subscriptionId) {
            this.appController.unsubscribe(this.subscriptionId);
        }
    }
}