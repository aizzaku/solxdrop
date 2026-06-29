import Papa from "papaparse";

export interface CsvRow {
  username?: string;
  wallet_address?: string;
  amount?: string;
}

/**
 * Parse a CSV file in the browser. Expected headers (all optional, case-insensitive):
 * username, wallet_address, amount. Also tolerates `wallet` / `address`.
 */
export function parseCsv(file: File): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: (results) => {
        const rows = (results.data as Record<string, string>[]).map((r) => ({
          username: (r.username ?? r.user ?? r.handle ?? "").trim(),
          wallet_address: (
            r.wallet_address ??
            r.wallet ??
            r.address ??
            ""
          ).trim(),
          amount: (r.amount ?? r.qty ?? "").trim(),
        }));
        resolve(rows);
      },
      error: (err) => reject(err),
    });
  });
}
