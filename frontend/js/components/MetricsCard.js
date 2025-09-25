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
        this.startAutoRefresh();
    }

    async calculateMetrics() {
        try {
            const response = await fetch('https://aigs-mvp.onrender.com/violations');
            const violations = await response.json();
            
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

            this.metrics = {
                totalViolations: violations.length,
                violationsToday: violationsToday.length,
                highSeverityCount,
                violationsPerHour: Math.round(violationsPerHour * 10) / 10
            };
            
            this.render();
        } catch (error) {
            console.error('Error calculating metrics:', error);
        }
    }

    startAutoRefresh() {
        setInterval(() => this.calculateMetrics(), 30000);
    }

    render() {
        const metricCards = [
            { title: 'Total Violations', value: this.metrics.totalViolations, color: 'blue' },
            { title: 'Today', value: this.metrics.violationsToday, color: 'green' },
            { title: 'High Severity', value: this.metrics.highSeverityCount, color: 'red' },
            { title: 'Per Hour (Avg)', value: this.metrics.violationsPerHour, color: 'purple' }
        ];

        const cardElements = metricCards.map(card => `
            <div class="bg-white shadow rounded-lg p-6">
                <div class="flex items-center">
                    <div class="flex-1">
                        <p class="text-sm font-medium text-gray-600">${card.title}</p>
                        <p class="text-2xl font-semibold text-${card.color}-600">
                            ${card.value}
                        </p>
                    </div>
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