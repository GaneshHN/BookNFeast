const fs = require('fs/promises');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    await connection.query(schema);
    console.log('BookNFeast database schema initialized.');
  } finally {
    await connection.end();
  }
}

main().catch(err => {
  console.error('Database initialization failed:', err.code || err.name || 'ERROR', err.message || '');
  process.exit(1);
});
