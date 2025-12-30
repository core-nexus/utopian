import { join, relative } from 'jsr:@std/path@1.1.2';
import { readManifest, readText } from '../tools/fsTools.ts';

export class ContextPacker {
  async pack(cwd: string): Promise<string> {
    const manifest = await readManifest(cwd);
    if (!manifest) {
      throw new Error('utopia.yaml not found or invalid');
    }

    // 1. IDENTITY
    let output = '# IDENTITY\n';
    output += `Name: ${manifest.name}\n`;
    output += `Version: ${manifest.version}\n`;
    output += `Status: ${manifest.status}\n`;
    output += `SDG Targets: ${manifest.sdg_targets.join(', ')}\n`;
    if (manifest.parent_node) {
      output += `Parent Node: ${manifest.parent_node}\n`;
    }
    output += '\n';

    // 2. FOUNDATIONS
    output += '# FOUNDATIONS (System Prompt)\n';
    const foundationsPath = join(cwd, manifest.foundations_path);
    try {
      for await (const entry of Deno.readDir(foundationsPath)) {
        if (entry.isFile) {
          const content = await readText(join(foundationsPath, entry.name));
          if (content) {
            output += `## ${entry.name}\n`;
            output += content + '\n\n';
          }
        }
      }
    } catch (e) {
      output += `Error reading foundations from ${manifest.foundations_path}: ${e}\n`;
    }

    // 3. STATE
    output += '# STATE\n';
    const tree = await this.generateFileTree(cwd, cwd);
    output += tree;

    return output;
  }

  private async generateFileTree(dir: string, root: string): Promise<string> {
    let result = '';
    const entries = [];
    try {
      for await (const entry of Deno.readDir(dir)) {
        entries.push(entry);
      }
    } catch {
      return '';
    }

    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '.DS_Store') continue;

      const fullPath = join(dir, entry.name);
      const relPath = relative(root, fullPath);
      const level = relPath.split('/').length - 1;
      const indent = '  '.repeat(level);

      if (entry.isDirectory) {
        result += `${indent}- ${entry.name}/\n`;
        result += await this.generateFileTree(fullPath, root);
      } else {
        result += `${indent}- ${entry.name}\n`;
      }
    }
    return result;
  }
}
