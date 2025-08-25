const ALLOW = new Set(['marp', 'ffmpeg', 'git']);

export async function runCmd(cmd: string, args: string[] = [], opts: { cwd?: string } = {}) {
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
