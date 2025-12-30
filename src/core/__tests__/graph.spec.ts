import { assertEquals } from 'jsr:@std/assert';
import { generateGraph } from '../graph.ts';
import { join } from 'jsr:@std/path';
import { ensureDir, writeYaml } from '../../tools/fsTools.ts';

Deno.test('generateGraph - creates graph from manifest and peers', async () => {
  const tmpDir = await Deno.makeTempDir();

  try {
    // Setup utopia.yaml
    const manifest = {
      node_id: 'node-self',
      profile: {
        sdg: 4
      },
      lineage: {
        parent_node: 'node-parent'
      }
    };
    await writeYaml(join(tmpDir, 'utopia.yaml'), manifest);

    // Setup trust/known_nodes.yaml
    const knownNodes = {
      peers: [
        { id: 'node-peer-1', sdg: 13 },
        { id: 'node-peer-2', sdg: 7 }
      ]
    };
    await ensureDir(join(tmpDir, 'trust'));
    await writeYaml(join(tmpDir, 'trust', 'known_nodes.yaml'), knownNodes);

    // Run generateGraph
    const graph = await generateGraph(tmpDir);

    // Verify Nodes
    assertEquals(graph.nodes.length, 4); // self, parent, peer1, peer2

    const selfNode = graph.nodes.find(n => n.id === 'node-self');
    assertEquals(selfNode?.type, 'self');
    assertEquals(selfNode?.sdg, 4);
    assertEquals(selfNode?.color, '#C5192D'); // SDG 4 color

    const peer1 = graph.nodes.find(n => n.id === 'node-peer-1');
    assertEquals(peer1?.type, 'peer');
    assertEquals(peer1?.sdg, 13);

    const parentNode = graph.nodes.find(n => n.id === 'node-parent');
    assertEquals(parentNode?.type, 'peer'); // Implicitly added

    // Verify Links
    // 1. Parent -> Self
    const lineageLink = graph.links.find(l => l.source === 'node-parent' && l.target === 'node-self');
    assertEquals(lineageLink?.strength, 1);

    // 2. Self -> Peer 1
    const trustLink1 = graph.links.find(l => l.source === 'node-self' && l.target === 'node-peer-1');
    assertEquals(trustLink1?.strength, 0.5);

  } finally {
    await Deno.remove(tmpDir, { recursive: true });
  }
});

Deno.test('generateGraph - handles missing files gracefully', async () => {
    const tmpDir = await Deno.makeTempDir();
    try {
        const graph = await generateGraph(tmpDir);
        assertEquals(graph.nodes.length, 0);
        assertEquals(graph.links.length, 0);
    } finally {
        await Deno.remove(tmpDir, { recursive: true });
    }
});
