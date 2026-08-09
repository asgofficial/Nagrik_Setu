import { Client } from 'pg';
import { hashPassword, comparePassword } from './password';

export interface DbUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  phone?: string;
  role: 'citizen' | 'officer' | 'admin';
  created_at: string;
  updated_at: string;
}

// In-memory fallback cache for fast lookups and offline / mock environments
const memoryUsers = new Map<string, DbUser>();

let dbInitialized = false;

async function getPgClient(): Promise<Client | null> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  try {
    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    return client;
  } catch (err) {
    console.warn('[AuthStore] PostgreSQL direct connection skipped (using fallback store):', err);
    return null;
  }
}

async function ensureTableAndSeed() {
  if (dbInitialized) return;
  dbInitialized = true;

  // Initialize in-memory seed accounts
  const citizenHash = await hashPassword('Citizen@123');
  const officerHash = await hashPassword('Officer@123');
  const adminHash = await hashPassword('Admin@123');

  const defaultUsers: DbUser[] = [
    {
      id: 'demo_citizen_001',
      email: 'citizen@nagriksetu.gov.in',
      password_hash: citizenHash,
      name: 'Amit Das',
      phone: '9876543210',
      role: 'citizen',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'demo_officer_001',
      email: 'officer@nagriksetu.gov.in',
      password_hash: officerHash,
      name: 'Subhasish Sen (Ward Officer)',
      phone: '9876543211',
      role: 'officer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'demo_admin_001',
      email: 'admin@nagriksetu.gov.in',
      password_hash: adminHash,
      name: 'System Administrator',
      phone: '9876543212',
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ];

  for (const u of defaultUsers) {
    memoryUsers.set(u.email.toLowerCase(), u);
  }

  // Attempt database table initialization
  const client = await getPgClient();
  if (!client) return;

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.auth_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL DEFAULT 'citizen',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Seed default accounts in PostgreSQL if not present
    for (const u of defaultUsers) {
      await client.query(`
        INSERT INTO public.auth_users (id, email, password_hash, name, phone, role)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (email) DO NOTHING;
      `, [u.id, u.email.toLowerCase(), u.password_hash, u.name, u.phone, u.role]);
    }
  } catch (err) {
    console.warn('[AuthStore] Database schema sync skipped:', err);
  } finally {
    try { await client.end(); } catch {}
  }
}

/**
 * Finds user by email from database or in-memory store.
 */
export async function findUserByEmail(email: string): Promise<DbUser | null> {
  await ensureTableAndSeed();
  const normalizedEmail = email.trim().toLowerCase();

  const client = await getPgClient();
  if (client) {
    try {
      const res = await client.query('SELECT * FROM public.auth_users WHERE email = $1 LIMIT 1', [normalizedEmail]);
      if (res.rows.length > 0) {
        const u = res.rows[0];
        const dbUser: DbUser = {
          id: u.id,
          email: u.email,
          password_hash: u.password_hash,
          name: u.name,
          phone: u.phone,
          role: u.role,
          created_at: u.created_at,
          updated_at: u.updated_at
        };
        memoryUsers.set(normalizedEmail, dbUser);
        return dbUser;
      }
    } catch (err) {
      console.warn('[AuthStore] findUserByEmail DB error, falling back:', err);
    } finally {
      try { await client.end(); } catch {}
    }
  }

  return memoryUsers.get(normalizedEmail) || null;
}

/**
 * Finds user by ID from database or in-memory store.
 */
export async function findUserById(id: string): Promise<DbUser | null> {
  await ensureTableAndSeed();

  const client = await getPgClient();
  if (client) {
    try {
      const res = await client.query('SELECT * FROM public.auth_users WHERE id = $1 LIMIT 1', [id]);
      if (res.rows.length > 0) {
        const u = res.rows[0];
        return {
          id: u.id,
          email: u.email,
          password_hash: u.password_hash,
          name: u.name,
          phone: u.phone,
          role: u.role,
          created_at: u.created_at,
          updated_at: u.updated_at
        };
      }
    } catch (err) {
      console.warn('[AuthStore] findUserById DB error, falling back:', err);
    } finally {
      try { await client.end(); } catch {}
    }
  }

  for (const user of memoryUsers.values()) {
    if (user.id === id) return user;
  }
  return null;
}

/**
 * Registers a new user with hashed password.
 */
export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: 'citizen' | 'officer' | 'admin';
}): Promise<DbUser> {
  await ensureTableAndSeed();
  const normalizedEmail = data.email.trim().toLowerCase();

  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    throw new Error('An account with this email address already exists.');
  }

  const password_hash = await hashPassword(data.password);
  const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();

  const newUser: DbUser = {
    id,
    email: normalizedEmail,
    password_hash,
    name: data.name.trim(),
    phone: data.phone?.trim() || undefined,
    role: data.role || 'citizen',
    created_at: now,
    updated_at: now
  };

  memoryUsers.set(normalizedEmail, newUser);

  const client = await getPgClient();
  if (client) {
    try {
      await client.query(`
        INSERT INTO public.auth_users (id, email, password_hash, name, phone, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [newUser.id, newUser.email, newUser.password_hash, newUser.name, newUser.phone || null, newUser.role, newUser.created_at, newUser.updated_at]);
    } catch (err) {
      console.warn('[AuthStore] createUser DB insert error (stored in memory fallback):', err);
    } finally {
      try { await client.end(); } catch {}
    }
  }

  return newUser;
}
