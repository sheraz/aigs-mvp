class ProxyTestAgent {
    constructor() {
        this.agentId = 'proxy-test-agent-' + Date.now();
        this.proxyUrl = 'http://localhost:8080/ai-proxy';
    }

    async makeRequest(targetDomain) {
        console.log(`🤖 Testing: ${targetDomain}`);
        
        try {
            const response = await fetch(`${this.proxyUrl}?target=${targetDomain}`, {
                method: 'GET',
                headers: {
                    'X-Agent-ID': this.agentId,
                    'X-Target-URL': targetDomain,
                    'User-Agent': `ProxyTestAgent/${this.agentId}`
                }
            });
            
            console.log(`📡 ${targetDomain} - Status: ${response.status}`);
            return response;
            
        } catch (error) {
            console.log(`❌ ${targetDomain} failed: ${error.message}`);
            return null;
        }
    }

    async runTest() {
        console.log(`\n🤖 PROXY TEST STARTING`);
        console.log(`Agent ID: ${this.agentId}\n`);

        console.log(`Testing AUTHORIZED endpoints:`);
        await this.makeRequest('httpbin.org/get');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await this.makeRequest('jsonplaceholder.typicode.com/posts/1');
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log(`\nTesting UNAUTHORIZED endpoints:`);
        await this.makeRequest('api.github.com/user');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await this.makeRequest('api.stripe.com/v1/customers');
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log(`\n✅ PROXY TEST COMPLETE`);
    }
}

if (require.main === module) {
    const agent = new ProxyTestAgent();
    agent.runTest();
}

module.exports = ProxyTestAgent;