import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  ensureDir,
  listDir,
  readText,
  writeText,
  writeYaml,
} from '../tools/fsTools.js';

describe('fsTools', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'utopian-test-'));
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('ensureDir', () => {
    it('should create a directory if it does not exist', async () => {
      const dirPath = join(testDir, 'new-dir');
      await ensureDir(dirPath);

      const dirs = await listDir(testDir);
      expect(dirs).toContain('new-dir');
    });

    it('should not fail if directory already exists', async () => {
      const dirPath = join(testDir, 'existing-dir');
      await ensureDir(dirPath);
      await ensureDir(dirPath); // Second call should not fail

      const dirs = await listDir(testDir);
      expect(dirs).toContain('existing-dir');
    });
  });

  describe('writeText and readText', () => {
    it('should write and read text files', async () => {
      const filePath = join(testDir, 'test.txt');
      const content = 'Hello, World!';

      await writeText(filePath, content);
      const readContent = await readText(filePath);

      expect(readContent).toBe(content);
    });

    it('should return undefined for non-existent files', async () => {
      const filePath = join(testDir, 'nonexistent.txt');
      const content = await readText(filePath);

      expect(content).toBeUndefined();
    });
  });

  describe('writeYaml', () => {
    it('should write YAML content to file', async () => {
      const filePath = join(testDir, 'test.yaml');
      const data = { name: 'test', version: '1.0.0' };

      await writeYaml(filePath, data);
      const content = await readText(filePath);

      expect(content).toContain('name: test');
      expect(content).toContain('version: 1.0.0');
    });
  });

  describe('listDir', () => {
    it('should list directory contents', async () => {
      await writeText(join(testDir, 'file1.txt'), 'content1');
      await writeText(join(testDir, 'file2.txt'), 'content2');
      await ensureDir(join(testDir, 'subdir'));

      const contents = await listDir(testDir);

      expect(contents).toContain('file1.txt');
      expect(contents).toContain('file2.txt');
      expect(contents).toContain('subdir');
    });

    it('should return empty array for empty directory', async () => {
      const emptyDir = join(testDir, 'empty');
      await ensureDir(emptyDir);

      const contents = await listDir(emptyDir);

      expect(contents).toEqual([]);
    });
  });
});
