class AIControlInterface {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.agentRunning = false;
        this.agentId = null;

        this.initializeElements();
        this.connectToBackend();
        this.setupEventListeners();
    }

    initializeElements() {
        this.connectionStatus = document.getElementById('connectionStatus');
        this.agentInfo = document.getElementById('agentInfo');
        this.agentIdSpan = document.getElementById('agentId');
        this.agentStatusSpan = document.getElementById('agentStatus');
        this.connectedClientsSpan = document.getElementById('connectedClients');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.testConnectionBtn = document.getElementById('testConnectionBtn');
        this.clearLogsBtn = document.getElementById('clearLogsBtn');
        this.logArea = document.getElementById('logArea');
    }

    connectToBackend() {
        this.log('Attempting to connect to AI agent backend...', 'info');

        let retryCount = 0;
        const maxRetries = 5;
        const retryDelay = 3000; // 3 seconds

        const connectWithRetry = () => {
            this.ws = new WebSocket('ws://localhost:8081');

            this.ws.onopen = () => {
                this.connected = true;
                this.connectionStatus.textContent = 'Connected to AI Agent Backend';
                this.connectionStatus.className = 'status connected';
                this.updateButtons();
                this.log('Connected to AI agent backend successfully', 'success');
                retryCount = 0; // Reset retry count on successful connection
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleBackendMessage(message);
                } catch (error) {
                    this.log(`Error parsing message: ${error.message}`, 'error');
                }
            };

            this.ws.onclose = () => {
                this.connected = false;
                this.connectionStatus.textContent = 'Disconnected from AI Agent Backend';
                this.connectionStatus.className = 'status disconnected';
                this.agentInfo.style.display = 'none';
                this.updateButtons();
                this.log('Disconnected from AI agent backend', 'warning');

                // Attempt to reconnect if not exceeding max retries
                if (retryCount < maxRetries) {
                    retryCount++;
                    this.log(`Attempting to reconnect (${retryCount}/${maxRetries})...`, 'info');
                    setTimeout(connectWithRetry, retryDelay);
                } else {
                    this.log(`Max reconnection attempts (${maxRetries}) reached. Please check the backend.`, 'error');
                }
            };

            this.ws.onerror = (error) => {
                this.log(`WebSocket error: ${error.message || 'Connection failed'}`, 'error');
            };
        };

        connectWithRetry(); // Initial connection attempt
    }

    handleBackendMessage(message) {
        switch (message.type) {
            case 'status':
                this.updateAgentInfo(message);
                break;
            case 'started':
                this.agentRunning = true;
                this.updateAgentStatus();
                this.log(`AI agent started with targets: ${message.targets.join(', ')}`, 'success');
                break;
            case 'stopped':
                this.agentRunning = false;
                this.updateAgentStatus();
                this.log('AI agent stopped', 'warning');
                break;
            case 'request_starting':
                this.log(`Making request to: ${message.target}`, 'info');
                break;
            case 'request_completed':
                const status = message.result.success ? 'success' : 'error';
                this.log(`Request to ${message.result.target} completed - Status: ${message.result.status}`, status);
                break;
            case 'request_failed':
                this.log(`Request to ${message.target} failed: ${message.error}`, 'error');
                break;
            case 'targets_updated':
                this.log(`Agent targets updated: ${message.targets.join(', ')}`, 'info');
                break;
            case 'error':
                this.log(`Agent error: ${message.message}`, 'error');
                break;
            case 'pong':
                this.log('Connection test successful', 'success');
                break;
            default:
                this.log(`Unknown message type: ${message.type}`, 'warning');
        }
    }

    updateAgentInfo(info) {
        this.agentId = info.agentId;
        this.agentRunning = info.running;

        this.agentIdSpan.textContent = info.agentId;
        this.connectedClientsSpan.textContent = info.connectedClients || 1;
        this.agentInfo.style.display = 'block';

        this.updateAgentStatus();
    }

    updateAgentStatus() {
        const status = this.agentRunning ? 'Running' : 'Stopped';
        this.agentStatusSpan.textContent = status;

        if (this.agentRunning) {
            this.connectionStatus.textContent = 'AI Agent Running';
            this.connectionStatus.className = 'status running';
        } else if (this.connected) {
            this.connectionStatus.textContent = 'Connected to AI Agent Backend';
            this.connectionStatus.className = 'status connected';
        }

        this.updateButtons();
    }

    updateButtons() {
        this.startBtn.disabled = !this.connected || this.agentRunning;
        this.stopBtn.disabled = !this.connected || !this.agentRunning;
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startAgent());
        this.stopBtn.addEventListener('click', () => this.stopAgent());
        this.testConnectionBtn.addEventListener('click', () => this.testConnection());
        this.clearLogsBtn.addEventListener('click', () => this.clearLogs());

        // Select All checkboxes
        document.getElementById('selectAllAuthorized').addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.authorized input[type="checkbox"]:not(.select-all)');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
        });

        document.getElementById('selectAllUnauthorized').addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.unauthorized input[type="checkbox"]:not(.select-all)');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
        });

        // Log filtering
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => this.filterLogs(btn.dataset.filter));
        });
    }

    getSelectedEndpoints() {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked:not(.select-all)');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    startAgent() {
        if (!this.connected) {
            this.log('Cannot start agent: not connected to backend', 'error');
            return;
        }

        const selectedEndpoints = this.getSelectedEndpoints();
        if (selectedEndpoints.length === 0) {
            this.log('Cannot start agent: no endpoints selected', 'error');
            alert('Please select at least one endpoint to test');
            return;
        }

        this.log(`Starting agent with ${selectedEndpoints.length} endpoints...`, 'info');
        const command = {
            type: 'start',
            targets: selectedEndpoints
        };
        this.sendCommand(command);
    }

    stopAgent() {
        if (!this.connected) {
            this.log('Cannot stop agent: not connected to backend', 'error');
            return;
        }

        this.log('Stopping agent...', 'info');
        const command = {
            type: 'stop'
        };
        this.sendCommand(command);
    }

    testConnection() {
        if (!this.connected) {
            this.log('Cannot test connection: not connected to backend', 'error');
            return;
        }

        this.log('Testing WebSocket connection...', 'info');
        this.ws.send(JSON.stringify({ type: 'ping' }));
    }

    clearLogs() {
        this.logArea.innerHTML = '';
        this.log('[SYSTEM] Logs cleared', 'info');
    }

    filterLogs(filter) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.filter-btn[data-filter="${filter}"]`).classList.add('active');

        const logEntries = document.querySelectorAll('.log-entry');
        logEntries.forEach(entry => {
            if (filter === 'all') {
                entry.style.display = 'block';
            } else {
                entry.style.display = entry.classList.contains(`log-${filter}`) ? 'block' : 'none';
            }
        });
    }

    sendCommand(command) {
        if (!this.connected || !this.ws) {
            this.log('Cannot send command: not connected', 'error');
            return;
        }

        try {
            this.ws.send(JSON.stringify(command));
            this.log(`Command sent: ${command.type}`, 'info');
        } catch (error) {
            this.log(`Failed to send command: ${error.message}`, 'error');
        }
    }

    log(message, type = 'info') {
        const now = new Date();
        const timestamp = now.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        logEntry.innerHTML = `<span class="log-timestamp">[${timestamp}]</span> ${message}`;

        this.logArea.appendChild(logEntry);
        this.logArea.scrollTop = this.logArea.scrollHeight;

        // Keep only last 100 log entries
        while (this.logArea.children.length > 100) {
            this.logArea.removeChild(this.logArea.firstChild);
        }
    }
}

// Initialize the interface when page loads
document.addEventListener('DOMContentLoaded', () => {
    new AIControlInterface();
});
