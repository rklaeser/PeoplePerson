import { handle as authHandle } from './auth';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

// Custom handle for additional logic
const customHandle: Handle = async ({ event, resolve }) => {
  // Filter out Chrome DevTools and favicon requests to reduce noise
  if (event.url.pathname.includes('/.well-known/') || 
      event.url.pathname === '/favicon.ico') {
    return new Response(null, { status: 404 });
  }
  
  return resolve(event);
};

// Conditional auth handle that skips auth processing for certain routes
const conditionalAuthHandle: Handle = async ({ event, resolve }) => {
  // Skip Auth.js processing for signin and demo pages
  if (event.url.pathname === '/auth/signin' || 
      event.url.pathname.startsWith('/demo')) {
    return resolve(event);
  }
  
  // Use Auth.js for all other routes
  return authHandle({ event, resolve });
};

// Combine custom handle with conditional auth handle
export const handle = sequence(customHandle, conditionalAuthHandle);