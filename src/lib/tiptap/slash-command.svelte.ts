import { Extension } from '@tiptap/core';
import Suggestion, { type SuggestionKeyDownProps, type SuggestionProps } from '@tiptap/suggestion';
import { mount, unmount } from 'svelte';
import SlashMenuComponent from '$lib/components/SlashMenu.svelte';
import type { SlashCommandItem } from './slash-items';

// Notion-style "/" menu. Filtering, keyboard nav (up/down/enter/tab), and
// escape/outside-click dismissal all come from @tiptap/suggestion; this file
// only wires that plugin to a mounted SlashMenu.svelte instance and tracks
// which row is highlighted.
export function createSlashCommand(items: SlashCommandItem[]) {
	return Extension.create({
		name: 'slashCommand',
		addProseMirrorPlugins() {
			return [
				Suggestion<SlashCommandItem, SlashCommandItem>({
					editor: this.editor,
					char: '/',
					startOfLine: false,
					items: ({ query }) => {
						const q = query.toLowerCase();
						if (!q) return items;
						return items.filter(
							(item) =>
								item.title.toLowerCase().includes(q) || item.keywords.some((k) => k.includes(q))
						);
					},
					command: ({ editor, range, props }) => props.command({ editor, range }),
					render: () => {
						let unmountFloating: (() => void) | undefined;
						let instance: Record<string, unknown> | undefined;
						let currentItems: SlashCommandItem[] = [];
						let currentCommand: ((item: SlashCommandItem) => void) | undefined;
						const menuState = $state({ items: [] as SlashCommandItem[], selectedIndex: 0 });

						function sync(props: SuggestionProps<SlashCommandItem, SlashCommandItem>) {
							currentItems = props.items;
							currentCommand = props.command;
							menuState.items = props.items;
						}

						return {
							onStart: (props) => {
								sync(props);
								menuState.selectedIndex = 0;
								const element = document.createElement('div');
								instance = mount(SlashMenuComponent, {
									target: element,
									props: {
										get items() {
											return menuState.items;
										},
										get selectedIndex() {
											return menuState.selectedIndex;
										},
										onSelect: (item: SlashCommandItem) => currentCommand?.(item)
									}
								});
								unmountFloating = props.mount(element);
							},
							onUpdate: (props) => {
								sync(props);
								menuState.selectedIndex = Math.min(
									menuState.selectedIndex,
									Math.max(props.items.length - 1, 0)
								);
							},
							onKeyDown: ({ event }: SuggestionKeyDownProps) => {
								if (event.key === 'ArrowDown') {
									if (currentItems.length === 0) return true;
									menuState.selectedIndex = (menuState.selectedIndex + 1) % currentItems.length;
									return true;
								}
								if (event.key === 'ArrowUp') {
									if (currentItems.length === 0) return true;
									menuState.selectedIndex =
										(menuState.selectedIndex - 1 + currentItems.length) % currentItems.length;
									return true;
								}
								if (event.key === 'Enter' || event.key === 'Tab') {
									const item = currentItems[menuState.selectedIndex];
									if (item) currentCommand?.(item);
									return true;
								}
								return false;
							},
							onExit: () => {
								unmountFloating?.();
								if (instance) unmount(instance);
							}
						};
					}
				})
			];
		}
	});
}
