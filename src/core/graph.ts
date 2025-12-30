import { join } from 'jsr:@std/path@1.1.2';
import { listDir, readText, writeText } from '../tools/fsTools.ts';

export async function generateGraph(cwd: string): Promise<void> {
    const universe: any = {
        nodes: [],
        links: [],
        timestamp: new Date().toISOString()
    };

    // Add self
    universe.nodes.push({
        id: 'root',
        type: 'root',
        path: cwd
    });

    // Scan goals
    try {
        const goals = await readText(join(cwd, 'goals', 'README.md'));
        if (goals) {
            universe.nodes.push({
                id: 'goals',
                type: 'goals',
                content: goals.substring(0, 100) + '...'
            });
            universe.links.push({ source: 'root', target: 'goals' });
        }
    } catch {}

    // Scan foundations
    try {
         const foundationsPath = join(cwd, 'foundations');
         const foundations = await listDir(foundationsPath);
         if (foundations.length > 0) {
             universe.nodes.push({ id: 'foundations', type: 'category' });
             universe.links.push({ source: 'root', target: 'foundations' });

             for (const f of foundations) {
                 if (!f.startsWith('.')) {
                     universe.nodes.push({ id: `foundation:${f}`, type: 'foundation', name: f });
                     universe.links.push({ source: 'foundations', target: `foundation:${f}` });
                 }
             }
         }
    } catch {}

    // Scan topics
    try {
        const topicsPath = join(cwd, 'topics');
        const topics = await listDir(topicsPath);
        if (topics.length > 0) {
            universe.nodes.push({ id: 'topics', type: 'category' });
            universe.links.push({ source: 'root', target: 'topics' });

            for (const t of topics) {
                 universe.nodes.push({ id: `topic:${t}`, type: 'topic', name: t });
                 universe.links.push({ source: 'topics', target: `topic:${t}` });
            }
        }
    } catch {}

    // Save universe.json
    await writeText(join(cwd, 'universe.json'), JSON.stringify(universe, null, 2));
    console.log(`Universe map saved to ${join(cwd, 'universe.json')}`);
}
