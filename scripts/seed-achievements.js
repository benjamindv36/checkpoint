#!/usr/bin/env node
/*
 * Seed achievements script
 * Usage:
 *  - Configure env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 *  - node scripts/seed-achievements.js
 * If Supabase is not configured, this script writes a local fallback JSON file
 * at `agent-os/specs/2025-11-17-basic-visual-interface/implementation/seed-demo.json`.
 */

const fs = require('fs');
const path = require('path');

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const sample = [
    {
      id: 'seed-1',
      text: 'Finished initial UI skeleton',
      points: 25,
      completed_at: new Date().toISOString(),
    },
    {
      id: 'seed-2',
      text: 'Added header and routes',
      points: 10,
      completed_at: new Date().toISOString(),
    },
  ];

  if (!supabaseUrl || !supabaseAnonKey) {
    const outDir = path.join(__dirname, '..', 'agent-os', 'specs', '2025-11-17-basic-visual-interface', 'implementation');
    try {
      fs.mkdirSync(outDir, { recursive: true });
      const outPath = path.join(outDir, 'seed-demo.json');
      fs.writeFileSync(outPath, JSON.stringify(sample, null, 2), 'utf8');
      console.log('Supabase not configured. Wrote local demo data to:', outPath);
      process.exit(0);
    } catch (e) {
      console.error('Failed to write local seed file:', e);
      process.exit(1);
    }
  }

  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    for (const row of sample) {
      const { data, error } = await supabase.from('achievement_log').insert([
        {
          id: row.id,
          text: row.text,
          points: row.points,
          completed_at: row.completed_at,
        },
      ]);
      if (error) {
        console.error('Insert error:', error.message || error);
      } else {
        console.log('Inserted row:', data);
      }
    }
    console.log('Seed complete.');
  } catch (err) {
    console.error('Supabase seed failed:', err.message || err);
    process.exit(1);
  }
}

run();
