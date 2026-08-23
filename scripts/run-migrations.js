const { readFileSync, readdirSync } = require('fs');
const { join } = require('path');
const { Client } = require('pg');

const conn = process.env.DATABASE_URL;
if (!conn) {
  console.error('Missing DATABASE_URL environment variable');
  process.exit(1);
}

const client = new Client({ connectionString: conn });

async function applySqlFile(filePath) {
  const sql = readFileSync(filePath, 'utf8');
  console.log('Applying', filePath);
  await client.query(sql);
}

(async () => {
  try {
    await client.connect();
    console.log('Connected to DB');

    const migrationsDir = 'supabase/migrations';
    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const f of files) {
      await applySqlFile(join(migrationsDir, f));
    }

    // seed file
    const seedPath = 'supabase/seed.sql';
    console.log('Applying seed', seedPath);
    await applySqlFile(seedPath);

    const { rows: w } = await client.query('SELECT count(*) AS cnt FROM workspaces;');
    console.log('workspaces_count=', w[0].cnt);

    const { rows: r } = await client.query('SELECT count(*) AS cnt FROM reservations;');
    console.log('reservations_count=', r[0].cnt);
  } catch (err) {
    console.error('Error running migrations/seeds:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
