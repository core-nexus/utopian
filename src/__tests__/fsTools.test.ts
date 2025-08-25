import { join } from 'jsr:@std/path';
import { assertEquals } from 'jsr:@std/assert';
import {
  ensureDir,
  listDir,
  readText,
  writeText,
  writeYaml,
} from '../tools/fsTools.ts';

async function withTempDir(fn: (testDir: string) => Promise<void>) {
  const testDir = await Deno.makeTempDir({ prefix: 'utopian-test-' });
  try {
    await fn(testDir);
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
}

Deno.test('ensureDir should create a directory if it does not exist', async () => {
  await withTempDir(async (testDir) => {
    const dirPath = join(testDir, 'new-dir');
    await ensureDir(dirPath);

    const dirs = await listDir(testDir);
    assertEquals(dirs.includes('new-dir'), true);
  });
});

Deno.test('ensureDir should not fail if directory already exists', async () => {
  await withTempDir(async (testDir) => {
    const dirPath = join(testDir, 'existing-dir');
    await ensureDir(dirPath);
    await ensureDir(dirPath); // Second call should not fail

    const dirs = await listDir(testDir);
    assertEquals(dirs.includes('existing-dir'), true);
  });
});

Deno.test('writeText and readText should work correctly', async () => {
  await withTempDir(async (testDir) => {
    const filePath = join(testDir, 'test.txt');
    const content = 'Hello, World!';

    await writeText(filePath, content);
    const readContent = await readText(filePath);

    assertEquals(readContent, content);
  });
});

Deno.test('readText should return undefined for non-existent files', async () => {
  await withTempDir(async (testDir) => {
    const filePath = join(testDir, 'nonexistent.txt');
    const content = await readText(filePath);

    assertEquals(content, undefined);
  });
});

Deno.test('writeYaml should write YAML content to file', async () => {
  await withTempDir(async (testDir) => {
    const filePath = join(testDir, 'test.yaml');
    const data = { name: 'test', version: '1.0.0' };

    await writeYaml(filePath, data);
    const content = await readText(filePath);

    assertEquals(content?.includes('name: test'), true);
    assertEquals(content?.includes('version: 1.0.0'), true);
  });
});

Deno.test('listDir should list directory contents', async () => {
  await withTempDir(async (testDir) => {
    await writeText(join(testDir, 'file1.txt'), 'content1');
    await writeText(join(testDir, 'file2.txt'), 'content2');
    await ensureDir(join(testDir, 'subdir'));

    const contents = await listDir(testDir);

    assertEquals(contents.includes('file1.txt'), true);
    assertEquals(contents.includes('file2.txt'), true);
    assertEquals(contents.includes('subdir'), true);
  });
});

Deno.test('listDir should return empty array for empty directory', async () => {
  await withTempDir(async (testDir) => {
    const emptyDir = join(testDir, 'empty');
    await ensureDir(emptyDir);

    const contents = await listDir(emptyDir);

    assertEquals(contents, []);
  });
});
