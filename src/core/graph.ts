import { join } from 'jsr:@std/path';
import { readYaml } from '../tools/fsTools.ts';
import { readManifest } from './manifest.ts';

export interface GraphNode {
  id: string;
  type: 'self' | 'peer';
  sdg: number;
  color: string;
}

export interface GraphLink {
  source: string;
  target: string;
  strength: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface Peer {
  id: string;
  sdg?: number;
  // potentially other fields
}

interface KnownNodes {
  peers?: Peer[];
  // If it's just a dictionary or different structure, we might need to adjust.
  // Assuming list based on "Create 'Node' objects for every peer"
}

// Map SDG goals to colors (simplified palette)
function getSdgColor(sdg?: number): string {
  const colors: Record<number, string> = {
    1: '#E5243B', 2: '#DDA63A', 3: '#4C9F38', 4: '#C5192D', 5: '#FF3A21',
    6: '#26BDE2', 7: '#FCC30B', 8: '#A21942', 9: '#FD6925', 10: '#DD1367',
    11: '#FD9D24', 12: '#BF8B2E', 13: '#3F7E44', 14: '#0A97D9', 15: '#56C02B',
    16: '#00689D', 17: '#19486A'
  };
  return (sdg && colors[sdg]) ? colors[sdg] : '#808080'; // Default gray
}

export async function generateGraph(cwd: string): Promise<GraphData> {
  const manifest = await readManifest(cwd);
  const knownNodes = await readYaml<KnownNodes>(join(cwd, 'trust', 'known_nodes.yaml'));

  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const nodeIds = new Set<string>();

  // Add self
  if (manifest) {
    // Determine ID. Manifest should have node_id.
    const selfId = manifest.node_id || 'self';
    const selfSdg = manifest.profile?.sdg || 0;

    nodes.push({
      id: selfId,
      type: 'self',
      sdg: selfSdg,
      color: getSdgColor(selfSdg)
    });
    nodeIds.add(selfId);

    // Add lineage link if parent exists
    if (manifest.lineage?.parent_node) {
      const parentId = manifest.lineage.parent_node;
      // We add the link even if the parent node isn't explicitly in our list yet?
      // Usually graph viz needs both nodes.
      // If the parent isn't in 'known_nodes', maybe we should add a placeholder node?
      // For now, let's just add the link.
      links.push({
        source: parentId, // Parent -> Child
        target: selfId,
        strength: 1
      });

      // Implicitly add parent node if not exists?
      // The prompt says "Create 'Node' objects for every peer in trust/".
      // It doesn't explicitly say create node for parent if not in trust.
      // But for a valid graph, we need the node.
      if (!nodeIds.has(parentId)) {
         nodes.push({
           id: parentId,
           type: 'peer', // Treat as peer? or 'unknown'? Using 'peer' for now.
           sdg: 0, // Unknown
           color: getSdgColor(0)
         });
         nodeIds.add(parentId);
      }
    }
  }

  // Add peers
  if (knownNodes && Array.isArray(knownNodes.peers)) {
    for (const peer of knownNodes.peers) {
      if (!nodeIds.has(peer.id)) {
        nodes.push({
          id: peer.id,
          type: 'peer',
          sdg: peer.sdg || 0,
          color: getSdgColor(peer.sdg)
        });
        nodeIds.add(peer.id);
      }

      // Add trust link from self to peer
      // Assuming 'trust' means we trust them.
      if (manifest && manifest.node_id) {
        links.push({
            source: manifest.node_id,
            target: peer.id,
            strength: 0.5 // Arbitrary strength for trust vs lineage
        });
      }
    }
  }

  return { nodes, links };
}
