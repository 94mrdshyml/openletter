<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Link from '@tiptap/extension-link';
	import Image from '@tiptap/extension-image';
	import Placeholder from '@tiptap/extension-placeholder';
	import Youtube from '@tiptap/extension-youtube';
	import { Tweet } from '$lib/tiptap/tweet-extension';
	import { createSlashCommand } from '$lib/tiptap/slash-command.svelte';
	import { buildSlashCommandItems } from '$lib/tiptap/slash-items';
	import BubbleMenu from './BubbleMenu.svelte';
	import BoldIcon from './icons/BoldIcon.svelte';
	import ItalicIcon from './icons/ItalicIcon.svelte';
	import LinkIcon from './icons/LinkIcon.svelte';
	import HeadingIcon from './icons/HeadingIcon.svelte';
	import ImageIcon from './icons/ImageIcon.svelte';
	import BlockquoteIcon from './icons/BlockquoteIcon.svelte';
	import YoutubeIcon from './icons/YoutubeIcon.svelte';
	import TwitterIcon from './icons/TwitterIcon.svelte';

	let {
		content = '',
		placeholder = 'Tell your story…',
		onImagePick,
		onChange
	}: {
		content?: string;
		placeholder?: string;
		onImagePick: () => Promise<string | null>;
		onChange: (html: string) => void;
	} = $props();

	let element: HTMLDivElement;
	let editor: Editor | null = null;
	// Tiptap's Editor instance is a plain mutable class, not reactive to
	// Svelte's runes — this tracks just the toolbar's active/inactive state,
	// updated from Tiptap's own transaction hook, so clicking a toolbar
	// button doesn't force the whole toolbar to re-render (unlike keying the
	// block on every keystroke, which would also thrash focus/hover state).
	let active = $state({ bold: false, italic: false, link: false, heading: false, quote: false });

	// Floating selection toolbar (Notion/Medium-style bubble menu). Positioned
	// off the browser's own selection rect rather than Tiptap's coordsAtPos,
	// since getBoundingClientRect() already accounts for multi-line
	// selections and needs no extra math for where the bubble should sit.
	let bubbleMenu = $state<{ visible: boolean; rect: { top: number; left: number; width: number } }>(
		{
			visible: false,
			rect: { top: 0, left: 0, width: 0 }
		}
	);

	function syncActiveState() {
		if (!editor) return;
		active = {
			bold: editor.isActive('bold'),
			italic: editor.isActive('italic'),
			link: editor.isActive('link'),
			heading: editor.isActive('heading', { level: 2 }),
			quote: editor.isActive('blockquote')
		};
	}

	function syncBubbleMenu() {
		if (!editor || editor.state.selection.empty || !editor.isFocused) {
			bubbleMenu.visible = false;
			return;
		}
		const domSelection = window.getSelection();
		if (!domSelection || domSelection.rangeCount === 0) {
			bubbleMenu.visible = false;
			return;
		}
		const rect = domSelection.getRangeAt(0).getBoundingClientRect();
		if (rect.width === 0 && rect.height === 0) {
			bubbleMenu.visible = false;
			return;
		}
		bubbleMenu.visible = true;
		bubbleMenu.rect = { top: rect.top, left: rect.left, width: rect.width };
	}

	onMount(() => {
		editor = new Editor({
			element,
			extensions: [
				StarterKit.configure({ heading: { levels: [2, 3] }, link: false }),
				Link.configure({ openOnClick: false, autolink: true }),
				Image,
				Placeholder.configure({ placeholder }),
				Youtube.configure({ nocookie: true, width: 640, height: 360 }),
				Tweet,
				createSlashCommand(buildSlashCommandItems({ onImagePick }))
			],
			content,
			editorProps: {
				attributes: { role: 'textbox', 'aria-label': 'Post body' }
			},
			onUpdate: ({ editor }) => {
				onChange(editor.getHTML());
				syncActiveState();
			},
			onSelectionUpdate: () => {
				syncActiveState();
				syncBubbleMenu();
			},
			onTransaction: () => {
				syncActiveState();
				syncBubbleMenu();
			},
			onBlur: () => {
				bubbleMenu.visible = false;
			}
		});
	});

	onDestroy(() => {
		editor?.destroy();
	});

	async function insertImage() {
		const url = await onImagePick();
		if (url) editor?.chain().focus().setImage({ src: url }).run();
	}

	function insertLink() {
		const url = window.prompt('Link URL');
		if (url) editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
	}

	function insertYoutube() {
		const url = window.prompt('YouTube URL');
		if (url) editor?.commands.setYoutubeVideo({ src: url });
	}

	function insertTweet() {
		const url = window.prompt('Tweet URL (twitter.com or x.com status link)');
		if (url) editor?.commands.setTweet(url);
	}
