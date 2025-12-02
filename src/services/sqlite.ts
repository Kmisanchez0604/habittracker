import { Capacitor } from '@capacitor/core';
import { SCHEMA_SQL, DB_NAME } from '../db/schema';
import { CapacitorSQLite, DBSQLiteValues, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

class SqliteService {
    private static _instance: SqliteService | null = null;
    private connection: SQLiteDBConnection | null = null;
    private platform: string | null = null;
    private native: boolean = false;
    private sqlite: SQLiteConnection | null = null;

    private constructor() { }

    static getInstance(): SqliteService {
        if (!SqliteService._instance) SqliteService._instance = new SqliteService();
        return SqliteService._instance;
    }

    private async ensureDefaultCategories() {
        const defaults = [
            { name: 'Alimentación', icon: 'FaUtensils' },
            { name: 'Actividad Física', icon: 'FaRunning' },
            { name: 'Intelectual', icon: 'FaBrain' },
            { name: 'Relajación', icon: 'FaSpa' },
            { name: 'Espiritual', icon: 'FaBible' }
        ];

        try {
            const rows: any[] = await this.querySql('SELECT COUNT(*) as cnt FROM Categories');
            const cnt = rows && rows[0] && rows[0].cnt ? rows[0].cnt : 0;
            if (cnt === 0) {
                for (const c of defaults) {
                    await this.executeSql('INSERT INTO Categories (name, icon, status) VALUES (?,?,1)', [c.name, c.icon]);
                }
            }
        } catch (err) {
            console.warn('ensureDefaultCategories error', err);
        }
    }

    async initializePlugin(): Promise<boolean> {
        this.platform = Capacitor.getPlatform();
        if (this.platform === 'ios' || this.platform === 'android') {
            this.native = true;
        }
        // instantiate SQLiteConnection wrapper once
        this.sqlite = new SQLiteConnection(CapacitorSQLite);
        return true;
    }

    /**
     * Initialize the SQLite database for native platforms (iOS/Android).
     */
    async init(): Promise<SQLiteDBConnection> {
        try {
            if (!this.sqlite) {
                await this.initializePlugin();
            }

            if (!this.sqlite) throw new Error('SQLite plugin not initialized');

            // create or retrieve connection
            const conn = await this.sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);

            await conn.open();

            // execute schema creation
            await conn.execute(SCHEMA_SQL);

            // run migrations / ensure columns exist for backwards compatibility
            await this.migrateSchema();

            this.connection = conn;

            // ensure default categories
            await this.ensureDefaultCategories();

            console.info('Native SQLite initialized and schema created');
            return this.connection;
        } catch (err) {
            console.error('initSqlite error', err);
            throw err;
        }
    }

    /**
     * Add missing columns or create tables when schema evolves.
     * This performs safe ALTER TABLE ADD COLUMN for missing columns.
     */
    private async migrateSchema(): Promise<void> {
        if (!this.connection) return;
        try {
            // Ensure Habits table has required columns
            const pragmaRows = await this.querySql("PRAGMA table_info('Habits')");
            const existingCols = (Array.isArray(pragmaRows) ? pragmaRows : []).map((r: any) => String(r.name || r.NAME || r.Name));

            const needed: Record<string, string> = {
                description: "TEXT",
                frequency: "TEXT DEFAULT 'daily'",
                icon: "TEXT"
            };

            for (const [col, def] of Object.entries(needed)) {
                if (!existingCols.includes(col)) {
                    try {
                        await this.executeSql(`ALTER TABLE Habits ADD COLUMN ${col} ${def}`);
                        console.info(`Added column ${col} to Habits`);
                    } catch (err) {
                        console.warn(`Failed to add column ${col} to Habits`, err);
                    }
                }
            }

            // Ensure HabitCompletions table exists (CREATE TABLE IF NOT EXISTS is idempotent)
            await this.executeSql(`CREATE TABLE IF NOT EXISTS HabitCompletions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  habitId INTEGER NOT NULL,
  date TEXT NOT NULL,
  completed INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (habitId) REFERENCES Habits(id)
);`);
            // Ensure Users table has new columns for profile data
            try {
                const userPragma = await this.querySql("PRAGMA table_info('Users')");
                const userCols = (Array.isArray(userPragma) ? userPragma : []).map((r: any) => String(r.name || r.NAME || r.Name));
                const neededUserCols: Record<string, string> = {
                    fullname: 'TEXT',
                    birthDate: 'TEXT',
                    weight: 'REAL'
                };
                for (const [col, def] of Object.entries(neededUserCols)) {
                    if (!userCols.includes(col)) {
                        try {
                            await this.executeSql(`ALTER TABLE Users ADD COLUMN ${col} ${def}`);
                            console.info(`Added column ${col} to Users`);
                        } catch (err) {
                            console.warn(`Failed to add column ${col} to Users`, err);
                        }
                    }
                }
            } catch (err) {
                console.warn('migrateSchema users columns check failed', err);
            }
        } catch (err) {
            console.warn('migrateSchema error', err);
        }
    }

    getConnection(): SQLiteDBConnection | null {
        return this.connection;
    }

    /** Execute a statement (INSERT/UPDATE/DELETE or statements without returning rows). */
    async executeSql(statement: string, values: any[] = []): Promise<any> {
        if (!this.connection) throw new Error('Native DB connection not initialized');
        try {
            // Prefer using run for parameterized statements
            if (values && values.length > 0 && typeof this.connection.run === 'function') {
                // parameterized statement
                return await this.connection.run(statement, values);
            }

            // For non-parameterized or multiple statements, use execute
            if (typeof this.connection.execute === 'function') {
                return await this.connection.execute(statement);
            }

            // Fallback: try run without params
            if (typeof this.connection.run === 'function') {
                return await this.connection.run(statement);
            }

            throw new Error('No suitable method found on SQLiteDBConnection to execute statement');
        } catch (err) {
            console.error('executeSql native error', err, statement, values);
            throw err;
        }
    }

    /** Run a SELECT query and return rows as objects. */
    async querySql(statement: string, values: any[] = []): Promise<any[]> {
        if (!this.connection) throw new Error('Native DB connection not initialized');
        try {
            // Prefer query API for selects
            const res: DBSQLiteValues | null = await this.connection.query(statement, values && values.length ? values : undefined);
            if (!res) return [];
            if (res.values && res.values.length) return res.values;

            return [];

        } catch (err) {
            console.error('querySql native error', err, statement, values);
            throw err;
        }
    }

    async close(): Promise<void> {
        if (!this.connection) return;
        try {
            await this.connection.close();
            await CapacitorSQLite.closeConnection({ database: DB_NAME });
            this.connection = null;
        } catch (err) {
            console.warn('Error closing sqlite connection', err);
        }
    }
}

const sqlite = SqliteService.getInstance();
export default sqlite;
export { SqliteService };
