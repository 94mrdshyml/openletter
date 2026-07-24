// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { createAuth } from '$lib/server/auth';

type Auth = ReturnType<typeof createAuth>;
type Session = NonNullable<Awaited<ReturnType<Auth['api']['getSession']>>>;

declare global {
	namespace App {
		interface Platform {
			env: Env;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}

		// interface Error {}
		interface Locals {
			session: Session['session'] | null;
			user: Session['user'] | null;
		}
		// interface PageData {}
		// interface PageState {}
	}
}

export {};
