class ViolationsList {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.violations = [];
        this.loading = true;
        this.error = null;
        this.init();
    }

    async init() {
        this.render();
        await this.fetchViolations();
        this.setupWebSocketHandlers();
        this.startAutoRefresh();
    }

    setupWebSocketHandlers() {
        // Wait for WebSocket manager to be available
        if (typeof webSocketManager === 'undefined') {
            setTimeout(() => this.setupWebSocketHandlers(), 100);
            return;
        }

        // Handle new violations
        webSocketManager.on('violation', (violation) => {
            console.log('ViolationsList received new violation:', violation);
            
            // Add to the top of the list
            this.violations.unshift(violation);
            this.render();
            
            // Show toast notification
            toastManager.addToast(
                `New ${violation.severity} violation: ${violation.agent_name || violation.agent_id}`,
                violation.severity === 'HIGH' ? 'error' : 
                violation.severity === 'MEDIUM' ? 'warning' : 'info',
                8000
            );
        });

        // Handle initial violations data when connecting
        webSocketManager.on('initial_violations', (initialViolations) => {
            console.log('ViolationsList received initial violations:', initialViolations);
            this.violations = initialViolations;
            this.render();
        });

        // Handle demo mode events
        webSocketManager.on('demo_started', () => {
            toastManager.addToast('Demo mode activated - Simulated violations incoming', 'info', 5000);
        });
    }

    async fetchViolations() {
        try {
            this.loading = true;
            this.error = null;
            this.render();
            
            const response = await fetch('https://aigs-mvp.onrender.com/violations');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.violations = Array.isArray(data) ? data : [];
            this.loading = false;
            this.render();
        } catch (error) {
            console.error('Error fetching violations:', error);
            this.error = error.message;
            this.loading = false;
            this.render();
        }
    }

    startAutoRefresh() {
        setInterval(() => this.fetchViolations(), 30000);
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInMinutes = Math.floor((now - time) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hr ago`;
        return `${Math.floor(diffInMinutes / 1440)} day ago`;
    }

    getSeverityClass(severity) {
        switch(severity) {
            case 'HIGH': return 'bg-red-100 text-red-800';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-green-100 text-green-800';
        }
    }

    render() {
        if (this.error) {
            this.container.innerHTML = `
                <div class="bg-white shadow rounded-lg p-6">
                    <div class="text-red-600">
                        Error loading violations: ${this.error}
                        <button onclick="violationsList.fetchViolations()" 
                                class="ml-4 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm">
                            Retry
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        if (this.loading) {
            this.container.innerHTML = `
                <div class="bg-white shadow rounded-lg p-6">
                    Loading violations...
                </div>
            `;
            return;
        }

        const isConnected = webSocketManager && webSocketManager.connected;
        
        const violationRows = this.violations.map((violation, index) => `
            <tr class="hover:bg-gray-50 ${index === 0 ? 'animate-pulse bg-blue-50' : ''}">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">
                        ${violation.agent_name || violation.agent_id}
                    </div>
                    <div class="text-xs text-gray-500">
                        ID: ${violation.agent_id}
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">${violation.action_type}</div>
                    ${violation.reason ? `<div class="text-xs text-gray-500 mt-1">${violation.reason}</div>` : ''}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${this.getSeverityClass(violation.severity)}">
                        ${violation.severity}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">
                        ${new Date(violation.timestamp).toLocaleString()}
                    </div>
                    <div class="text-xs text-gray-500">
                        ${this.getTimeAgo(violation.timestamp)}
                    </div>
                </td>
            </tr>
        `).join('');

        this.container.innerHTML = `
            <div class="bg-white shadow rounded-lg">
                <div class="px-4 py-5 sm:p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-medium text-gray-900">Recent Violations</h3>
                        <div class="flex space-x-2">
                            ${isConnected ? `
                                <span class="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                    <span class="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                                    Live
                                </span>
                            ` : ''}
                            <button onclick="violationsList.fetchViolations()"
                                    class="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded text-sm">
                                Refresh
                            </button>
                        </div>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${violationRows}
                            </tbody>
                        </table>
                    </div>
                    
                    ${this.violations.length === 0 ? `
                        <div class="text-center py-8">
                            <div class="text-gray-500 text-lg">No violations detected</div>
                            <div class="text-sm text-gray-400 mt-2">
                                ${isConnected ? 
                                  'Monitoring active - violations will appear here in real-time' : 
                                  'Connect to start monitoring'}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
}