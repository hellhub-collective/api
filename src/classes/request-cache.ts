import path from "path";
import Database from "bun:sqlite";
import type { StatusCode } from "hono/utils/http-status";

interface CachedRequest {
  key: string;
  data: object;
  status: StatusCode;
  expiration: number;
}

class Cache {
  private db: Database;
  private static instance: Cache;
  private databasePath = path.join(process.cwd(), "databases", "cache.db");

  private constructor() {
    this.db = new Database(this.databasePath, { create: true });
    const stmt1 = this.db.prepare("DROP TABLE IF EXISTS request_cache");
    stmt1.run();

    const stmt2 = this.db.prepare(
      `CREATE TABLE request_cache (
        key TEXT PRIMARY KEY,
        status INTEGER,
        data STRING,
        expiration INTEGER
      )`,
    );

    stmt2.run();
  }

  public static getInstance(): Cache {
    if (!Cache.instance) Cache.instance = new Cache();
    return Cache.instance;
  }

  get(key: string): CachedRequest | null {
    const stmt = this.db.prepare<CachedRequest, any>(
      `SELECT * FROM request_cache WHERE key = ?`,
    );

    const result = stmt.get(key);
    if (!result) return null;

    if (result.expiration < Date.now()) this.del(key);
    return { ...result, data: JSON.parse(result.data as any) };
  }

  del(key: string): void {
    const stmt = this.db.prepare<CachedRequest, any>(
      `DELETE FROM request_cache WHERE key = ?`,
    );
    stmt.run(key);
  }

  set(data: CachedRequest, ttl: number): void {
    const expiration = Date.now() + ttl * 1000;

    const stmt = this.db.prepare<CachedRequest, any>(
      `INSERT OR REPLACE INTO request_cache (key, status, data, expiration) VALUES (?, ?, ?, ?)`,
    );

    stmt.run(data.key, data.status, JSON.stringify(data.data), expiration);
  }

  flushAll(): void {
    this.db.exec("DELETE FROM request_cache");
  }
}

const RequestCache = Cache.getInstance();
export default RequestCache;
