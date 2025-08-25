import { dirname, join } from 'jsr:@std/path';

export async function hitl(
  step: string,
  cwd: string,
  previewRel: string,
  message: string,
  auto = false,
) {
  const previewPath = join(cwd, '.utopia', 'hitl', `${previewRel}.md`);
  await Deno.mkdir(dirname(previewPath), { recursive: true });
  await Deno.writeTextFile(previewPath, `# HITL: ${step}\n\n${message}\n`);

  if (auto || Deno.env.get('AUTO') === '1') {
    console.log(`\n🔎 Auto-continuing ${step} (review ${previewPath})`);
    return;
  }

  console.log(
    `\n🔎 Review ${previewPath}\nPress Enter to continue or Ctrl+C to abort…`,
  );

  // Simple input reading in Deno
  const buf = new Uint8Array(1024);
  await Deno.stdin.read(buf);
}
