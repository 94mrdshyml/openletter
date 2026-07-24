const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export async function uploadAvatar(env: Env, file: File): Promise<string> {
	if (!file.type.startsWith('image/')) {
		throw new Error('Avatar must be an image file');
	}
	if (file.size > MAX_AVATAR_BYTES) {
		throw new Error('Avatar must be under 5MB');
	}

	const ext = file.type.split('/')[1] ?? 'bin';
	const key = `avatars/${crypto.randomUUID()}.${ext}`;

	await env.MEDIA.put(key, await file.arrayBuffer(), {
		httpMetadata: { contentType: file.type }
	});

	return `${env.MEDIA_PUBLIC_URL}/${key}`;
}
