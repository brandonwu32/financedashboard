#!/usr/bin/env node

/**
 * CLI Tool to approve/reject access requests
 * 
 * Usage:
 *   node approve-request.js user@example.com          (approve)
 *   node approve-request.js user@example.com reject   (reject)
 */

const https = require('https');

const email = process.argv[2];
const action = process.argv[3] || 'approve';

if (!email) {
  console.error('Usage: node approve-request.js <email> [approve|reject]');
  process.exit(1);
}

const approve = action !== 'reject';

const data = JSON.stringify({
  email: email,
  approve: approve
});

const options = {
  hostname: process.env.NEXTAUTH_URL?.replace(/^https?:\/\//, '') || 'localhost:3000',
  port: process.env.NEXTAUTH_URL?.startsWith('https') ? 443 : 3000,
  path: '/api/admin/approve-access',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let body = '';
  
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(body);
      if (res.statusCode === 200) {
        console.log(`✅ Success: ${response.message}`);
      } else {
        console.error(`❌ Error: ${response.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error('Failed to parse response:', body);
    }
  });
});

req.on('error', (error) => {
  console.error('Request failed:', error.message);
});

req.write(data);
req.end();
