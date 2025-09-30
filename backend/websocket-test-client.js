const WebSocket = require('ws');

class WebSocketTestClient {
    constructor() {
        this.ws = null;
        this.connected = false;
    }

    connect() {
        console.log('🔌 Connecting to AI agent backend...');
        
        this.ws = new WebSocket('ws://localhost:8081');

        this.ws.on('open', () => {
            console.log('✅ Connected to AI agent backend');
            this.connected = true;
            this.showMenu();
        });

        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('📨 Received:', message);
            } catch (error) {
                console.log('📨 Received (raw):', data.toString());
            }
        });

        this.ws.on('close', () => {
            console.log('🔌 Disconnected from AI agent backend');
            this.connected = false;
        });

        this.ws.on('error', (error) => {
            console.error('❌ WebSocket error:', error.message);
        });
    }

    sendCommand(command) {
        if (!this.connected) {
            console.log('❌ Not connected to agent backend');
            return;
        }

        console.log('📤 Sending command:', command);
        this.ws.send(JSON.stringify(command));
    }

    showMenu() {
        console.log('\n🎛️  Test Commands:');
        console.log('1. Start with authorized endpoints');
        console.log('2. Start with unauthorized endpoints');
        console.log('3. Start with mixed endpoints');
        console.log('4. Stop agent');
        console.log('5. Check status');
        console.log('6. Quit');
        console.log('\nType a number and press Enter:');
    }

    runInteractiveTest() {
        this.connect();

        // Simple command line interface
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.on('line', (input) => {
            const choice = input.trim();

            switch (choice) {
                case '1':
                    this.sendCommand({
                        type: 'start',
                        targets: ['httpbin.org/get', 'jsonplaceholder.typicode.com/posts/1']
                    });
                    break;
                case '2':
                    this.sendCommand({
                        type: 'start',
                        targets: ['api.github.com/user', 'api.stripe.com/v1/customers']
                    });
                    break;
                case '3':
                    this.sendCommand({
                        type: 'start',
                        targets: ['httpbin.org/get', 'api.github.com/user', 'jsonplaceholder.typicode.com/posts/1', 'api.stripe.com/v1/customers']
                    });
                    break;
                case '4':
                    this.sendCommand({ type: 'stop' });
                    break;
                case '5':
                    this.sendCommand({ type: 'ping' });
                    break;
                case '6':
                    console.log('👋 Goodbye!');
                    rl.close();
                    this.ws.close();
                    process.exit(0);
                    break;
                default:
                    console.log('❌ Invalid choice. Try again.');
                    this.showMenu();
            }
        });
    }
}

if (require.main === module) {
    const testClient = new WebSocketTestClient();
    testClient.runInteractiveTest();
}

module.exports = WebSocketTestClient;