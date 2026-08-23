const { Client } = require('pg');

const conn = process.env.DATABASE_URL;
if (!conn) {
  console.error('Missing DATABASE_URL environment variable');
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString: conn });
  try {
    await client.connect();
    console.log('Connected to DB');
    const displayName = `Test User ${new Date().toISOString()}`;
    const role = 'tester';
    const insertSql = `INSERT INTO staff_accounts (display_name, role) VALUES ($1, $2) RETURNING staff_account_id, display_name, role, created_at`;
    const res = await client.query(insertSql, [displayName, role]);
    console.log('Inserted row:', res.rows[0]);

    const { rows } = await client.query('SELECT staff_account_id, display_name, role, created_at FROM staff_accounts WHERE staff_account_id = $1', [res.rows[0].staff_account_id]);
    console.log('Verified row:', rows[0]);
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
