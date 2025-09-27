class ScenarioSelector {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.loading = null; // tracks which scenario is loading
        this.init();
    }

    init() {
        this.render();
        this.setupDemoHandlers();
    }

    setupDemoHandlers() {
        if (typeof window.appController === 'undefined') {
            setTimeout(() => this.setupDemoHandlers(), 100);
            return;
        }

        const demoManager = window.appController.getManager('demo');
        if (!demoManager) {
            setTimeout(() => this.setupDemoHandlers(), 100);
            return;
        }

        demoManager.on('demo_mode_changed', () => {
            this.render();
        });

        demoManager.on('scenario_started', () => {
            this.loading = null;
            this.render();
        });

        demoManager.on('demo_stopped', () => {
            this.render();
        });

        demoManager.on('demo_reset', () => {
            this.render();
        });
    }

    async handleStartScenario(scenarioId) {
        if (!window.demoManager || !window.demoManager.isConnected()) {
            toastManager.addToast('Cannot start demo - WebSocket not connected', 'error');
            return;
        }

        try {
            this.loading = scenarioId;
            this.render();
            
            await window.demoManager.startScenario(scenarioId);
            toastManager.addToast(`Started ${window.demoManager.scenarios[scenarioId].name} demo scenario`, 'success');
        } catch (error) {
            toastManager.addToast('Failed to start demo scenario', 'error');
            console.error('Error starting scenario:', error);
            this.loading = null;
            this.render();
        }
    }

    handleStopDemo() {
        if (window.demoManager) {
            window.demoManager.stopDemo();
            toastManager.addToast('Demo stopped', 'info');
        }
    }

    handleResetDemo() {
        if (window.demoManager) {
            window.demoManager.resetDemo();
            toastManager.addToast('Demo data cleared', 'info');
        }
    }

    render() {
        if (!window.demoManager || !window.demoManager.isDemoMode) {
            this.container.innerHTML = '';
            return;
        }

        const scenarios = window.demoManager.getScenarios();
        const activeScenario = window.demoManager.activeScenario;
        const isDemoRunning = window.demoManager.isDemoRunning;
        const isConnected = window.demoManager.isConnected();

        const scenarioCards = Object.values(scenarios).map(scenario => `
            <div class="border rounded-lg p-4 hover:shadow-md transition-shadow ${
                activeScenario === scenario.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
            }">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <h4 class="text-sm font-medium text-gray-900 mb-1">
                            ${scenario.name}
                        </h4>
                        <p class="text-xs text-gray-500 mb-3">
                            ${scenario.description}
                        </p>
                        ${activeScenario === scenario.id && isDemoRunning ? `
                            <div class="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                                <span class="w-1.5 h-1.5 bg-purple-400 rounded-full mr-1 animate-pulse"></span>
                                Active
                            </div>
                        ` : ''}
                    </div>
                    <button onclick="window.scenarioSelector.handleStartScenario('${scenario.id}')"
                            ${this.loading === scenario.id || !isConnected || isDemoRunning ? 'disabled' : ''}
                            class="ml-3 px-3 py-1 text-xs font-medium rounded ${
                                this.loading === scenario.id
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : activeScenario === scenario.id && isDemoRunning
                                    ? 'bg-purple-100 text-purple-600 cursor-not-allowed'
                                    : isConnected && !isDemoRunning
                                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }">
                        ${this.loading === scenario.id 
                            ? 'Starting...' 
                            : activeScenario === scenario.id && isDemoRunning 
                            ? 'Running' 
                            : 'Start'}
                    </button>
                </div>
            </div>
        `).join('');

        this.container.innerHTML = `
            <div class="bg-white shadow rounded-lg p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-medium text-gray-900">Demo Scenarios</h3>
                    <div class="flex space-x-2">
                        ${isDemoRunning ? `
                            <button onclick="window.scenarioSelector.handleStopDemo()"
                                    class="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded text-sm">
                                Stop Demo
                            </button>
                        ` : ''}
                        <button onclick="window.scenarioSelector.handleResetDemo()"
                                class="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-sm">
                            Reset
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${scenarioCards}
                </div>

                ${!isConnected ? `
                    <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p class="text-sm text-yellow-800">
                            ⚠️ WebSocket disconnected. Reconnect to start demo scenarios.
                        </p>
                    </div>
                ` : ''}
            </div>
        `;
    }
}