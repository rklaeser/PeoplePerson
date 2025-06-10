import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
  // Check Auth.js session only
  try {
    if (event.locals.auth) {
      const session = await event.locals.auth();
      if (session?.user?.id) {
        throw redirect(303, '/');
      }
    }
  } catch (e) {
    // Auth.js not available or error, continue to show signin page
  }
  
  // Not authenticated, show signin page
  return {};
};