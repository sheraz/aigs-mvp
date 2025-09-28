class DemoManager {
    constructor() {
        console.log('DemoManager constructor called');
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
        // Wait for AppController to be available
        if (typeof window.appController === 'undefined') {
            setTimeout(() => this.setupWebSocketHandlers(), 100);
            return;
        }

        const webSocketManager = window.appController.getManager('webSocket');
        if (!webSocketManager) {
            setTimeout(() => this.setupWebSocketHandlers(), 100);
            return;
        }

        // Listen for demo events from backend
        webSocketManager.on('demo_started', () => {
            console.log('Demo started event received');
            const appState = window.appController.getState();
            window.appController.setState({
                isDemoRunning: true
            });
            this.triggerEvent('demo_started');
        });

        webSocketManager.on('violation', (violation) => {
            const appState = window.appController.getState();
            if (appState.isDemoMode) {
                console.log('Demo violation received:', violation);
                window.appController.addDemoViolation(violation);
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

    // Getters for other components to access demo state
    getScenarios() {
        return this.scenarios;
    }

    getDemoViolations() {
        const appState = window.appController?.getState();
        return appState ? appState.demoViolations : [];
    }

    isConnected() {
        const webSocketManager = window.appController?.getManager('webSocket');
        return webSocketManager && webSocketManager.connected;
    }
}