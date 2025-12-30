import { readYaml } from '../tools/fsTools.ts';
import { join } from 'jsr:@std/path';

export interface Manifest {
  node_id: string;
  profile: {
    name?: string;
    sdg: number;
  };
  lineage?: {
    parent_node?: string;
  };
}

export async function readManifest(cwd: string): Promise<Manifest | undefined> {
  return await readYaml<Manifest>(join(cwd, 'utopia.yaml'));
}
