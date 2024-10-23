const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const crypto = require('crypto');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const PORT = 3001;
const SECRET = process.env.GITHUB_WEBHOOK_SECRET; // Fetch the secret from .env file

// Middleware for parsing raw body and JSON
app.use(
  bodyParser.json({
    verify: (req, res, buf, encoding) => {
      // Store rawBody in the request object
      req.rawBody = buf.toString(encoding || 'utf-8');
    },
  })
);

app.post('/webhook', (req, res) => {
  const payload = req.body;

  // Verify the GitHub signature
  const receivedSignature = req.headers['x-hub-signature'];

  // If there's no signature, deny access
  if (!receivedSignature) {
    return res.status(400).send('Signature missing');
  }

  // Create HMAC to verify the payload
  const hmac = crypto.createHmac('sha1', SECRET);
  const generatedSignature = `sha1=${hmac.update(req.rawBody).digest('hex')}`;

  // Validate the received signature against the generated one
  if (receivedSignature !== generatedSignature) {
    return res.status(403).send('Forbidden: Invalid Signature');
  }

  // Check if it's a push event to the main branch
  if (payload.ref === 'refs/heads/main') {
    console.log('Changes pushed to the main branch. Pulling latest changes and restarting service...');

    // Send back a status 200 before executing the command
    res.status(200).send('Processing webhook...');

    exec(
      'cd /root/histori-backend && /usr/bin/git pull && /usr/bin/npm install && /usr/bin/npm run build && /bin/systemctl restart histori-backend.service',
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error pulling changes or restarting service: ${error.message}`);
          return;
        }

        console.log(`Git Pull Output: ${stdout}`);
        console.error(`Git Pull Error: ${stderr}`);
      }
    );
  } else {
    res.status(200).send('No changes made');
  }
});

app.listen(PORT, () => {
  console.log(`Webhook listener running on port ${PORT}`);
});