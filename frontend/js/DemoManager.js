class DemoManager {
    constructor() {
        console.log('DemoManager constructor called');
        // Demo mode state management
        this.isDemoMode = false;
        this.isDemoRunning = false;
        this.activeScenario = null;
        this.demoViolations = [];
        this.eventHandlers = {};
        
        // Pre-defined demo scenarios for presentations
        this.scenarios = {
            financial: {
                id: 'financial',
                name: 'Financial Services Violation',
                description: 'AI agent accessing unauthorized customer financial data',
                violations: [
                    {
                        id: 'demo-fin-1',
                        agent_id: 'financial-advisor-ai',
                        agent_name: 'Financial Advisor AI',
                        action_type: 'access_customer_data',
                        severity: 'HIGH',
                        reason: 'Attempted to access customer data outside permitted scope',
                        timestamp: new Date().toISOString(),
                        details: { customerId: 'cust_12345', dataType: 'investment_portfolio' }
                    }
                ]
            },
            healthcare: {
                id: 'healthcare',
                name: 'Healthcare Data Breach',
                description: 'Medical AI processing patient data without consent',
                violations: [
                    {
                        id: 'demo-health-1',
                        agent_id: 'medical-ai-assistant',
                        agent_name: 'Medical AI Assistant',
                        action_type: 'process_patient_data',
                        severity: 'HIGH',
                        reason: 'Processing patient data without valid consent',
                        timestamp: new Date().toISOString(),
                        details: { patientId: 'pat_67890', dataType: 'medical_records' }
                    }
                ]
            },
            hr: {
                id: 'hr',
                name: 'HR Bias Detection',
                description: 'Recruitment AI showing discriminatory behavior patterns',
                violations: [
                    {
                        id: 'demo-hr-1',
                        agent_id: 'recruitment-ai',
                        agent_name: 'Recruitment AI',
                        action_type: 'candidate_evaluation',
                        severity: 'MEDIUM',
                        reason: 'Bias detected in candidate scoring algorithm',
                        timestamp: new Date().toISOString(),
                        details: { candidateId: 'cand_54321', biasType: 'gender_discrimination' }
                    }
                ]
            },
            legal: {
                id: 'legal',
                name: 'Legal Confidentiality Breach',
                description: 'Document AI attempting to share privileged information',
                violations: [
                    {
                        id: 'demo-legal-1',
                        agent_id: 'legal-document-ai',
                        agent_name: 'Legal Document AI',
                        action_type: 'share_document',
                        severity: 'HIGH',
                        reason: 'Attempted to share privileged attorney-client information',
                        timestamp: new Date().toISOString(),
                        details: { documentId: 'doc_98765', privilegeType: 'attorney_client' }
                    }
                ]
            }
        };
        
        this.setupWebSocketHandlers();
    }

    setupWebSocketHandlers() {
        // Wait for WebSocket manager to be available before setting up handlers
        if (typeof webSocketManager === 'undefined') {
            setTimeout(() => this.setupWebSocketHandlers(), 100);
            return;
        }

        // Listen for demo events from backend
        webSocketManager.on('demo_started', () => {
            console.log('Demo started event received');
            if (this.isDemoMode) {
                // If we're in UI demo mode, backend demo should reset our state
                this.isDemoRunning = false;
                this.activeScenario = null;
            } else {
                // If we're in live mode, backend demo sets running state
                this.isDemoRunning = true;
            }
            this.triggerEvent('demo_started');
        });

        // Listen for demo violations (these come through normal violation channel)
        webSocketManager.on('violation', (violation) => {
            if (this.isDemoMode) {
                console.log('Demo violation received:', violation);
                this.demoViolations.unshift(violation);
                this.triggerEvent('demo_violation', violation);
            }
        });
    }

    // Event system for communicating with other components
    on(event, callback) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(callback);
    }

    off(event, callback) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event] = this.eventHandlers[event].filter(cb => cb !== callback);
        }
    }

    triggerEvent(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(callback => callback(data));
        }
    }

    // Demo mode control methods
    toggleDemoMode() {
        this.isDemoMode = !this.isDemoMode;
        
        if (!this.isDemoMode) {
            // Exiting demo mode - clear demo data
            this.clearDemoViolations();
            this.isDemoRunning = false;
            this.activeScenario = null;
        } else {
            // Entering demo mode - reset backend demo state
            this.isDemoRunning = false;
            this.activeScenario = null;
        }
        
        this.triggerEvent('demo_mode_changed', this.isDemoMode);
        return this.isDemoMode;
    }

    async startScenario(scenarioId) {
        // Check WebSocket connection before starting demo
        if (!webSocketManager || !webSocketManager.connected) {
            throw new Error('WebSocket not connected');
        }

        this.activeScenario = scenarioId;
        
        try {
            // Call backend demo endpoint
            const response = await fetch('https://aigs-mvp.onrender.com/demo/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ scenario: scenarioId })
            });

            if (!response.ok) {
                throw new Error('Failed to start demo scenario');
            }

            this.isDemoRunning = true;
            this.triggerEvent('scenario_started', scenarioId);
            return true;
        } catch (error) {
            this.activeScenario = null;
            throw error;
        }
    }

    stopDemo() {
        this.isDemoRunning = false;
        this.activeScenario = null;
        this.triggerEvent('demo_stopped');
    }

    resetDemo() {
        this.clearDemoViolations();
        this.isDemoRunning = false;
        this.activeScenario = null;
        this.triggerEvent('demo_reset');
    }

    clearDemoViolations() {
        this.demoViolations = [];
        this.triggerEvent('demo_violations_cleared');
    }

    // Getters for other components to access demo state
    getScenarios() {
        return this.scenarios;
    }

    getDemoViolations() {
        return this.demoViolations;
    }

    isConnected() {
        return webSocketManager && webSocketManager.connected;
    }
}