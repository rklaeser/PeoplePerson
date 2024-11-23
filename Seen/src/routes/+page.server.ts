export async function load({ fetch }) {
	const res = await fetch('/api/people');
	if (!res.ok) {
	  throw new Error('Failed to fetch people');
	}
	const people = await res.json();
	return {
	  people
	};
  }