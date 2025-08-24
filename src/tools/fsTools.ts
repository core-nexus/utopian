// Runtime-agnostic file system utilities
const isDeno = typeof Deno !== 'undefined';

// Dynamic imports based on runtime
const fs = isDeno ? null : (await import('node:fs/promises')).default;
const path = isDeno ? null : (await import('node:path')).default;
const YAML = isDeno ? null : (await import('yaml')).default;

// Deno-specific imports (only loaded when needed)
const denoEnsureDir = isDeno
  ? (await import('https://deno.land/std@0.224.0/fs/ensure_dir.ts')).ensureDir
  : null;
const denoPath = isDeno ? await import('https://deno.land/std@0.224.0/path/mod.ts') : null;
const denoYaml = isDeno ? await import('https://deno.land/std@0.224.0/yaml/mod.ts') : null;

export async function ensureDir(p: string) {
  if (isDeno) {
    await denoEnsureDir!(p);
  } else {
    await fs!.mkdir(p, { recursive: true });
  }
}

export async function readText(p: string) {
  try {
    if (isDeno) {
      return await Deno.readTextFile(p);
    } else {
      return await fs!.readFile(p, 'utf8');
    }
  } catch {
    return undefined;
  }
}

export async function writeText(p: string, content: string) {
  if (isDeno) {
    await ensureDir(denoPath!.dirname(p));
    await Deno.writeTextFile(p, content);
  } else {
    await ensureDir(path!.dirname(p));
    await fs!.writeFile(p, content, 'utf8');
  }
  return p;
}

export async function listDir(p: string) {
  try {
    if (isDeno) {
      const entries = [];
      for await (const entry of Deno.readDir(p)) {
        entries.push(entry.name);
      }
      return entries;
    } else {
      return (await fs!.readdir(p, { withFileTypes: true })).map(d => d.name);
    }
  } catch {
    return [];
  }
}

export async function readYaml<T = unknown>(p: string): Promise<T | undefined> {
  const txt = await readText(p);
  if (!txt) return undefined;

  if (isDeno) {
    return denoYaml!.parse(txt) as T;
  } else {
    return YAML!.parse(txt) as T;
  }
}

export async function writeYaml(p: string, obj: unknown) {
  const txt = isDeno ? denoYaml!.stringify(obj) : YAML!.stringify(obj);
  return writeText(p, txt);
}

export function cwdHasRepo(cwd: string) {
  return Promise.all([
    listDir(`${cwd}/goals`),
    listDir(`${cwd}/foundations`),
    listDir(`${cwd}/trust`),
  ]).then(([g, f, t]) => g.length + f.length + t.length > 0);
}
