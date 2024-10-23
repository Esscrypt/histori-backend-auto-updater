const express = require('express');
const { exec } = require('child_process');
const crypto = require('crypto');
const getRawBody = require('raw-body');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const PORT = 3001;
const SECRET = process.env.GITHUB_WEBHOOK_SECRET; // Fetch the secret from .env file

// Middleware to capture the raw body for signature verification
// app.use((req, res, next) => {
//   getRawBody(req, {
//     encoding: 'utf-8',
//   }, (err, string) => {
//     if (err) {
//       return next(err);
//     }
//     req.rawBody = string;
//     next();
//   });
// });

app.use(
  bodyParser.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
    verify: (req, res, buf) => {
      req.rawBody = buf.toString(); // Attach the raw body for signature verification
    },
  })
);

app.post('/webhook', (req, res) => {
  const payload = req.body;

  console.log('Request body:', JSON.stringify(payload, null, 2));
  console.log('Payload ref:', payload.ref); // This should print the ref field


  // Verify the GitHub signature
  const receivedSignature = req.headers['x-hub-signature'];

  // If there's no signature, deny access
  if (!receivedSignature) {
    return res.status(400).send('Signature missing');
  }

  // Ensure rawBody exists before processing
  if (!req.rawBody) {
    console.error('Raw body is undefined.');
    return res.status(400).send('Raw body is missing.');
  }

  // Create HMAC to verify the payload
  const hmac = crypto.createHmac('sha1', SECRET);
  const generatedSignature = `sha1=${hmac.update(req.rawBody).digest('hex')}`;

  // Validate the received signature against the generated one
  if (receivedSignature !== generatedSignature) {
    console.error('Invalid signature:', receivedSignature, generatedSignature);
    return res.status(403).send('Forbidden: Invalid Signature');
  }

  // Check if it's a push event to the main branch
  if (payload.ref === "refs/heads/main") {
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Webhook listener running on port ${PORT}`);
});
