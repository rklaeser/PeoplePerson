import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  // Demo routes now use client-side store for data
  // Return empty data structure that will be populated by the store
  return {
    people: [],
    groups: [],
    isDemo: true
  };
};