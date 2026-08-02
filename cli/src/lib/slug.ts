// Cloudflare resource names (Worker, D1 database, R2 bucket) must be
// lowercase alphanumeric + hyphens, and Worker names are capped at 63 chars.
export function slugify(input: string): string {
	return (
		input
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 63) || 'openletter'
	);
}
