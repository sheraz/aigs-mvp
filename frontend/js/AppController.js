class AppController {
    constructor() {
        this.state = {
            isDemoMode: false,
            isDemoRunning: false,
            activeScenario: null,
            demoViolations: [],
            violations: [],
            agents: [],
            metrics: {},
            isConnected: false
        };
        
        this.subscribers = {};
        this.managers = {};
    }

    // State management
    setState(updates) {
        const oldState = { ...this.state };
        Object.assign(this.state, updates);
        this.notifySubscribers(oldState, this.state);
    }

    getState() {
        return { ...this.state };
    }

    // Component subscription system
    subscribe(component, callback) {
        const id = component.constructor.name + '_' + Date.now();
        this.subscribers[id] = { component, callback };
        return id;
    }

    unsubscribe(subscriptionId) {
        delete this.subscribers[subscriptionId];
    }

    notifySubscribers(oldState, newState) {
        Object.values(this.subscribers).forEach(({ callback }) => {
            callback(newState, oldState);
        });
    }

    // Manager registration
    registerManager(name, manager) {
        this.managers[name] = manager;
    }

    getManager(name) {
        return this.managers[name];
    }

    // Demo mode methods (migrated from DemoManager)
    toggleDemoMode() {
        const newDemoMode = !this.state.isDemoMode;
        
        if (!newDemoMode) {
            // Exiting demo mode - clear demo data
            this.setState({
                isDemoMode: false,
                isDemoRunning: false,
                activeScenario: null,
                demoViolations: []
            });
        } else {
            // Entering demo mode - reset state
            this.setState({
                isDemoMode: true,
                isDemoRunning: false,
                activeScenario: null
            });
        }
        
        return newDemoMode;
    }

    async startScenario(scenarioId) {
        const webSocketManager = this.getManager('webSocket');
        
        if (!webSocketManager || !webSocketManager.connected) {
            throw new Error('WebSocket not connected');
        }

        try {
            const response = await fetch('https://aigs-mvp.onrender.com/demo/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scenario: scenarioId })
            });

            if (!response.ok) {
                throw new Error('Failed to start demo scenario');
            }

            this.setState({
                isDemoRunning: true,
                activeScenario: scenarioId
            });
            
            return true;
        } catch (error) {
            this.setState({ activeScenario: null });
            throw error;
        }
    }

    stopDemo() {
        this.setState({
            isDemoRunning: false,
            activeScenario: null
        });
    }

    resetDemo() {
        this.setState({
            isDemoRunning: false,
            activeScenario: null,
            demoViolations: []
        });
    }

    addDemoViolation(violation) {
        const newViolations = [violation, ...this.state.demoViolations];
        this.setState({ demoViolations: newViolations });
    }
}