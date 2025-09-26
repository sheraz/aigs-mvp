class DemoModeToggle {
    constructor(containerId) {
        // Connect to HTML container for the demo toggle switch
        console.log('DemoModeToggle constructor called');
        this.container = document.getElementById(containerId);
        console.log('Container found:', this.container);
        this.init();
    }

    init() {
        // Initialize component and set up demo event handlers
        this.render();
        this.setupDemoHandlers();
    }

    setupDemoHandlers() {
        // Wait for demo manager to be available before setting up handlers
        if (typeof window.demoManager === 'undefined') {
            setTimeout(() => this.setupDemoHandlers(), 100);
            return;
        }

        // Re-render when demo mode changes
        window.demoManager.on('demo_mode_changed', () => {
            this.render();
        });

        // Re-render when demo starts/stops
        window.demoManager.on('demo_started', () => {
            this.render();
        });

        window.demoManager.on('demo_stopped', () => {
            this.render();
        });
    }

    // Toggle demo mode on/off
    toggleDemoMode() {
        if (typeof window.demoManager !== 'undefined') {
            window.demoManager.toggleDemoMode();
        }
    }

    render() {
        // Get current demo state
        const isDemoMode = window.demoManager ? window.demoManager.isDemoMode : false;
        const isDemoRunning = window.demoManager ? window.demoManager.isDemoRunning : false;

        // Render toggle switch with current state
        this.container.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="flex items-center">
                    <!-- Toggle switch button -->
                    <button onclick="window.demoModeToggle.toggleDemoMode()"
                            class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                                isDemoMode ? 'bg-purple-600' : 'bg-gray-200'
                            }"
                            role="switch"
                            aria-checked="${isDemoMode}">
                        <span class="sr-only">Demo mode</span>
                        <!-- Switch slider -->
                        <span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isDemoMode ? 'translate-x-5' : 'translate-x-0'
                        }"></span>
                    </button>
                    <!-- Toggle label and status -->
                    <span class="ml-3 text-sm">
                        <span class="font-medium text-gray-900">Demo Mode</span>
                        ${isDemoMode ? `
                            <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                ${isDemoRunning ? `
                                    <span class="w-1.5 h-1.5 bg-purple-400 rounded-full mr-1 animate-pulse"></span>
                                    Running
                                ` : 'Ready'}
                            </span>
                        ` : ''}
                    </span>
                </div>
            </div>
        `;
    }
}