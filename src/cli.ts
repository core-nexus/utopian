#!/usr/bin/env -S deno run --allow-read=. --allow-write=. --allow-net=127.0.0.1,api.openai.com,localhost:1234 --allow-env --allow-run=lms

// This is a simple alias to the main mod.ts entry point
// Kept for compatibility with existing imports
import '../mod.ts';
