// No existing email validator to reuse — SubscribeForm/the `subscribe`
// action rely on HTML5 `type="email"` only, which an API request bypasses.
export function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
