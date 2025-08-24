// Runtime-agnostic HITL (Human In The Loop) functionality
const isDeno = typeof Deno !== 'undefined';

// Dynamic imports based on runtime
const fs = isDeno ? null : (await import('node:fs/promises')).default;
const path = isDeno ? null : (await import('node:path')).default;

// Deno-specific imports
const denoEnsureDir = isDeno
  ? (await import('https://deno.land/std@0.224.0/fs/ensure_dir.ts')).ensureDir
  : null;
const denoPath = isDeno ? await import('https://deno.land/std@0.224.0/path/mod.ts') : null;

export async function hitl(
  step: string,
  cwd: string,
  previewRel: string,
  message: string,
  auto = false
) {
  const previewPath = isDeno
    ? denoPath!.join(cwd, '.utopia', 'hitl', `${previewRel}.md`)
    : path!.join(cwd, '.utopia', 'hitl', `${previewRel}.md`);

  if (isDeno) {
    await denoEnsureDir!(denoPath!.dirname(previewPath));
    await Deno.writeTextFile(previewPath, `# HITL: ${step}\n\n${message}\n`);
  } else {
    await fs!.mkdir(path!.dirname(previewPath), { recursive: true });
    await fs!.writeFile(previewPath, `# HITL: ${step}\n\n${message}\n`);
  }

  const getEnv = (key: string) => (isDeno ? Deno.env.get(key) : process.env[key]);

  if (auto || getEnv('AUTO') === '1') {
    console.log(`\n🔎 Auto-continuing ${step} (review ${previewPath})`);
    return;
  }

  if (isDeno) {
    console.log(`\n🔎 Review ${previewPath}\nPress Enter to continue or Ctrl+C to abort…`);
    await new Promise<void>(resolve => {
      const listener = () => {
        Deno.stdin.setRaw(false);
        resolve();
      };
      Deno.stdin.setRaw(true);
      const buffer = new Uint8Array(1);
      Deno.stdin.read(buffer).then(() => listener());
    });
  } else {
    process.stdout.write(
      `\n🔎 Review ${previewPath}\nPress Enter to continue or Ctrl+C to abort… `
    );
    await new Promise<void>(res => process.stdin.once('data', () => res()));
  }
}
