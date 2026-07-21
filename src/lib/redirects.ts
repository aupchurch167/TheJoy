import { query } from "./db";

export type Redirect = {
  id: string;
  from_path: string;
  to_path: string;
  status_code: number;
  created_at: string;
};

export async function getRedirect(fromPath: string): Promise<Redirect | null> {
  const rows = await query<Redirect>(
    `SELECT * FROM redirects WHERE from_path = $1 LIMIT 1`,
    [fromPath]
  );
  return rows[0] ?? null;
}

export async function upsertRedirect(
  fromPath: string,
  toPath: string,
  statusCode = 301
): Promise<void> {
  await query(
    `INSERT INTO redirects (from_path, to_path, status_code)
     VALUES ($1, $2, $3)
     ON CONFLICT (from_path)
     DO UPDATE SET to_path = EXCLUDED.to_path, status_code = EXCLUDED.status_code`,
    [fromPath, toPath, statusCode]
  );
}
