class MetricsCard {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.metrics = {
            totalViolations: 0,
            violationsToday: 0,
            highSeverityCount: 0,
            violationsPerHour: 0
        };
        this.init();
    }

    async init() {
        this.render();
        await this.calculateMetrics();
        this.setupWebSocketHandlers();
        this.startAutoRefresh();
    }

    setupWebSocketHandlers() {
        if (typeof window.appController === 'undefined') {
            setTimeout(() => this.setupWebSocketHandlers(), 100);
            return;
        }

        const webSocketManager = window.appController.getManager('webSocket');
        if (!webSocketManager) {
            setTimeout(() => this.setupWebSocketHandlers(), 100);
            return;
        }

        // Handle new violations for metrics updates
        webSocketManager.on('violation', (violation) => {
            // Update metrics when new violation arrives
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const violationDate = new Date(violation.timestamp);
            
            this.metrics.totalViolations += 1;
            if (violationDate >= today) {
                this.metrics.violationsToday += 1;
            }
            if (violation.severity === 'HIGH') {
                this.metrics.highSeverityCount += 1;
            }
            
            this.render();
        });

        // Handle initial violations
        webSocketManager.on('initial_violations', (violations) => {
            this.calculateMetricsFromData(violations);
        });
    }

    async calculateMetrics() {
        try {
            const response = await fetch('https://aigs-mvp.onrender.com/violations');
            const violations = await response.json();
            this.calculateMetricsFromData(violations);
        } catch (error) {
            console.error('Error calculating metrics:', error);
        }
    }

    calculateMetricsFromData(violations) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const violationsToday = violations.filter(v => 
            new Date(v.timestamp) >= today
        );
        
        const highSeverityCount = violations.filter(v => 
            v.severity === 'HIGH'
        ).length;
        
        const violationsPerHour = violationsToday.length > 0 ? 
            violationsToday.length / ((now - today) / (1000 * 60 * 60)) : 0;
            console.log('Violations today:', violationsToday.length);
            console.log('Hours elapsed:', (now - today) / (1000 * 60 * 60));
            console.log('Calculated per hour:', violationsPerHour);

        this.metrics = {
            totalViolations: violations.length,
            violationsToday: violationsToday.length,
            highSeverityCount,
            violationsPerHour: Math.round(violationsPerHour * 10) / 10
        };
        
        this.render();
    }

   startAutoRefresh() {
        setInterval(() => {
            const webSocketManager = window.appController?.getManager('webSocket');
            // Only refresh if WebSocket is not connected
            if (!webSocketManager || !webSocketManager.connected) {
                this.calculateMetrics();
            }
        }, 30000);
    }

    render() {
        const metricCards = [
            { 
                title: 'Total Violations', 
                value: this.metrics.totalViolations, 
                color: 'blue',
                icon: '📊'
            },
            { 
                title: 'Today', 
                value: this.metrics.violationsToday, 
                color: 'green',
                icon: '📅'
            },
            { 
                title: 'High Severity', 
                value: this.metrics.highSeverityCount, 
                color: 'red',
                icon: '⚠️'
            },
            { 
                title: 'Per Hour (Avg)', 
                value: this.metrics.violationsPerHour, 
                color: 'purple',
                icon: '⏱️'
            }
        ];

        const webSocketManager = window.appController?.getManager('webSocket');
        const isConnected = webSocketManager && webSocketManager.connected;

        const cardElements = metricCards.map(card => `
            <div class="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
                <div class="flex items-center">
                    <div class="flex-1">
                        <div class="flex items-center space-x-2">
                            <span class="text-lg">${card.icon}</span>
                            <p class="text-sm font-medium text-gray-600">${card.title}</p>
                        </div>
                        <p class="text-2xl font-semibold mt-2 text-${card.color}-600">
                            ${card.value}
                        </p>
                    </div>
                    ${isConnected ? `
                        <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    ` : `
                        <div class="w-2 h-2 bg-gray-400 rounded-full"></div>
                    `}
                </div>
            </div>
        `).join('');

        this.container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                ${cardElements}
            </div>
        `;
    }
}