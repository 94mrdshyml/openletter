const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

async function uploadImage(env: Env, file: File, folder: string): Promise<string> {
	if (!file.type.startsWith('image/')) {
		throw new Error('File must be an image');
	}
	if (file.size > MAX_IMAGE_BYTES) {
		throw new Error('File must be under 5MB');
	}

	const ext = file.type.split('/')[1] ?? 'bin';
	const key = `${folder}/${crypto.randomUUID()}.${ext}`;

	await env.MEDIA.put(key, await file.arrayBuffer(), {
		httpMetadata: { contentType: file.type }
	});

	return `${env.MEDIA_PUBLIC_URL}/${key}`;
}

export function uploadAvatar(env: Env, file: File): Promise<string> {
	return uploadImage(env, file, 'avatars');
}

export function uploadLogo(env: Env, file: File): Promise<string> {
	return uploadImage(env, file, 'logos');
}
