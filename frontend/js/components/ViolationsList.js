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
        this.startAutoRefresh();
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

        const violationRows = this.violations.map(violation => `
            <tr class="hover:bg-gray-50">
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
                        <button onclick="violationsList.fetchViolations()" 
                                class="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded text-sm">
                            Refresh
                        </button>
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
                        <div class="text-center py-4 text-gray-500">No violations detected</div>
                    ` : ''}
                </div>
            </div>
        `;
    }
}