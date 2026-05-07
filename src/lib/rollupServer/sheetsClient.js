const { google } = require("googleapis");
const { config } = require("./config");

const cache = new Map();

function normalizeTabTitle(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    // normalize dash variants (hyphen/en-dash/em-dash)
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/\s+/g, " ");
}

function summarizeGoogleSheetsError(err) {
  const status = err?.response?.status;
  const statusText = err?.response?.statusText;
  const apiMessage =
    err?.response?.data?.error?.message ||
    err?.response?.data?.error?.errors?.[0]?.message ||
    err?.message ||
    String(err);
  const bits = [];
  if (status) bits.push(`HTTP ${status}${statusText ? ` ${statusText}` : ""}`);
  bits.push(apiMessage);
  return bits.join(" — ");
}

function wrapSheetsError(context, err) {
  const base = summarizeGoogleSheetsError(err);
  const spreadsheetId = config?.spreadsheetId || "";
  return new Error(`${context} (spreadsheetId=${spreadsheetId}): ${base}`);
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s%/-]/g, "");
}

function keyForHeader(header) {
  return normalizeHeader(header)
    .replace(/[%/()-]/g, " ")
    .replace(/\s+/g, "_");
}

async function getSheetsApi() {
  const auth = new google.auth.JWT({
    email: config.serviceAccountEmail,
    key: config.privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
  });
  await auth.authorize();
  return google.sheets({ version: "v4", auth });
}

async function getSpreadsheetTabTitles() {
  try {
    const sheets = await getSheetsApi();
    const resp = await sheets.spreadsheets.get({
      spreadsheetId: config.spreadsheetId
    });
    const tabs = resp.data.sheets || [];
    return tabs
      .map((s) => s?.properties?.title)
      .filter((t) => typeof t === "string" && t.trim().length > 0);
  } catch (e) {
    throw wrapSheetsError("Failed to read spreadsheet metadata (spreadsheets.get)", e);
  }
}

async function getTabRows(tabName, options = {}) {
  const includeFormulas = Boolean(options.includeFormulas);
  const headerRow = Number(options.headerRow || 1);
  const cacheKey = `${tabName}|h${headerRow}|${includeFormulas ? "formula" : "value"}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < config.cacheTtlMs) return cached.payload;

  const sheets = await getSheetsApi();
  const makeRange = (title) => `'${String(title).replace(/'/g, "''")}'!A:ZZZ`;
  // A1 notation: quote tab names that contain spaces/dashes and include an explicit column range.
  const range = makeRange(tabName);
  let response;
  try {
    response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range,
      valueRenderOption: "UNFORMATTED_VALUE"
    });
  } catch (e) {
    const apiMessage =
      e?.response?.data?.error?.message ||
      e?.response?.data?.error?.errors?.[0]?.message ||
      e?.message ||
      "";
    const looksLikeParseRange =
      typeof apiMessage === "string" && apiMessage.toLowerCase().includes("unable to parse range");
    if (looksLikeParseRange) {
      // Often caused by subtle tab-title differences (e.g. " - " vs " — ").
      // Try to resolve the actual tab title from spreadsheet metadata and retry once.
      const availableTabs = await getSpreadsheetTabTitles().catch(() => []);
      const want = normalizeTabTitle(tabName);
      const match = availableTabs.find((t) => normalizeTabTitle(t) === want);
      if (match && match !== tabName) {
        try {
          response = await sheets.spreadsheets.values.get({
            spreadsheetId: config.spreadsheetId,
            range: makeRange(match),
            valueRenderOption: "UNFORMATTED_VALUE"
          });
        } catch (e2) {
          throw wrapSheetsError(
            `Failed to read tab values (values.get) for tab "${tabName}" (retry matched "${match}") range ${range}`,
            e2
          );
        }
      }
    }
    throw wrapSheetsError(
      `Failed to read tab values (values.get) for tab "${tabName}" range ${range}`,
      e
    );
  }

  const values = response.data.values || [];
  if (!values.length) {
    const empty = { headers: [], rows: [] };
    cache.set(cacheKey, { ts: Date.now(), payload: empty });
    return empty;
  }

  const headerIndex = Math.max(0, headerRow - 1);
  const headers = values[headerIndex] || values[0] || [];
  const headerKeys = headers.map(keyForHeader);
  const bodyRows = values.slice(headerIndex + 1);

  let formulaRows = null;
  if (includeFormulas) {
    let formulaResp;
    try {
      formulaResp = await sheets.spreadsheets.values.get({
        spreadsheetId: config.spreadsheetId,
        range,
        valueRenderOption: "FORMULA"
      });
    } catch (e) {
      throw wrapSheetsError(
        `Failed to read tab formulas (values.get) for tab "${tabName}" range ${range}`,
        e
      );
    }
    formulaRows = (formulaResp.data.values || []).slice(headerIndex + 1);
  }

  const rows = bodyRows.map((row, rowIdx) => {
    const out = {};
    headerKeys.forEach((key, colIdx) => {
      const value = row[colIdx];
      if (value !== undefined && value !== null && value !== "") {
        out[key] = value;
      }
      if (formulaRows) {
        const maybeFormula = formulaRows[rowIdx] ? formulaRows[rowIdx][colIdx] : null;
        if (typeof maybeFormula === "string" && maybeFormula.startsWith("=")) {
          out[`${key}_formula`] = maybeFormula;
        }
      }
    });
    return out;
  });

  const payload = { headers, rows };
  cache.set(cacheKey, { ts: Date.now(), payload });
  return payload;
}

function clearCache() {
  cache.clear();
}

module.exports = {
  getTabRows,
  getSpreadsheetTabTitles,
  clearCache,
  normalizeHeader
};
