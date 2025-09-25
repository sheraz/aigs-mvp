class WebSocketManager {
    constructor(url) {
        this.url = url;
        this.socket = null;
        this.connected = false;
        this.connectionError = null;
        this.reconnectTimeout = null;
        this.eventHandlers = {};
        
        this.init();
    }

    init() {
        try {
            this.socket = io(this.url, {
                transports: ['websocket', 'polling'],
                timeout: 10000,
                reconnectionAttempts: 5,
                reconnectionDelay: 2000
            });

            // Connection successful
            this.socket.on('connect', () => {
                console.log('WebSocket connected');
                this.connected = true;
                this.connectionError = null;
                
                // Clear any pending reconnection attempts
                if (this.reconnectTimeout) {
                    clearTimeout(this.reconnectTimeout);
                    this.reconnectTimeout = null;
                }

                // Update connection status in UI
                this.updateConnectionStatus();
                
                // Trigger connect handlers
                this.triggerEvent('connect');
            });

            // Connection failed
            this.socket.on('connect_error', (error) => {
                console.error('WebSocket connection error:', error);
                this.connected = false;
                this.connectionError = error.message;
                this.updateConnectionStatus();
                this.triggerEvent('connect_error', error);
            });

            // Disconnected
            this.socket.on('disconnect', (reason) => {
                console.log('WebSocket disconnected:', reason);
                this.connected = false;
                this.updateConnectionStatus();
                
                // Attempt manual reconnection after delay
                if (reason !== 'io client disconnect') {
                    this.reconnectTimeout = setTimeout(() => {
                        console.log('Attempting to reconnect...');
                        this.socket?.connect();
                    }, 3000);
                }
                
                this.triggerEvent('disconnect', reason);
            });

            // Handle violation events
            this.socket.on('violation', (violation) => {
                console.log('New violation received:', violation);
                this.triggerEvent('violation', violation);
            });

            // Handle demo events
            this.socket.on('demo_started', () => {
                console.log('Demo started');
                this.triggerEvent('demo_started');
            });

            // Handle initial violations
            this.socket.on('initial_violations', (violations) => {
                console.log('Initial violations received:', violations);
                this.triggerEvent('initial_violations', violations);
            });

        } catch (error) {
            console.error('Failed to initialize socket:', error);
            this.connectionError = error.message;
            this.updateConnectionStatus();
        }
    }

    // Register event handler
    on(event, callback) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(callback);
    }

    // Remove event handler
    off(event, callback) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event] = this.eventHandlers[event].filter(cb => cb !== callback);
        }
    }

    // Trigger event handlers
    triggerEvent(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(callback => callback(data));
        }
    }

    // Emit event to server
    emit(event, data) {
        if (this.socket && this.connected) {
            this.socket.emit(event, data);
            return true;
        }
        return false;
    }

    // Update connection status in UI
    updateConnectionStatus() {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            if (this.connected) {
                statusElement.innerHTML = `
                    <div class="flex items-center space-x-2 text-sm">
                        <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                        <span class="text-green-600">Connected</span>
                        <span class="text-gray-500">• Live monitoring active</span>
                    </div>
                `;
            } else {
                statusElement.innerHTML = `
                    <div class="flex items-center space-x-2 text-sm">
                        <div class="w-2 h-2 rounded-full bg-red-400"></div>
                        <span class="text-red-600">
                            ${this.connectionError ? `Error: ${this.connectionError}` : 'Disconnected'}
                        </span>
                    </div>
                `;
            }
        }
    }

    // Cleanup
    disconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}