const request = require('supertest');
const express = require('express');
const axios = require('axios');
const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');

// Mock dependencies
jest.mock('axios');
jest.mock('@mozilla/readability');
jest.mock('../../utils/logger', () => ({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
}));

// Mock config
jest.mock('../../config/app', () => ({
    apiToken: 'test-token',
    axios: {
        timeout: 10000
    },
    rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 100
    }
}));

// Mock validateUrl function
jest.mock('../../utils/urlValidator', () => ({
    validateUrl: jest.fn()
}));

// Import modules that use the mocked dependencies
const { validateUrl } = require('../../utils/urlValidator');
const app = require('../../app'); // Create an app.js file to export the Express app for testing

describe('API Integration Tests', () => {
    const validToken = 'Bearer test-token';
    const mockHtml = `<!DOCTYPE html><html><body><h1>Test Article</h1><p>This is test content.</p></body></html>`;
    const mockArticle = {
        title: 'Test Article',
        content: '<h1>Test Article</h1><p>This is test content.</p>',
        textContent: 'Test Article This is test content.',
        length: 100,
        excerpt: 'This is test content.',
        siteName: 'Test Site',
        lang: 'en'
    };

    beforeEach(() => {
        // Reset mock implementations
        jest.clearAllMocks();

        // Mock Readability implementation
        Readability.mockImplementation(() => ({
            parse: () => mockArticle
        }));

        // Mock successful URL validation
        validateUrl.mockImplementation(() => Promise.resolve({ valid: true }));

        // Mock axios response
        axios.get.mockResolvedValue({
            data: mockHtml
        });
    });

    describe('POST /api/parse', () => {
        test('should return 401 when no token is provided', async () => {
            const response = await request(app)
                .post('/api/parse')
                .send({ url: 'https://example.com' });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeTruthy();
        });

        test('should return 403 when an invalid token is provided', async () => {
            const response = await request(app)
                .post('/api/parse')
                .set('Authorization', 'Bearer invalid-token')
                .send({ url: 'https://example.com' });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });

        test('should return 400 when no URL is provided', async () => {
            const response = await request(app)
                .post('/api/parse')
                .set('Authorization', validToken)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        test('should return 403 when URL validation fails', async () => {
            validateUrl.mockImplementation(() => Promise.resolve({
                valid: false,
                reason: 'URL resolves to private IP range'
            }));

            const response = await request(app)
                .post('/api/parse')
                .set('Authorization', validToken)
                .send({ url: 'https://internal-site.local' });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('URL resolves to private IP range');
        });

        test('should return 200 with parsed content for valid request', async () => {
            const response = await request(app)
                .post('/api/parse')
                .set('Authorization', validToken)
                .send({ url: 'https://example.com' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockArticle);
            expect(axios.get).toHaveBeenCalledWith('https://example.com', expect.anything());
        });

        test('should handle axios errors properly', async () => {
            axios.get.mockRejectedValue({
                response: {
                    status: 404,
                    statusText: 'Not Found'
                },
                config: { url: 'https://example.com/not-found' }
            });

            const response = await request(app)
                .post('/api/parse')
                .set('Authorization', validToken)
                .send({ url: 'https://example.com/not-found' });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Not Found');
        });
    });

    describe('POST /api/parse-html', () => {
        test('should return 401 when no token is provided', async () => {
            const response = await request(app)
                .post('/api/parse-html')
                .send({ html: mockHtml });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        test('should return 400 when no HTML is provided', async () => {
            const response = await request(app)
                .post('/api/parse-html')
                .set('Authorization', validToken)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        test('should return 200 with parsed content for valid HTML', async () => {
            const response = await request(app)
                .post('/api/parse-html')
                .set('Authorization', validToken)
                .send({ html: mockHtml });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockArticle);
        });

        test('should validate optional URL if provided', async () => {
            validateUrl.mockImplementation(() => Promise.resolve({
                valid: false,
                reason: 'URL resolves to private IP range'
            }));

            const response = await request(app)
                .post('/api/parse-html')
                .set('Authorization', validToken)
                .send({
                    html: mockHtml,
                    url: 'https://internal-site.local'
                });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(validateUrl).toHaveBeenCalledWith('https://internal-site.local');
        });
    });
}); 