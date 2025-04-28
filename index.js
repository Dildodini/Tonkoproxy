
// Required Node.js modules
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Google Apps Script URL - to be set in environment variables
const TARGET_URL = process.env.TARGET_URL || 'https://script.google.com/macros/s/AKfycbzIXDT_TrHxtIvxpW6X8_jizBVl7lzYEB_NcR8rZqqLzXhz9aXRHTE9aJENJrdrL0MKWQ/exec';

// Initialize express
const app = express();

// Configure CORS - be more permissive to allow requests from any origin
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Handle preflight OPTIONS requests
app.options('*', cors());

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Parse JSON bodies
app.use(express.json());

// Handle GET requests (for data fetching)
app.get('/api', async (req, res) => {
  try {
    const action = req.query.action;
    if (!action) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing action parameter' 
      });
    }

    // Build target URL with query parameters
    const url = new URL(TARGET_URL);
    Object.keys(req.query).forEach(key => {
      url.searchParams.append(key, req.query[key]);
    });
    
    console.log(`Forwarding GET request to: ${url.toString()}`);
    
    // Fetch from Google Apps Script with explicit content type and timeout
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000 // 30 seconds timeout
    });
    
    if (!response.ok) {
      console.error(`Error response: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Success response for ${action}:`, data);
    return res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Proxy server error' 
    });
  }
});

// Handle POST requests (for data submission and file uploads)
app.post('/api', upload.array('files'), async (req, res) => {
  try {
    const action = req.query.action;
    if (!action) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing action parameter' 
      });
    }

    console.log(`Handling POST request for action: ${action}`);
    console.log('Request body:', req.body);
    console.log('Files:', req.files);
    
    // Create FormData for forwarding to Google Apps Script
    const formData = new FormData();
    formData.append('action', action);
    
    // Add any JSON data if provided
    if (req.body.data) {
      formData.append('data', req.body.data);
    }
    
    // Add any files if uploaded
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        // Create a file object from the buffer
        const blob = new Blob([file.buffer], { type: file.mimetype });
        formData.append(`file${index}`, blob, file.originalname);
      });
    }
    
    // Forward request to Google Apps Script
    const url = new URL(TARGET_URL);
    
    console.log(`Forwarding POST request to: ${url.toString()}`);
    
    const response = await fetch(url.toString(), {
      method: 'POST',
      body: formData,
      timeout: 30000 // 30 seconds timeout
    });
    
    if (!response.ok) {
      console.error(`Error response: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Success response for ${action}:`, data);
    return res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Proxy server error' 
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false, 
    error: err.message || 'Internal server error' 
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server is running on port ${PORT}`);
});

module.exports = app;
