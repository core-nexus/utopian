import { join } from 'jsr:@std/path@1.1.2';

const ALLOW = new Set([
  'marp',
  'ffmpeg',
  'git',
  'mflux-generate',
  'python3',
  'bash',
]);

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

export async function checkMfluxAvailable(cwd: string): Promise<boolean> {
  try {
    // Check if Python virtual environment exists and has mflux installed
    const venvPath = join(cwd, 'tmp', 'mflux', '.venv');
    const activateScript = join(venvPath, 'bin', 'activate');

    try {
      await Deno.stat(activateScript);
    } catch {
      return false; // venv doesn't exist
    }

    // Check if mflux is installed in the venv
    const checkCmd = new Deno.Command('bash', {
      args: [
        '-c',
        `source ${activateScript} && python -c "import mflux; print('available')"`,
      ],
      cwd,
      stdout: 'piped',
      stderr: 'piped',
    });
    const { code } = await checkCmd.output();
    return code === 0;
  } catch {
    return false;
  }
}

export async function setupMfluxEnvironment(cwd: string): Promise<boolean> {
  try {
    const mfluxDir = join(cwd, 'tmp', 'mflux');
    const venvPath = join(mfluxDir, '.venv');
    const activateScript = join(venvPath, 'bin', 'activate');

    // Create tmp/mflux directory
    await Deno.mkdir(mfluxDir, { recursive: true });

    // Check if venv already exists
    try {
      await Deno.stat(activateScript);
      console.log('  ✅ Python virtual environment already exists');
    } catch {
      // Create virtual environment
      console.log('  🐍 Creating Python virtual environment...');
      const venvCmd = new Deno.Command('python3', {
        args: ['-m', 'venv', '.venv'],
        cwd: mfluxDir,
        stdout: 'piped',
        stderr: 'piped',
      });
      const venvResult = await venvCmd.output();
      if (venvResult.code !== 0) {
        const error = new TextDecoder().decode(venvResult.stderr);
        console.error('  ❌ Failed to create virtual environment:', error);
        return false;
      }
    }

    // Check if mflux is already installed
    const checkCmd = new Deno.Command('bash', {
      args: [
        '-c',
        `source ${activateScript} && python -c "import mflux; print('installed')"`,
      ],
      cwd: mfluxDir,
      stdout: 'piped',
      stderr: 'piped',
    });
    const checkResult = await checkCmd.output();

    if (checkResult.code !== 0) {
      // Install mflux
      console.log(
        '  📦 Installing mflux (this may take a while and use significant disk space)...',
      );
      const installCmd = new Deno.Command('bash', {
        args: ['-c', `source ${activateScript} && pip install -U mlx mflux`],
        cwd: mfluxDir,
        stdout: 'piped',
        stderr: 'piped',
      });
      const installResult = await installCmd.output();
      if (installResult.code !== 0) {
        const error = new TextDecoder().decode(installResult.stderr);
        console.error('  ❌ Failed to install mflux:', error);
        return false;
      }
      console.log('  ✅ mflux installed successfully');
    } else {
      console.log('  ✅ mflux already installed');
    }

    return true;
  } catch (error) {
    console.error('  ❌ Error setting up mflux environment:', error);
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
  } = {},
): Promise<string> {
  const {
    width = 1024,
    height = 1024,
    steps = 28,
    seed,
    quantize = 8,
    cwd = '.',
  } = opts;

  const mfluxDir = join(cwd, 'tmp', 'mflux');
  const activateScript = join(mfluxDir, '.venv', 'bin', 'activate');

  // Build the mflux-generate command
  let mfluxCmd =
    `mflux-generate --low-ram --model dev --steps ${steps} --quantize ${quantize} --prompt "${prompt}" --width ${width} --height ${height} --out "${outputPath}"`;

  if (seed !== undefined) {
    mfluxCmd += ` --seed ${seed}`;
  }

  // Run mflux-generate in the virtual environment
  const command = new Deno.Command('bash', {
    args: [
      '-c',
      `cd "${mfluxDir}" && source ${activateScript} && cd "${cwd}" && ${mfluxCmd}`,
    ],
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  });

  const { code, stdout, stderr } = await command.output();

  if (code === 0) {
    return new TextDecoder().decode(stdout).trim();
  } else {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(errorText || `mflux-generate exit ${code}`);
  }
}
