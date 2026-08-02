import { spawn } from 'node:child_process';

export class CommandError extends Error {
	constructor(
		public readonly command: string,
		public readonly exitCode: number | null,
		public readonly stderr: string
	) {
		super(`${command} exited with code ${exitCode}${stderr ? `\n${stderr}` : ''}`);
	}
}

/** Runs a command with inherited stdio — use for anything interactive (wrangler login, secret prompts). */
export function run(command: string, args: string[], cwd: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			cwd,
			stdio: 'inherit',
			shell: process.platform === 'win32'
		});
		child.on('error', reject);
		child.on('close', (code) => {
			if (code === 0) resolve();
			else reject(new CommandError(`${command} ${args.join(' ')}`, code, ''));
		});
	});
}

/** Runs a command, captures stdout, and also streams it to the terminal so the user sees progress. */
export function runCapture(command: string, args: string[], cwd: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, { cwd, shell: process.platform === 'win32' });
		let stdout = '';
		let stderr = '';
		child.stdout?.on('data', (chunk) => {
			stdout += chunk;
			process.stdout.write(chunk);
		});
		child.stderr?.on('data', (chunk) => {
			stderr += chunk;
			process.stderr.write(chunk);
		});
		child.on('error', reject);
		child.on('close', (code) => {
			if (code === 0) resolve(stdout);
			else reject(new CommandError(`${command} ${args.join(' ')}`, code, stderr));
		});
	});
}

/** Runs a command feeding `input` to stdin, without inheriting the terminal — for non-interactive secret writes. */
export function runWithInput(
	command: string,
	args: string[],
	cwd: string,
	input: string
): Promise<void> {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			cwd,
			stdio: ['pipe', 'inherit', 'inherit'],
			shell: process.platform === 'win32'
		});
		child.on('error', reject);
		child.on('close', (code) => {
			if (code === 0) resolve();
			else reject(new CommandError(`${command} ${args.join(' ')}`, code, ''));
		});
		child.stdin.end(input);
	});
}
