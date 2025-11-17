import { Capacitor } from '@capacitor/core';
import { SCHEMA_SQL, DB_NAME } from '../db/schema';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

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
            const res = await this.connection.query(statement, values);
            if (res && res.values && res.values.length) return res.values;

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
