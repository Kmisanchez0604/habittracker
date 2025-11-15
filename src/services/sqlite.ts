import { Capacitor } from '@capacitor/core';
import { SCHEMA_SQL, DB_NAME } from '../db/schema';

let connection: any = null;
let webDb: any = null; // sql.js Database instance for web
const WEB_STORAGE_KEY = `${DB_NAME}_data`;

async function persistWebDb() {
  if (!webDb) return;
  const u8 = webDb.export();
  // convert to base64
  const b64 = btoa(String.fromCharCode(...u8));
  localStorage.setItem(WEB_STORAGE_KEY, b64);
}

function loadWebDbFromStorage(SQL: any) {
  const b64 = localStorage.getItem(WEB_STORAGE_KEY);
  if (!b64) return new SQL.Database();
  const str = atob(b64);
  const u8 = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) u8[i] = str.charCodeAt(i);
  return new SQL.Database(u8);
}

async function ensureDefaultCategories() {
  const defaults = [
    { name: 'Alimentación', icon: 'FaUtensils' },
    { name: 'Actividad Física', icon: 'FaRunning' },
    { name: 'Intelectual', icon: 'FaBrain' },
    { name: 'Relajación', icon: 'FaSpa' },
    { name: 'Espiritual', icon: 'FaBible' }
  ];

  try {
    const rows: any[] = await querySql('SELECT COUNT(*) as cnt FROM Categories');
    const cnt = rows && rows[0] && rows[0].cnt ? rows[0].cnt : 0;
    if (cnt === 0) {
      for (const c of defaults) {
        await executeSql('INSERT INTO Categories (name, icon, status) VALUES (?,?,1)', [c.name, c.icon]);
      }
    }
  } catch (err) {
    console.warn('ensureDefaultCategories error', err);
  }
}

/**
 * Initialize the SQLite database. On native platforms it uses the Capacitor plugin.
 * On web it uses sql.js (WebAssembly) and persists the DB to localStorage.
 */
export async function initSqlite(): Promise<any> {
  const platform = Capacitor.getPlatform();

  try {
    if (platform === 'web') {
      // dynamic import of sql.js
      // sql-wasm.wasm will be loaded from the CDN; you can change locateFile if you prefer local copy
      // @ts-ignore
      const initSqlJs = (await import('sql.js')).default || (await import('sql.js'));
      const SQL = await initSqlJs({ locateFile: (file: string) => `https://sql.js.org/dist/${file}` });
      webDb = loadWebDbFromStorage(SQL);

      // create tables if not exist
      webDb.run(SCHEMA_SQL);
      await persistWebDb();

      // ensure default categories exist
      await ensureDefaultCategories();

      console.info('Web sql.js initialized');
      return webDb;
    }

    // Native (iOS/Android) branch
    // dynamic import so bundlers don't fail when plugin is not installed for web builds
    // @ts-ignore
    const mod = await import('@capacitor-community/sqlite');
    const { CapacitorSQLite } = mod;

    const conn = await CapacitorSQLite.createConnection({
      database: DB_NAME,
      version: 1,
      encrypted: false,
      mode: 'no-encryption'
    });

    await conn.open();
    await conn.execute({ statements: SCHEMA_SQL });
    connection = conn;

    // ensure default categories
    await ensureDefaultCategories();

    console.info('Native SQLite initialized and schema created');
    return connection;
  } catch (err) {
    console.error('initSqlite error', err);
    throw err;
  }
}

export function getConnection(): any {
  return connection || webDb;
}

function sqlJsResultsToRows(results: any[]): any[] {
  if (!results || results.length === 0) return [];
  const res = results[0];
  const cols: string[] = res.columns;
  const values: any[][] = res.values;
  return values.map((row) => {
    const obj: any = {};
    for (let i = 0; i < cols.length; i++) obj[cols[i]] = row[i];
    return obj;
  });
}

/** Execute a statement (INSERT/UPDATE/DELETE or multiple statements). */
export async function executeSql(statement: string, values: any[] = []): Promise<any> {
  const platform = Capacitor.getPlatform();
  if (platform === 'web') {
    if (!webDb) throw new Error('Web DB not initialized');
    // sql.js doesn't support parameterized multi-statement easily via run on a single string.
    // For simplicity, if values provided and single statement, use run with params.
    try {
      if (values && values.length > 0) {
        webDb.run(statement, values);
      } else {
        webDb.run(statement);
      }
      await persistWebDb();
      return { success: true };
    } catch (err) {
      console.error('executeSql web error', err, statement, values);
      throw err;
    }
  }

  if (!connection) throw new Error('Native DB connection not initialized');
  try {
    // try run (single statement)
    if (connection.run) {
      // some plugin versions expose run with { statement, values }
      if (Array.isArray(values) && values.length > 0) {
        if (typeof connection.run === 'function') {
          // try both call styles
          try {
            return await connection.run({ statement, values });
          } catch (e) {
            return await connection.run(statement, values);
          }
        }
      } else {
        try {
          return await connection.execute({ statements: statement });
        } catch (e) {
          return await connection.run(statement);
        }
      }
    }

    // fallback to execute
    return await connection.execute({ statements: statement });
  } catch (err) {
    console.error('executeSql native error', err, statement, values);
    throw err;
  }
}

/** Run a SELECT query and return rows as objects. */
export async function querySql(statement: string, values: any[] = []): Promise<any[]> {
  const platform = Capacitor.getPlatform();
  if (platform === 'web') {
    if (!webDb) throw new Error('Web DB not initialized');
    try {
      const results = webDb.exec(statement, values && values.length ? values : undefined);
      return sqlJsResultsToRows(results);
    } catch (err) {
      console.error('querySql web error', err, statement, values);
      throw err;
    }
  }

  if (!connection) throw new Error('Native DB connection not initialized');
  try {
    // try connection.query({ statement, values })
    if (connection.query) {
      try {
        const res = await connection.query({ statement, values });
        // plugin returns { values: [...], columns: [...] } or { result: [] }
        if (res && res.values && res.values.length) return res.values;
        if (res && res.rows) return res.rows;
        return res && res.result ? res.result : res;
      } catch (e) {
        // try alternative call
        const res = await connection.query(statement, values);
        return res && res.values ? res.values : res;
      }
    }

    // fallback: try execute and parse result
    const execRes = await connection.execute({ statements: statement });
    // execute usually returns no rows for selects in some plugin versions
    // try query via run/select
    return execRes;
  } catch (err) {
    console.error('querySql native error', err, statement, values);
    throw err;
  }
}

export async function closeSqlite(): Promise<void> {
  const platform = Capacitor.getPlatform();
  if (platform === 'web') {
    // persist web DB
    await persistWebDb();
    webDb = null;
    return;
  }

  if (!connection) return;
  try {
    await connection.close();
    // @ts-ignore
    const mod = await import('@capacitor-community/sqlite');
    await mod.CapacitorSQLite.closeConnection({ database: DB_NAME });
    connection = null;
  } catch (err) {
    console.warn('Error closing sqlite connection', err);
  }
}
