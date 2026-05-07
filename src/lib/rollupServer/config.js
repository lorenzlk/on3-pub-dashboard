const config = {
  port: Number(process.env.PORT || 3030),
  spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "",
  serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
  privateKey: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  cacheTtlMs: Number(process.env.CACHE_TTL_MS || 300000),
  tabs: {
    // Penske workbook currently exposes a single consolidated tab.
    // We read the same tab for weekly + monthly rollup until the sheet is split into dedicated tabs.
    weekly: { name: "Penske Rollup", headerRow: 2 },
    monthlyNetwork: { name: "Penske Rollup", headerRow: 2 },
    monthlyPublishers: { name: "Penske Rollup", headerRow: 2 }
  }
};

function validateConfig() {
  const missing = [];
  if (!config.spreadsheetId) missing.push("GOOGLE_SHEETS_SPREADSHEET_ID");
  if (!config.serviceAccountEmail) missing.push("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  if (!config.privateKey) missing.push("GOOGLE_PRIVATE_KEY");
  return missing;
}

module.exports = {
  config,
  validateConfig
};
