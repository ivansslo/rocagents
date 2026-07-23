import 'dotenv/config';
import { runOrchestrator } from './server/orchestrator.js';

async function test() {
  console.log("=== TESTING ROADQWEN TOOL CALLING & SUMMARY ===");
  const res = await runOrchestrator([
    { role: 'user', text: 'apakah ada kemajuan ui agent ini' }
  ], { provider: 'roadqwen', model: 'qwen3.6-plus' });

  console.log("\nResponse text:\n", res.text);
  console.log("\nLogs count:", res.logs.length);
}

test().catch(console.error);
