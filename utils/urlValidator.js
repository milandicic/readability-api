const dns = require('dns');
const { promisify } = require('util');
const ipaddr = require('ipaddr.js');
const logger = require('./logger');

const dnsLookup = promisify(dns.lookup);

// List of private/reserved CIDR blocks to block
const BLOCKED_RANGES = [
    // Private IPv4 ranges
    '10.0.0.0/8',         // RFC1918 private network
    '172.16.0.0/12',      // RFC1918 private network
    '192.168.0.0/16',     // RFC1918 private network
    '127.0.0.0/8',        // Loopback
    '0.0.0.0/8',          // Current network
    '169.254.0.0/16',     // Link-local
    '192.0.2.0/24',       // TEST-NET
    '198.51.100.0/24',    // TEST-NET-2
    '203.0.113.0/24',     // TEST-NET-3
    '224.0.0.0/4',        // Multicast
    '240.0.0.0/4',        // Reserved for future use
    // IPv6 ranges
    '::1/128',            // Loopback
    'fc00::/7',           // Unique Local Addresses (ULA)
    'fe80::/10',          // Link-local
    'ff00::/8',           // Multicast
    '2001:db8::/32',      // Documentation
];

// Parse the CIDR blocks into ipaddr.js format for efficient checking
const parsedBlockedRanges = BLOCKED_RANGES.map(cidr => {
    const [range, bits] = cidr.split('/');
    return {
        range: ipaddr.parse(range),
        bits: parseInt(bits, 10)
    };
});

/**
 * Check if an IP address falls within any blocked range
 * @param {string} ip - IP address to check
 * @returns {boolean} - True if IP is in a blocked range
 */
const isIpBlocked = (ip) => {
    try {
        const addr = ipaddr.parse(ip);

        return parsedBlockedRanges.some(({ range, bits }) => {
            // Make sure we're comparing the same IP version (IPv4 or IPv6)
            if (addr.kind() !== range.kind()) return false;

            return addr.match(range, bits);
        });
    } catch (error) {
        // If we can't parse the IP, block it to be safe
        logger.error({
            msg: `Error parsing IP address`,
            ip,
            error: error.message
        });
        return true;
    }
};

/**
 * Validates a URL against SSRF vulnerabilities
 * @param {string} url - The URL to validate
 * @returns {Promise<{valid: boolean, reason?: string}>} - Validation result
 */
const validateUrl = async (url) => {
    try {
        const parsedUrl = new URL(url);

        // Reject non-HTTP/HTTPS protocols
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return {
                valid: false,
                reason: `Invalid protocol: ${parsedUrl.protocol}. Only HTTP and HTTPS are allowed.`
            };
        }

        // Check hostname
        const { address } = await dnsLookup(parsedUrl.hostname);

        if (isIpBlocked(address)) {
            return {
                valid: false,
                reason: 'URL resolves to a blocked IP address range'
            };
        }

        return { valid: true };
    } catch (error) {
        return {
            valid: false,
            reason: `URL validation error: ${error.message}`
        };
    }
};

module.exports = {
    validateUrl,
    isIpBlocked
}; 