const ALLOW = new Set(['marp', 'ffmpeg', 'git', 'mflux-generate']);

export async function runCmd(
  cmd: string,
  args: string[] = [],
  opts: { cwd?: string } = {},
) {
  if (!ALLOW.has(cmd)) throw new Error(`Command not allowed: ${cmd}`);

  const command = new Deno.Command(cmd, {
    args,
    cwd: opts.cwd,
    stdout: 'piped',
    stderr: 'piped',
  });

  const { code, stdout, stderr } = await command.output();

  if (code === 0) {
    return new TextDecoder().decode(stdout).trim();
  } else {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(errorText || `exit ${code}`);
  }
}

export async function checkMfluxAvailable(): Promise<boolean> {
  try {
    const command = new Deno.Command('which', {
      args: ['mflux-generate'],
      stdout: 'piped',
      stderr: 'piped',
    });
    const { code } = await command.output();
    return code === 0;
  } catch {
    return false;
  }
}

export async function generateImage(
  prompt: string,
  outputPath: string,
  opts: {
    width?: number;
    height?: number;
    steps?: number;
    seed?: number;
    quantize?: number;
    cwd?: string;
  } = {}
): Promise<string> {
  const {
    width = 1024,
    height = 1024,
    steps = 28,
    seed,
    quantize = 8,
    cwd
  } = opts;

  const args = [
    '--low-ram',
    '--model', 'dev',
    '--steps', steps.toString(),
    '--quantize', quantize.toString(),
    '--prompt', prompt,
    '--width', width.toString(),
    '--height', height.toString(),
    '--out', outputPath
  ];

  if (seed !== undefined) {
    args.push('--seed', seed.toString());
  }

  return await runCmd('mflux-generate', args, { cwd });
}