</script>

<div
	style="display:flex;gap:2px;padding:0 0 16px;border-bottom:1px solid var(--color-divider);margin:0 0 32px;flex-wrap:wrap"
>
	<button
		type="button"
		class="btn btn-icon"
		class:btn-secondary={active.bold}
		style="width:32px;height:32px;color:var(--color-neutral-600)"
		title="Bold"
		aria-label="Bold"
		onclick={() => editor?.chain().focus().toggleBold().run()}
	>
		<BoldIcon />
	</button>
	<button
		type="button"
		class="btn btn-icon"
		class:btn-secondary={active.italic}
		style="width:32px;height:32px;color:var(--color-neutral-600)"
		title="Italic"
		aria-label="Italic"
		onclick={() => editor?.chain().focus().toggleItalic().run()}
	>
		<ItalicIcon />
	</button>
	<button
		type="button"
		class="btn btn-icon"
		class:btn-secondary={active.link}
		style="width:32px;height:32px;color:var(--color-neutral-600)"
		title="Link"
		aria-label="Link"
		onclick={insertLink}
	>
		<LinkIcon />
	</button>
	<button
		type="button"
		class="btn btn-icon"
		class:btn-secondary={active.heading}
		style="width:32px;height:32px;color:var(--color-neutral-600)"
		title="Heading"
		aria-label="Heading"
		onclick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
	>
		<HeadingIcon />
	</button>
	<button
		type="button"
		class="btn btn-icon"
		style="width:32px;height:32px;color:var(--color-neutral-600)"
		title="Image"
		aria-label="Image"
		onclick={insertImage}
	>
		<ImageIcon />
	</button>
	<button
		type="button"
		class="btn btn-icon"
		class:btn-secondary={active.quote}
		style="width:32px;height:32px;color:var(--color-neutral-600)"
		title="Block quote"
		aria-label="Block quote"
		onclick={() => editor?.chain().focus().toggleBlockquote().run()}
	>
		<BlockquoteIcon />
	</button>
	<button
		type="button"
		class="btn btn-icon"
		style="width:32px;height:32px;color:var(--color-neutral-600)"
		title="Embed YouTube video"
		aria-label="Embed YouTube video"
		onclick={insertYoutube}
	>
		<YoutubeIcon />
	</button>
	<button
		type="button"
		class="btn btn-icon"
		style="width:32px;height:32px;color:var(--color-neutral-600)"
		title="Embed tweet"
		aria-label="Embed tweet"
		onclick={insertTweet}
	>
		<TwitterIcon />
	</button>
</div>

{#if bubbleMenu.visible}
	<BubbleMenu
		rect={bubbleMenu.rect}
		{active}
		onBold={() => editor?.chain().focus().toggleBold().run()}
		onItalic={() => editor?.chain().focus().toggleItalic().run()}
		onLink={insertLink}
		onHeading={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
	/>
{/if}

<div bind:this={element} class="tiptap-body"></div>

<style>
	.tiptap-body :global(.ProseMirror) {
		outline: none;
		font-size: 17px;
		line-height: 1.7;
		min-height: 300px;
		color: var(--color-text);
	}
	.tiptap-body :global(.ProseMirror p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder);
		color: var(--color-neutral-400);
		float: left;
		height: 0;
		pointer-events: none;
	}
	.tiptap-body :global(.ProseMirror img) {
		max-width: 100%;
	}
	.tiptap-body :global(.ProseMirror blockquote) {
		border-left: 3px solid var(--color-accent);
		margin: 0 0 20px;
		padding-left: 16px;
		color: var(--color-neutral-700);
	}
	.tiptap-body :global(.ProseMirror iframe) {
		max-width: 100%;
	}
</style>
