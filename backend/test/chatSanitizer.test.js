const assert = require('node:assert/strict');
const { sanitizeAssistantText } = require('../src/routes/chat');

const input = `Here is **your** plan

- First step
- Second step
| some |
### Title
---

This is easy to read.`;

const expected = `Here is your plan
First step
Second step
some
Title

This is easy to read.`;

assert.equal(sanitizeAssistantText(input), expected, 'Assistant text should strip markdown noise and keep readable prose');
console.log('chat sanitizer test passed');
