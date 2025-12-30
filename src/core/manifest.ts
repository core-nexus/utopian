import { z } from 'npm:zod';

export const UtopiaManifestSchema = z.object({
  name: z.string(),
  version: z.string(),
  sdg_targets: z.array(z.string()),
  parent_node: z.string().optional(),
  foundations_path: z.string().default('./foundations'),
  artifacts: z.array(z.string()),
  status: z.string(),
});

export type UtopiaManifest = z.infer<typeof UtopiaManifestSchema>;
