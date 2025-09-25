class DemoControls {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.demoActive = false;
        this.loading = false;
        this.init();
    }

    init() {
        this.render();
        this.setupWebSocketHandlers();
    }

    setupWebSocketHandlers() {
        if (typeof webSocketManager === 'undefined') {
            setTimeout(() => this.setupWebSocketHandlers(), 100);
            return;
        }

        webSocketManager.on('demo_started', () => {
            this.demoActive = true;
            this.render();
            
            // Auto-disable demo indication after 30 seconds
            setTimeout(() => {
                this.demoActive = false;
                this.render();
            }, 30000);
        });
    }

    async startDemo() {
        if (!webSocketManager || !webSocketManager.connected) {
            toastManager.addToast('Cannot start demo - WebSocket not connected', 'error');
            return;
        }

        try {
            this.loading = true;
            this.render();
            
            const response = await fetch('https://aigs-mvp.onrender.com/demo/start', {
                method: 'POST'
            });
            
            if (response.ok) {
                toastManager.addToast('Demo mode started - Watch for simulated violations!', 'success');
            } else {
                throw new Error('Failed to start demo');
            }
        } catch (error) {
            toastManager.addToast('Failed to start demo mode', 'error');
            console.error('Demo start error:', error);
        } finally {
            this.loading = false;
            this.render();
        }
    }

    render() {
        const isConnected = webSocketManager && webSocketManager.connected;
        
        this.container.innerHTML = `
            <div class="bg-white shadow rounded-lg p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="text-sm font-medium text-gray-900">Demo Mode</h4>
                        <p class="text-xs text-gray-500">Trigger simulated violations</p>
                    </div>
                    <div class="flex items-center space-x-3">
                        ${this.demoActive ? `
                            <span class="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                                <span class="w-1.5 h-1.5 bg-purple-400 rounded-full mr-1 animate-pulse"></span>
                                Demo Active
                            </span>
                        ` : ''}
                        <button onclick="demoControls.startDemo()"
                                ${this.loading || !isConnected ? 'disabled' : ''}
                                class="${isConnected ? 
                                    'bg-purple-600 hover:bg-purple-700 text-white' : 
                                    'bg-gray-300 text-gray-500 cursor-not-allowed'
                                } px-4 py-2 text-sm font-medium rounded-md">
                            ${this.loading ? 'Starting...' : 'Start Demo'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}