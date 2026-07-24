import { customAlphabet } from 'nanoid';

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const randomPart = customAlphabet(alphabet, 24);

export type IdPrefix = 'pub' | 'post' | 'sub' | 'user' | 'sess' | 'acct' | 'ver' | 'inv';

export function generateId(prefix: IdPrefix): string {
	return `${prefix}_${randomPart()}`;
}
