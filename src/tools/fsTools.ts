import fs from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";

export async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

export async function readText(p: string) {
  try { return await fs.readFile(p, "utf8"); } catch { return undefined; }
}

export async function writeText(p: string, content: string) {
  await ensureDir(path.dirname(p));
  await fs.writeFile(p, content, "utf8");
  return p;
}

export async function listDir(p: string) {
  try { return (await fs.readdir(p, { withFileTypes: true })).map(d => d.name); }
  catch { return []; }
}

export async function readYaml<T = unknown>(p: string): Promise<T | undefined> {
  const txt = await readText(p);
  if (!txt) return undefined;
  return YAML.parse(txt) as T;
}

export async function writeYaml(p: string, obj: unknown) {
  const txt = YAML.stringify(obj);
  return writeText(p, txt);
}

export function cwdHasRepo(cwd: string) {
  return Promise.all([
    listDir(`${cwd}/goals`),
    listDir(`${cwd}/foundations`),
    listDir(`${cwd}/trust`)
  ]).then(([g,f,t]) => g.length+f.length+t.length > 0);
}