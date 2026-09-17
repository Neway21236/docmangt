const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function initDatabase() {
  console.log('--- DMS Database Initialization ---');

  const targetDb = process.env.DATABASE_URL ? 'Cloud PostgreSQL' : (process.env.PGDATABASE || 'dms_db');
  let appClient;

  if (process.env.DATABASE_URL) {
    console.log('Connecting via DATABASE_URL to cloud PostgreSQL...');
    appClient = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
    });
  } else {
    const dbConfig = {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
    };
    console.log(`Target database: ${targetDb} on ${dbConfig.host}:${dbConfig.port} as ${dbConfig.user}`);

    // Step 1: Connect to default postgres DB to ensure target database exists
    const adminClient = new Client({
      ...dbConfig,
      database: 'postgres',
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
    });

    try {
      await adminClient.connect();
      console.log('Connected to PostgreSQL server.');

      const checkDbRes = await adminClient.query(
        `SELECT 1 FROM pg_database WHERE datname = $1;`,
        [targetDb]
      );

      if (checkDbRes.rowCount === 0) {
        console.log(`Database "${targetDb}" does not exist. Creating it now...`);
        await adminClient.query(`CREATE DATABASE "${targetDb}";`);
        console.log(`Database "${targetDb}" created successfully.`);
      } else {
        console.log(`Database "${targetDb}" already exists.`);
      }
    } catch (err) {
      console.error('Error checking/creating database with admin client:', err.message);
      throw err;
    } finally {
      await adminClient.end();
    }

    appClient = new Client({
      ...dbConfig,
      database: targetDb,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
    });
  }

  try {
    await appClient.connect();
    console.log(`Connected to database "${targetDb}".`);

    const schemaFiles = [
      'init.sql',
      'phase2_schema.sql',
      'phase3_search_indexes.sql',
      'phase4_schema.sql',
      'phase5_schema.sql',
      'phase6_schema.sql',
    ];

    for (const file of schemaFiles) {
      const sqlPath = path.join(__dirname, file);
      if (fs.existsSync(sqlPath)) {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await appClient.query(sql);
        console.log(`Schema file applied successfully: ${file}`);
      }
    }
    console.log('All schema tables, extensions, and triggers applied successfully.');

    // Step 3: Seed initial demo users
    const seedUsers = [
      // Standard docsphere.com accounts (documented in README)
      {
        email: 'admin@docsphere.com',
        password: 'password123',
        first_name: 'System',
        last_name: 'Admin',
        role: 'ADMIN',
      },
      {
        email: 'manager@docsphere.com',
        password: 'password123',
        first_name: 'Operations',
        last_name: 'Manager',
        role: 'MANAGER',
      },
      {
        email: 'viewer@docsphere.com',
        password: 'password123',
        first_name: 'General',
        last_name: 'Viewer',
        role: 'VIEWER',
      },
      // Backwards-compatible example.com accounts
      {
        email: 'admin@example.com',
        password: 'AdminPassword123!',
        first_name: 'System',
        last_name: 'Admin',
        role: 'ADMIN',
      },
      {
        email: 'manager@example.com',
        password: 'ManagerPassword123!',
        first_name: 'Operations',
        last_name: 'Manager',
        role: 'MANAGER',
      },
      {
        email: 'viewer@example.com',
        password: 'ViewerPassword123!',
        first_name: 'General',
        last_name: 'Viewer',
        role: 'VIEWER',
      },
    ];

    for (const u of seedUsers) {
      const existing = await appClient.query('SELECT id FROM users WHERE email = $1;', [u.email]);
      const hash = await bcrypt.hash(u.password, 10);
      if (existing.rowCount === 0) {
        await appClient.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, role)
           VALUES ($1, $2, $3, $4, $5);`,
          [u.email, hash, u.first_name, u.last_name, u.role]
        );
        console.log(`Seeded ${u.role} user: ${u.email} (Password: ${u.password})`);
      } else {
        // Ensure role and password match expected seed state
        await appClient.query(
          `UPDATE users SET role = $1, password_hash = $2, is_active = true WHERE email = $3;`,
          [u.role, hash, u.email]
        );
        console.log(`Updated user ${u.email} to role ${u.role} (Password: ${u.password}).`);
      }
    }

    console.log('Database initialization & seeding complete!');
  } catch (err) {
    console.error('Failed to apply schema or seed database:', err);
    throw err;
  } finally {
    await appClient.end();
  }
}

if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal initialization error:', err);
      process.exit(1);
    });
}

module.exports = { initDatabase };
