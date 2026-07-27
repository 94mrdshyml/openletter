import { uploadCoverImage } from './media';
import { slugify } from '$lib/slug';

export type ParsedPostForm = {
	title: string;
	subtitle: string | null;
	slug: string;
	excerpt: string | null;
	body: string;
	wall: 'public' | 'subscribers';
	coverImageUrl: string | null;
	scheduledAt: Date | null;
};

export async function parsePostForm(request: Request, env: Env): Promise<ParsedPostForm> {
	const data = await request.formData();

	const title = String(data.get('title') ?? '').trim() || 'Untitled';
	const subtitle = String(data.get('subtitle') ?? '') || null;
	const slugInput = String(data.get('slug') ?? '');
	const excerpt = String(data.get('excerpt') ?? '') || null;
	const body = String(data.get('body') ?? '');
	const wall = String(data.get('wall') ?? 'public') === 'subscribers' ? 'subscribers' : 'public';
	const scheduledAtRaw = String(data.get('scheduledAt') ?? '');

	const coverImage = data.get('coverImage');
	let coverImageUrl = String(data.get('coverImageUrl') ?? '') || null;
	if (coverImage instanceof File && coverImage.size > 0) {
		coverImageUrl = await uploadCoverImage(env, coverImage);
	}

	return {
		title,
		subtitle,
		slug: slugify(slugInput || title),
		excerpt,
		body,
		wall,
		coverImageUrl,
		scheduledAt: scheduledAtRaw ? new Date(scheduledAtRaw) : null
	};
}
