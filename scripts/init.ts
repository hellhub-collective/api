import path from "path";
import fs from "fs/promises";
import Database from "bun:sqlite";

const dir = path.join(process.cwd(), "databases");
const db = path.join(dir, "data.db");

await fs.mkdir(dir, { recursive: true });
new Database(db, { create: true }).close();
