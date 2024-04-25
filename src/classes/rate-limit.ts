import path from "path";
import Database from "bun:sqlite";

export interface RateLimit {
  ip: string;
  count: number;
  reset: number;
  threshold: number;
  remaining: number;
}

class RateLimiter {
  private db: Database;
  private static instance: RateLimiter;
  private databasePath = path.join(process.cwd(), "databases", "cache.db");

  private constructor() {
    this.db = new Database(this.databasePath, { create: true });
    const stmt1 = this.db.prepare("DROP TABLE IF EXISTS rate_limit");
    stmt1.run();

    const stmt2 = this.db.prepare(
      `CREATE TABLE IF NOT EXISTS rate_limit (
        ip TEXT PRIMARY KEY,
        count INTEGER,
        reset INTEGER,
        threshold INTEGER,
        remaining INTEGER,
        expiration INTEGER
      )`,
    );

    stmt2.run();
  }

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) RateLimiter.instance = new RateLimiter();
    return RateLimiter.instance;
  }

  get(ip: string): RateLimit | null {
    const stmt = this.db.prepare<RateLimit, any>(
      `SELECT * FROM rate_limit WHERE ip = ?`,
    );

    const result = stmt.get(ip);
    if (!result) return null;

    if ((result as any).expiration < Date.now()) this.del(ip);
    return result;
  }

  del(ip: string): void {
    const stmt = this.db.prepare<RateLimit, any>(
      `DELETE FROM rate_limit WHERE ip = ?`,
    );
    stmt.run(ip);
  }

  set(data: RateLimit, ttl: number): void {
    const expiration = Date.now() + ttl * 1000;

    const stmt = this.db.prepare<RateLimit, any>(
      `INSERT OR REPLACE INTO rate_limit (ip, count, reset, threshold, remaining, expiration) VALUES (?, ?, ?, ?, ?, ?)`,
    );

    stmt.run(
      data.ip,
      data.count,
      data.reset,
      data.threshold,
      data.remaining,
      expiration,
    );
  }

  flushAll(): void {
    this.db.exec("DELETE FROM rate_limit");
  }
}

const RateLimitCache = RateLimiter.getInstance();
export default RateLimitCache;
