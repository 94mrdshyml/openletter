import type { Editor, Range } from '@tiptap/core';

export interface SlashCommandItem {
	title: string;
	description: string;
	keywords: string[];
	command: (ctx: { editor: Editor; range: Range }) => void;
}

// Shared with the fixed toolbar's own insert flows (onImagePick prop, window
// prompts for YouTube/tweet URLs) so a block inserted via "/" behaves
// identically to one inserted via the toolbar button.
export function buildSlashCommandItems(deps: {
	onImagePick: () => Promise<string | null>;
}): SlashCommandItem[] {
	return [
		{
			title: 'Heading 2',
			description: 'Medium section heading',
			keywords: ['h2', 'heading', 'subheading'],
			command: ({ editor, range }) =>
				editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run()
		},
		{
			title: 'Heading 3',
			description: 'Small section heading',
			keywords: ['h3', 'heading', 'subheading'],
			command: ({ editor, range }) =>
				editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run()
		},
		{
			title: 'Bullet list',
			description: 'Simple bulleted list',
			keywords: ['bullet', 'list', 'ul'],
			command: ({ editor, range }) =>
				editor.chain().focus().deleteRange(range).toggleBulletList().run()
		},
		{
			title: 'Numbered list',
			description: 'List with numbering',
			keywords: ['numbered', 'ordered', 'list', 'ol'],
			command: ({ editor, range }) =>
				editor.chain().focus().deleteRange(range).toggleOrderedList().run()
		},
		{
			title: 'Block quote',
			description: 'Capture a quote',
			keywords: ['quote', 'blockquote'],
			command: ({ editor, range }) =>
				editor.chain().focus().deleteRange(range).toggleBlockquote().run()
		},
		{
			title: 'Code block',
			description: 'Monospaced code, formatting preserved',
			keywords: ['code', 'codeblock', 'pre'],
			command: ({ editor, range }) =>
				editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
		},
		{
			title: 'Divider',
			description: 'Horizontal rule',
			keywords: ['divider', 'hr', 'rule', 'line', 'separator'],
			command: ({ editor, range }) =>
				editor.chain().focus().deleteRange(range).setHorizontalRule().run()
		},
		{
			title: 'Image',
			description: 'Upload an image',
			keywords: ['image', 'picture', 'photo', 'upload'],
			command: ({ editor, range }) => {
				editor.chain().focus().deleteRange(range).run();
				void deps.onImagePick().then((url) => {
					if (url) editor.chain().focus().setImage({ src: url }).run();
				});
			}
		},
		{
			title: 'YouTube',
			description: 'Embed a YouTube video',
			keywords: ['youtube', 'video', 'embed'],
			command: ({ editor, range }) => {
				editor.chain().focus().deleteRange(range).run();
				const url = window.prompt('YouTube URL');
				if (url) editor.commands.setYoutubeVideo({ src: url });
			}
		},
		{
			title: 'Tweet',
			description: 'Embed a tweet',
			keywords: ['tweet', 'twitter', 'x', 'embed'],
			command: ({ editor, range }) => {
				editor.chain().focus().deleteRange(range).run();
				const url = window.prompt('Tweet URL (twitter.com or x.com status link)');
				if (url) editor.commands.setTweet(url);
			}
		}
	];
}
