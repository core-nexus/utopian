import { join } from 'jsr:@std/path@1.1.2';
import { listDir, readText } from '../tools/fsTools.ts';

export class ContextPacker {
  private cwd: string;

  constructor(cwd: string) {
    this.cwd = cwd;
  }

  async pack(): Promise<string> {
    const contextParts: string[] = [];

    // 1. Read Goals
    try {
      const goalsPath = join(this.cwd, 'goals', 'README.md');
      const goals = await readText(goalsPath);
      if (goals) {
        contextParts.push('=== GOALS ===\n' + goals);
      }
    } catch {
      // Ignore
    }

    // 2. Read Foundations
    try {
      const foundationsPath = join(this.cwd, 'foundations');
      const foundationsList = await listDir(foundationsPath);

      let foundationsContent = '';
      for (const item of foundationsList) {
         if (!item.startsWith('.')) {
             try {
                const itemContent = await readText(join(foundationsPath, item));
                if (itemContent) {
                    foundationsContent += `--- ${item} ---\n${itemContent}\n\n`;
                }
             } catch {
                 // ignore
             }
         }
      }

      if (foundationsContent) {
        contextParts.push('=== FOUNDATIONS ===\n' + foundationsContent);
      }
    } catch {
      // Ignore
    }

    // 3. Read Trust
    try {
      const trustPath = join(this.cwd, 'trust', 'known_nodes.yaml');
      const trust = await readText(trustPath);
      if (trust) {
        contextParts.push('=== TRUST NETWORK ===\n' + trust);
      }
    } catch {
      // Ignore
    }

    // 4. Summarize Topics
    try {
      const topicsPath = join(this.cwd, 'topics');
      const topicDirs = await listDir(topicsPath);
      let topicsSummary = '';

      for (const topicDir of topicDirs) {
        try {
            const overviewPath = join(topicsPath, topicDir, 'docs', 'overview.md');
            const overview = await readText(overviewPath);
            if (overview) {
                topicsSummary += `--- Topic: ${topicDir} ---\n${overview.substring(0, 500)}...\n\n`;
            }
        } catch {
            // ignore
        }
      }

      if (topicsSummary) {
          contextParts.push('=== EXISTING TOPICS (Summary) ===\n' + topicsSummary);
      }
    } catch {
        // Ignore
    }

    return contextParts.join('\n\n');
  }
}
