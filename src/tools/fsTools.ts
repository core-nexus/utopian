import { dirname, join } from 'jsr:@std/path@1.1.2';
import { parse, stringify } from 'jsr:@std/yaml@1.0.9';
import { UtopiaManifestSchema, type UtopiaManifest } from '../core/manifest.ts';

export async function ensureDir(p: string) {
  await Deno.mkdir(p, { recursive: true });
}

export async function readText(p: string) {
  try {
    return await Deno.readTextFile(p);
  } catch {
    return undefined;
  }
}

export async function writeText(p: string, content: string) {
  await ensureDir(dirname(p));
  await Deno.writeTextFile(p, content);
  return p;
}

export async function listDir(p: string) {
  try {
    const entries = [];
    for await (const entry of Deno.readDir(p)) {
      entries.push(entry.name);
    }
    return entries;
  } catch {
    return [];
  }
}

export async function readYaml<T = unknown>(p: string): Promise<T | undefined> {
  const txt = await readText(p);
  if (!txt) return undefined;
  return parse(txt) as T;
}

export function writeYaml(p: string, obj: unknown) {
  const txt = stringify(obj);
  return writeText(p, txt);
}

export function cwdHasRepo(cwd: string) {
  return Promise.all([
    listDir(join(cwd, 'goals')),
    listDir(join(cwd, 'foundations')),
    listDir(join(cwd, 'trust')),
  ]).then(([g, f, t]) => g.length + f.length + t.length > 0);
}

export async function readManifest(cwd: string): Promise<UtopiaManifest | undefined> {
  const p = join(cwd, 'utopia.yaml');
  const obj = await readYaml(p);
  if (!obj) return undefined;
  const result = UtopiaManifestSchema.safeParse(obj);
  if (!result.success) {
    console.error('Invalid utopia.yaml:', result.error);
    return undefined;
  }
  return result.data;
}
