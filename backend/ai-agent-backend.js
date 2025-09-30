const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const config = require('./agent-config');

class ControllableAIAgent {
    constructor() {
        this.agentId = 'controllable-agent-' + Date.now();
        this.agentName = config.agentName;
        this.proxyUrl = config.proxyUrl;
        this.isRunning = false;
        this.currentTargets = [];
        this.intervalId = null;
        this.requestInterval = config.defaultRequestInterval;
        
        // WebSocket server for receiving commands
        this.wss = new WebSocket.Server({ port: config.wsPort });
        this.connectedClients = new Set();
        
        this.setupWebSocketServer();
        this.setupHttpServer();
    }

    setupWebSocketServer() {
        this.wss.on('connection', (ws) => {
            console.log('🔗 Frontend connected to AI agent backend');
            this.connectedClients.add(ws);
            
            // Send agent status on connection
            ws.send(JSON.stringify({
                type: 'status',
                agentId: this.agentId,
                running: this.isRunning,
                targets: this.currentTargets,
                interval: this.requestInterval
            }));

            ws.on('message', (message) => {
                try {
                    const command = JSON.parse(message.toString());
                    this.handleCommand(command, ws);
                } catch (error) {
                    console.error('Invalid command received:', error.message);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid command format'
                    }));
                }
            });

            ws.on('close', () => {
                console.log('🔌 Frontend disconnected from AI agent backend');
                this.connectedClients.delete(ws);
            });
        });

        console.log(`🎛️  AI Agent WebSocket server running on port ${config.wsPort}`);
    }

    setupHttpServer() {
        const app = express();
        app.use(cors());
        app.use(express.json());

        app.get('/status', (req, res) => {
            res.json({
                agentId: this.agentId,
                running: this.isRunning,
                targets: this.currentTargets,
                interval: this.requestInterval,
                connectedClients: this.connectedClients.size,
                timestamp: new Date().toISOString()
            });
        });

        app.listen(config.httpPort, () => {
            console.log(`📊 AI Agent HTTP server running on port ${config.httpPort}`);
        });
    }

    broadcastToClients(message) {
        const messageStr = JSON.stringify(message);
        this.connectedClients.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(messageStr);
            }
        });
    }

    handleCommand(command, ws) {
        console.log('📥 Command received:', command.type);

        switch (command.type) {
            case 'start':
                this.startAgent(command.targets || [], command.interval);
                break;
            case 'stop':
                this.stopAgent();
                break;
            case 'set_targets':
                this.setTargets(command.targets || []);
                break;
            case 'set_interval':
                this.setRequestInterval(command.interval);
                break;
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
                break;
            default:
                ws.send(JSON.stringify({
                    type: 'error',
                    message: `Unknown command: ${command.type}`
                }));
        }
    }

    setTargets(targets) {
        this.currentTargets = targets;
        console.log('🎯 Targets updated:', targets);
        
        this.broadcastToClients({
            type: 'targets_updated',
            targets: this.currentTargets
        });
    }

    setRequestInterval(interval) {
        if (interval && interval > 0) {
            this.requestInterval = interval;
            console.log(`⏱️  Request interval updated: ${interval}ms`);
            
            this.broadcastToClients({
                type: 'interval_updated',
                interval: this.requestInterval
            });
            
            // If agent is running, restart with new interval
            if (this.isRunning) {
                this.stopAgent();
                this.startAgent(this.currentTargets, interval);
            }
        }
    }

    startAgent(targets = null, interval = null) {
        if (this.isRunning) {
            console.log('⚠️  Agent already running');
            return;
        }

        if (targets) {
            this.currentTargets = targets;
        }

        if (interval) {
            this.requestInterval = interval;
        }

        if (this.currentTargets.length === 0) {
            console.log('❌ No targets specified');
            this.broadcastToClients({
                type: 'error',
                message: 'No targets specified'
            });
            return;
        }

        this.isRunning = true;
        console.log(`🚀 Starting AI agent with ${this.currentTargets.length} targets at ${this.requestInterval}ms interval`);

        this.broadcastToClients({
            type: 'started',
            agentId: this.agentId,
            targets: this.currentTargets,
            interval: this.requestInterval,
            timestamp: new Date().toISOString()
        });

        // Start making requests to targets continuously
        this.runContinuousRequests();
    }

    stopAgent() {
        if (!this.isRunning) {
            console.log('⚠️  Agent not running');
            return;
        }

        this.isRunning = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        console.log('🛑 AI agent stopped');

        this.broadcastToClients({
            type: 'stopped',
            agentId: this.agentId,
            timestamp: new Date().toISOString()
        });
    }

    async runContinuousRequests() {
        let targetIndex = 0;

        this.intervalId = setInterval(async () => {
            if (!this.isRunning || this.currentTargets.length === 0) {
                return;
            }

            const target = this.currentTargets[targetIndex];
            await this.makeMonitoredRequest(target);
            
            // Move to next target (round-robin)
            targetIndex = (targetIndex + 1) % this.currentTargets.length;
        }, this.requestInterval);
    }

    async makeMonitoredRequest(targetDomain) {
        const requestTimestamp = new Date().toISOString();
        
        this.broadcastToClients({
            type: 'request_starting',
            target: targetDomain,
            agentId: this.agentId,
            timestamp: requestTimestamp
        });

        console.log(`🌐 Making request to: ${targetDomain}`);

        try {
            const response = await fetch(`${this.proxyUrl}?target=${targetDomain}`, {
                method: 'GET',
                headers: {
                    'X-Agent-ID': this.agentId,
                    'X-Target-URL': targetDomain,
                    'User-Agent': `${this.agentName}/${this.agentId}`
                }
            });

            const result = {
                target: targetDomain,
                status: response.status,
                success: response.ok,
                timestamp: requestTimestamp,
                responseTime: Date.now() - new Date(requestTimestamp).getTime()
            };

            console.log(`📡 ${targetDomain} - Status: ${response.status}`);

            this.broadcastToClients({
                type: 'request_completed',
                agentId: this.agentId,
                result: result
            });

            return result;

        } catch (error) {
            console.log(`❌ ${targetDomain} failed: ${error.message}`);

            this.broadcastToClients({
                type: 'request_failed',
                agentId: this.agentId,
                target: targetDomain,
                error: error.message,
                timestamp: requestTimestamp
            });

            return null;
        }
    }
}

// Start the controllable AI agent
if (require.main === module) {
    console.log('🤖 Starting Controllable AI Agent Backend...');
    const agent = new ControllableAIAgent();
    
    console.log(`Agent ID: ${agent.agentId}`);
    console.log(`Ready to receive commands via WebSocket on port ${config.wsPort}`);
    console.log(`HTTP status available on port ${config.httpPort}`);
    console.log(`Default request interval: ${config.defaultRequestInterval}ms`);
}

module.exports = ControllableAIAgent;