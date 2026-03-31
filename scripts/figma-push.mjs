#!/usr/bin/env node

const token = process.env.FIGMA_ACCESS_TOKEN;
const fileKey = process.env.FIGMA_FILE_KEY;
const message = process.env.FIGMA_PUSH_MESSAGE || process.env.VERCEL_URL && `Auto sync update: https://${process.env.VERCEL_URL}`;
const x = Number(process.env.FIGMA_COMMENT_X || '0');
const y = Number(process.env.FIGMA_COMMENT_Y || '0');

if (!token || !fileKey) {
  console.error('Missing required env vars: FIGMA_ACCESS_TOKEN and FIGMA_FILE_KEY');
  process.exit(1);
}

if (!message) {
  console.error('Missing FIGMA_PUSH_MESSAGE (or set VERCEL_URL to auto-generate a message).');
  process.exit(1);
}

const url = `https://api.figma.com/v1/files/${fileKey}/comments`;
const res = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Figma-Token': token,
  },
  body: JSON.stringify({
    message,
    client_meta: {
      x,
      y,
    },
  }),
});

if (!res.ok) {
  console.error(`Figma comments API failed (${res.status}):`, await res.text());
  process.exit(1);
}

const payload = await res.json();
console.log('Posted update to Figma comment thread:', payload.id);
