const { validateUrl, isIpBlocked } = require('../../utils/urlValidator');

// Mock DNS lookup to return specified test values
jest.mock('dns', () => ({
    lookup: jest.fn().mockImplementation((hostname, callback) => {
        // These mappings simulate DNS resolution for test cases
        const ipMappings = {
            'public-site.com': '203.0.113.1',       // Public IP (TEST-NET-3 block)
            'internal-network.com': '192.168.1.1',  // Private IP
            'localhost-alias.com': '127.0.0.1',     // Loopback
            'aws-metadata.com': '169.254.169.254',  // AWS metadata service
            'ipv6-loopback.com': '::1',             // IPv6 loopback
        };

        const ip = ipMappings[hostname] || '8.8.8.8'; // Default to Google DNS if not found
        process.nextTick(() => {
            callback(null, { address: ip, family: ip.includes(':') ? 6 : 4 });
        });
    })
}));

describe('URL Validator', () => {
    describe('isIpBlocked', () => {
        test('should block private IPv4 addresses', () => {
            expect(isIpBlocked('192.168.1.1')).toBe(true);
            expect(isIpBlocked('10.0.0.1')).toBe(true);
            expect(isIpBlocked('172.16.0.1')).toBe(true);
        });

        test('should block loopback IPv4 addresses', () => {
            expect(isIpBlocked('127.0.0.1')).toBe(true);
            expect(isIpBlocked('127.0.1.1')).toBe(true);
        });

        test('should block link-local IPv4 addresses', () => {
            expect(isIpBlocked('169.254.169.254')).toBe(true); // AWS metadata
            expect(isIpBlocked('169.254.1.1')).toBe(true);
        });

        test('should block IPv6 loopback and private addresses', () => {
            expect(isIpBlocked('::1')).toBe(true);
            expect(isIpBlocked('fc00::1')).toBe(true);
            expect(isIpBlocked('fe80::1')).toBe(true);
        });

        test('should allow public IPv4 addresses', () => {
            expect(isIpBlocked('8.8.8.8')).toBe(false);
            expect(isIpBlocked('1.1.1.1')).toBe(false);
            expect(isIpBlocked('104.18.2.55')).toBe(false);
        });

        test('should allow public IPv6 addresses', () => {
            expect(isIpBlocked('2606:4700:4700::1111')).toBe(false);
            expect(isIpBlocked('2001:4860:4860::8844')).toBe(false);
        });
    });

    describe('validateUrl', () => {
        test('should reject non-HTTP/HTTPS protocols', async () => {
            const result = await validateUrl('ftp://example.com');
            expect(result.valid).toBe(false);
            expect(result.reason).toContain('Invalid protocol');

            const result2 = await validateUrl('file:///etc/passwd');
            expect(result2.valid).toBe(false);
            expect(result2.reason).toContain('Invalid protocol');
        });

        test('should reject URLs resolving to private IP ranges', async () => {
            const result = await validateUrl('http://internal-network.com');
            expect(result.valid).toBe(false);
            expect(result.reason).toContain('blocked IP address range');
        });

        test('should reject URLs resolving to localhost', async () => {
            const result = await validateUrl('http://localhost-alias.com');
            expect(result.valid).toBe(false);
            expect(result.reason).toContain('blocked IP address range');
        });

        test('should reject URLs resolving to AWS metadata service', async () => {
            const result = await validateUrl('http://aws-metadata.com');
            expect(result.valid).toBe(false);
            expect(result.reason).toContain('blocked IP address range');
        });

        test('should reject URLs resolving to IPv6 loopback', async () => {
            const result = await validateUrl('http://ipv6-loopback.com');
            expect(result.valid).toBe(false);
            expect(result.reason).toContain('blocked IP address range');
        });

        test('should allow URLs resolving to public IP addresses', async () => {
            const result = await validateUrl('https://public-site.com');
            expect(result.valid).toBe(true);
        });

        test('should handle invalid URLs gracefully', async () => {
            const result = await validateUrl('not-a-valid-url');
            expect(result.valid).toBe(false);
            expect(result.reason).toContain('URL validation error');
        });
    });
}); 