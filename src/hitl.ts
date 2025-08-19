import fs from "node:fs/promises";
import path from "node:path";

export async function hitl(step: string, cwd: string, previewRel: string, message: string) {
  const previewPath = path.join(cwd, ".utopia", "hitl", `${previewRel}.md`);
  await fs.mkdir(path.dirname(previewPath), { recursive: true });
  await fs.writeFile(previewPath, `# HITL: ${step}\n\n${message}\n`);
  if (process.env.AUTO === "1") return;
  process.stdout.write(`\n🔎 Review ${previewPath}\nPress Enter to continue or Ctrl+C to abort… `);
  await new Promise<void>(res => process.stdin.once("data", () => res()));
}