import { spawn } from "node:child_process";

const ALLOW = new Set(["marp", "ffmpeg", "git"]);

export async function runCmd(cmd: string, args: string[] = [], opts: {cwd?: string} = {}) {
  if (!ALLOW.has(cmd)) throw new Error(`Command not allowed: ${cmd}`);
  return new Promise<string>((resolve, reject) => {
    const p = spawn(cmd, args, { cwd: opts.cwd, stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    p.stdout.on("data", d => (out += d));
    p.stderr.on("data", d => (err += d));
    p.on("close", code => code === 0 ? resolve(out.trim()) : reject(new Error(err || `exit ${code}`)));
  });
}