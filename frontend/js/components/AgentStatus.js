class AgentStatus {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.agents = [];
        this.systemStatus = null;
        this.init();
    }

    async init() {
        this.render();
        await this.fetchSystemStatus();
        this.startAutoRefresh();
    }

    async fetchSystemStatus() {
        try {
            const response = await fetch('https://aigs-mvp.onrender.com/status');
            const data = await response.json();
            this.systemStatus = data;
            
            // Mock agent data for demo
            this.agents = [
                { id: 'financial-ai', name: 'Financial AI Assistant', status: 'active', lastSeen: new Date() },
                { id: 'hr-ai', name: 'HR AI Assistant', status: 'active', lastSeen: new Date() },
                { id: 'legal-ai', name: 'Legal AI Assistant', status: 'inactive', lastSeen: new Date(Date.now() - 3600000) }
            ];
            
            this.render();
        } catch (error) {
            console.error('Error fetching status:', error);
        }
    }

    startAutoRefresh() {
        setInterval(() => this.fetchSystemStatus(), 30000);
    }

    render() {
        const agentItems = this.agents.map(agent => `
            <div class="flex items-center justify-between p-3 border rounded-lg">
                <div class="flex items-center">
                    <div class="w-2 h-2 rounded-full mr-3 ${agent.status === 'active' ? 'bg-green-400' : 'bg-gray-400'}"></div>
                    <div>
                        <div class="text-sm font-medium text-gray-900">${agent.name}</div>
                        <div class="text-xs text-gray-500">${agent.id}</div>
                    </div>
                </div>
                <div class="text-xs text-gray-500">
                    ${agent.status === 'active' ? 'Active now' : `Last seen: ${agent.lastSeen.toLocaleTimeString()}`}
                </div>
            </div>
        `).join('');

        this.container.innerHTML = `
            <div class="bg-white shadow rounded-lg">
                <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Agent Status</h3>
                    
                    <!-- System Status -->
                    <div class="mb-6">
                        <div class="flex items-center">
                            <div class="w-3 h-3 rounded-full mr-2 ${
                                this.systemStatus?.status === 'running' ? 'bg-green-400' : 'bg-red-400'
                            }"></div>
                            <span class="text-sm font-medium">
                                System: ${this.systemStatus?.status || 'Unknown'}
                            </span>
                        </div>
                        <div class="text-xs text-gray-500 mt-1">
                            Connected clients: ${this.systemStatus?.connectedClients || 0}
                        </div>
                    </div>

                    <!-- Agent List -->
                    <div class="space-y-3">
                        ${agentItems}
                    </div>
                </div>
            </div>
        `;
    }
}