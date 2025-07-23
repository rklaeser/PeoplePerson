// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: { token: string } | null;
		}
		interface PageData {
			session: { token: string } | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
