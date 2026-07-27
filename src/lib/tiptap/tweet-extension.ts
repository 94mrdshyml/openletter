import { Node, mergeAttributes, nodePasteRule } from '@tiptap/core';

// No official Tiptap extension for Twitter/X exists. renderHTML() produces
// the exact markup Twitter's own oEmbed API returns (a `.twitter-tweet`
// blockquote) — that's what gets saved in post.body, so the public post
// page just needs to load Twitter's widgets.js once and call
// `twttr.widgets.load()` (see (public)/p/[slug]/+page.svelte) — no server-
// side oEmbed fetch, no stored HTML fragment beyond this blockquote.
const TWEET_URL_REGEX = /https?:\/\/(www\.)?(twitter|x)\.com\/\w+\/status\/(\d+)\S*/g;

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		tweet: {
			setTweet: (url: string) => ReturnType;
		};
	}
}

export const Tweet = Node.create({
	name: 'tweet',
	group: 'block',
	atom: true,

	addAttributes() {
		return {
			url: { default: null }
		};
	},

	parseHTML() {
		return [{ tag: 'blockquote.twitter-tweet' }];
	},

	renderHTML({ node, HTMLAttributes }) {
		return [
			'blockquote',
			mergeAttributes(HTMLAttributes, { class: 'twitter-tweet' }),
			['a', { href: node.attrs.url }, node.attrs.url]
		];
	},

	addCommands() {
		return {
			setTweet:
				(url: string) =>
				({ commands }) =>
					commands.insertContent({ type: this.name, attrs: { url } })
		};
	},

	addPasteRules() {
		return [
			nodePasteRule({
				find: TWEET_URL_REGEX,
				type: this.type,
				getAttributes: (match) => ({ url: match[0] })
			})
		];
	},

	addNodeView() {
		return ({ node }) => {
			const dom = document.createElement('div');
			dom.className = 'tweet-embed-preview';
			dom.style.cssText =
				'border:1px solid var(--color-divider);padding:12px;font-size:13px;color:var(--color-neutral-600)';
			dom.textContent = `Tweet embed: ${node.attrs.url}`;
			return { dom };
		};
	}
});
