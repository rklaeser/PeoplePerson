import type { Handle } from '@sveltejs/kit';

// Custom handle for additional logic
const customHandle: Handle = async ({ event, resolve }) => {
	console.log(`[SERVER] ${event.request.method} ${event.url.pathname}`);

	// Filter out Chrome DevTools and favicon requests to reduce noise
	if (event.url.pathname.includes('/.well-known/') || event.url.pathname === '/favicon.ico') {
		return new Response(null, { status: 404 });
	}

	return resolve(event);
};

export const handle = customHandle;
