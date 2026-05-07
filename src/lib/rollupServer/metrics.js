function parseNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const cleaned = String(value).replace(/[$,%\s,]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Google Sheets often returns dates as serials with UNFORMATTED_VALUE.
 * Serials are days since 1899-12-30 (Excel-compatible); use UTC midnight to avoid TZ drift.
 */
function formatSheetsDateLike(value) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
    return trimmed;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const epochUtcMs = Date.UTC(1899, 11, 30) + Math.round(value) * 86400000;
    return new Date(epochUtcMs).toISOString().slice(0, 10);
  }
  return String(value);
}

/** Normalized header keys from writeRollupToSheet row 2 (see Code.js). */
const K = {
  publisher: ["publisher", "site", "property"],
  totalRev: ["total_rev", "total_revenue", "revenue"],
  affiliateRev: ["affiliate_rev", "affiliate_revenue", "aff_rev", "aff_revenue"],
  emailRev: ["email_rev", "email_revenue", "emailrev"],
  kvpRev: ["kvp_rev", "kvp_revenue"],
  /** Optional: estimated KVP revenue (e.g. sheet header "KVP Rev (Est)"). */
  kvpRevEst: [
    "kvp_rev_est",
    "kvp_rev_estimated",
    "kvp_est_rev",
    "kvp_estimated_rev"
  ],
  /** Optional: KVP impressions/counts (used for yield diagnostics). */
  kvpImpressions: ["kvp_impressions", "kvp_imps", "kvp_imp"],
  videoRev: ["video_rev", "vid_rev", "video_revenue"],
  nativeRev: ["native_rev", "nat_rev", "native_revenue"],
  sessions: ["sessions", "total_sessions"],
  totalRps: ["total_rps", "rps"],
  totalRpm: ["total_rpm", "rpm"],
  totalVrpm: ["total_vrpm", "vrpm"],
  affRpm: ["affiliate_rpm", "aff_rpm"],
  emailRpm: ["email_rpm"],
  kvpRpm: ["kvp_rpm"],
  videoRpm: ["video_rpm"],
  nativeRpm: ["native_rpm"],
  humanViews: ["human_views"],
  botPvs: ["bot_pvs"],
  totalPvs: ["total_pvs"],
  /** SS / SmartScroll in-view counts (first matching column wins). */
  smartScrollViews: [
    "ss_in_views",
    "smart_scroll_in_views",
    "in_views",
    "smart_scroll_views"
  ],
  /**
   * Eligible widget serves (loads). Headers are normalized to snake_case in sheetsClient.
   * Add aliases here if the rollup renames columns.
   */
  widgetLoads: [
    "widget_loads",
    "widget_load",
    "widget_load_count",
    "total_widget_loads",
    "eligible_widget_loads",
    "eligible_loads",
    "eligible_serves",
    "widget_serves",
    "widget_impressions"
  ],
  pvPerSession: ["pv_session", "pv_per_session"],
  sessionTime: ["session_time"],
  totalClicks: ["total_clicks", "clicks"]
};

const MONTH_TO_NUM = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12
};

function pick(row, aliases) {
  for (const key of aliases) {
    if (row[key] !== undefined) return row[key];
  }
  return undefined;
}

function pickNumber(row, aliases) {
  return parseNumber(pick(row, aliases));
}

function monthParts(row) {
  const monthRaw = pick(row, ["month", "month_name", "mo"]);
  const yearRaw = pick(row, ["year", "yr"]);
  const monthVal = String(monthRaw || "").trim();
  const yearVal = Number(yearRaw);
  const monthNum = monthToNumber(monthVal);
  return {
    month: monthVal,
    monthNum,
    year: Number.isFinite(yearVal) ? yearVal : null
  };
}

function monthToNumber(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") {
    const n = Math.floor(raw);
    return n >= 1 && n <= 12 ? n : null;
  }
  const cleaned = String(raw).trim().toLowerCase();
  if (!cleaned) return null;
  if (/^\d+$/.test(cleaned)) {
    const n = Number(cleaned);
    return n >= 1 && n <= 12 ? n : null;
  }
  if (MONTH_TO_NUM[cleaned]) return MONTH_TO_NUM[cleaned];
  const startsWith = Object.keys(MONTH_TO_NUM).find((name) => name.startsWith(cleaned));
  return startsWith ? MONTH_TO_NUM[startsWith] : null;
}

function monthLabelFromNum(monthNum) {
  const pair = Object.entries(MONTH_TO_NUM).find(([, n]) => n === monthNum);
  if (!pair) return "";
  return pair[0][0].toUpperCase() + pair[0].slice(1);
}

function monthKey(row) {
  const parts = monthParts(row);
  if (!parts.year || !parts.monthNum) return null;
  return parts.year * 100 + parts.monthNum;
}

function monthKeyFromFilter(month, year) {
  const monthNum = monthToNumber(month);
  const yearNum = Number(year);
  if (!monthNum || !Number.isFinite(yearNum)) return null;
  return yearNum * 100 + monthNum;
}

function extractAvailableMonthKeys(rows) {
  return Array.from(
    new Set(
      rows
        .map((r) => monthKey(r))
        .filter((v) => Number.isFinite(v))
    )
  ).sort((a, b) => a - b);
}

function resolveTargetPeriod(rows, filters) {
  const available = extractAvailableMonthKeys(rows);
  const requested = monthKeyFromFilter(filters.month, filters.year);
  const selectedKey = requested && available.includes(requested)
    ? requested
    : (available[available.length - 1] || null);

  if (!selectedKey) {
    return {
      selectedKey: null,
      selectedMonth: null,
      selectedYear: null,
      previousKey: null
    };
  }

  const selectedYear = Math.floor(selectedKey / 100);
  const selectedMonth = selectedKey % 100;
  const previousKey = [...available].reverse().find((k) => k < selectedKey) || null;
  return { selectedKey, selectedMonth, selectedYear, previousKey };
}

function rowMatchesKey(row, key) {
  if (!key) return false;
  return monthKey(row) === key;
}

function maybeExcludeNetworkTotal(row) {
  const publisher = String(pick(row, ["publisher", "site", "property"]) || "").toLowerCase();
  return publisher !== "network total";
}

function pickNetworkSummaryRow(rowsForMonth) {
  if (!rowsForMonth.length) return {};
  const networkRow = rowsForMonth.find((r) => {
    const p = String(pick(r, ["publisher", "site", "property"]) || "").toLowerCase();
    return p === "network total";
  });
  return networkRow || rowsForMonth[rowsForMonth.length - 1];
}

function ratioChange(current, previous) {
  if (!previous) return null;
  return (current - previous) / previous;
}

function buildKpis(monthlyNetworkRows, monthlyPublisherRows, filters) {
  const period = resolveTargetPeriod(monthlyNetworkRows, filters);
  const currentNetwork = pickNetworkSummaryRow(monthlyNetworkRows.filter((r) => rowMatchesKey(r, period.selectedKey)));
  const previousNetwork = pickNetworkSummaryRow(monthlyNetworkRows.filter((r) => rowMatchesKey(r, period.previousKey)));

  const filteredPublishers = monthlyPublisherRows
    .filter((r) => rowMatchesKey(r, period.selectedKey))
    .filter(maybeExcludeNetworkTotal);

  const totalRevenue = pickNumber(currentNetwork, K.totalRev);
  const prevTotalRevenue = pickNumber(previousNetwork, K.totalRev);
  const sessions = pickNumber(currentNetwork, K.sessions);
  const rps = pickNumber(currentNetwork, K.totalRps);
  const affiliateRevenue = pickNumber(currentNetwork, K.affiliateRev);
  const emailRevenue = pickNumber(currentNetwork, K.emailRev);
  const kvpRevenue = pickNumber(currentNetwork, K.kvpRev);
  const videoRevenue = pickNumber(currentNetwork, K.videoRev);
  const nativeRevenue = pickNumber(currentNetwork, K.nativeRev);
  const totalRpm = pickNumber(currentNetwork, K.totalRpm);
  const totalVrpm = pickNumber(currentNetwork, K.totalVrpm);
  const humanViews = pickNumber(currentNetwork, K.humanViews);
  const totalPVs = pickNumber(currentNetwork, K.totalPvs);
  const prevHumanViews = pickNumber(previousNetwork, K.humanViews);
  const prevSessions = pickNumber(previousNetwork, K.sessions);
  const prevTotalPVs = pickNumber(previousNetwork, K.totalPvs);
  const prevTotalRpm = pickNumber(previousNetwork, K.totalRpm);
  const prevTotalVrpm = pickNumber(previousNetwork, K.totalVrpm);
  const prevRps = pickNumber(previousNetwork, K.totalRps);

  const prevFilteredPublishers = monthlyPublisherRows
    .filter((r) => rowMatchesKey(r, period.previousKey))
    .filter(maybeExcludeNetworkTotal);

  const totalClicksLatestMonth = filteredPublishers.reduce(
    (sum, r) => sum + pickNumber(r, K.totalClicks),
    0
  );
  const prevTotalClicks = prevFilteredPublishers.reduce(
    (sum, r) => sum + pickNumber(r, K.totalClicks),
    0
  );

  const sumPublisherTotalRevenueLatestMonth = filteredPublishers.reduce(
    (s, r) => s + pickNumber(r, K.totalRev),
    0
  );

  const topPublisher = filteredPublishers
    .map((r) => ({
      publisher: String(pick(r, K.publisher) || "Unknown"),
      totalRevenue: pickNumber(r, K.totalRev)
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)[0];

  const today = new Date();
  const isCurrentMonth = Boolean(
    period.selectedYear === today.getFullYear() &&
    period.selectedMonth === (today.getMonth() + 1)
  );
  const daysInMonth = period.selectedYear && period.selectedMonth
    ? new Date(period.selectedYear, period.selectedMonth, 0).getDate()
    : null;
  const daysElapsed = isCurrentMonth ? today.getDate() : daysInMonth;
  const paceDenom =
    daysInMonth && daysElapsed && daysElapsed > 0 ? daysElapsed : null;
  const projectedRevenue =
    paceDenom && daysInMonth
      ? (totalRevenue / paceDenom) * daysInMonth
      : totalRevenue;
  const projectedTotalPVs =
    paceDenom && daysInMonth
      ? (totalPVs / paceDenom) * daysInMonth
      : totalPVs;
  const projectedSessions =
    paceDenom && daysInMonth
      ? (sessions / paceDenom) * daysInMonth
      : sessions;
  const paceVsLastMonth = ratioChange(projectedRevenue, prevTotalRevenue);
  const paceVsLastMonthPvs = ratioChange(projectedTotalPVs, prevTotalPVs);
  const paceVsLastMonthSessions = ratioChange(projectedSessions, prevSessions);

  const latestMonthLabel =
    period.selectedMonth && period.selectedYear
      ? `${monthLabelFromNum(period.selectedMonth)} ${period.selectedYear}`
      : null;
  const previousMonthLabel = period.previousKey
    ? `${monthLabelFromNum(period.previousKey % 100)} ${Math.floor(period.previousKey / 100)}`
    : null;
  const latestMonthKey =
    period.selectedYear && period.selectedMonth
      ? `${period.selectedYear}-${String(period.selectedMonth).padStart(2, "0")}`
      : null;
  const previousMonthKey = period.previousKey
    ? `${Math.floor(period.previousKey / 100)}-${String(period.previousKey % 100).padStart(2, "0")}`
    : null;

  return {
    filters: {
      ...filters,
      month: period.selectedMonth ? String(period.selectedMonth).padStart(2, "0") : null,
      monthLabel: period.selectedMonth ? monthLabelFromNum(period.selectedMonth) : null,
      year: period.selectedYear
    },
    meta: {
      latestMonthLabel,
      previousMonthLabel,
      latestMonthKey,
      previousMonthKey,
      publisherCountLatestMonth: filteredPublishers.length,
      /** Sum of total_rev on publisher rows for latest month (denominator for top-publisher share). */
      sumPublisherTotalRevenueLatestMonth,
      kpiNetworkSource:
        "Monthly Rollup — Network (Network Total row). MoM compares to the prior month in that tab.",
      monthlyChartsSource:
        "Monthly Rollup — Publishers: revenue and traffic summed by month.",
      publisherLifetimeSource:
        "Monthly Rollup — Publishers: each publisher is the sum of all months in the tab."
    },
    comparison: {
      prevTotalRevenue,
      momRevenueDeltaPct: ratioChange(totalRevenue, prevTotalRevenue),
      momHumanDeltaPct: ratioChange(humanViews, prevHumanViews),
      momSessionsDeltaPct: ratioChange(sessions, prevSessions),
      momTotalPvsDeltaPct: ratioChange(totalPVs, prevTotalPVs),
      momTotalClicksDeltaPct: ratioChange(totalClicksLatestMonth, prevTotalClicks),
      momTotalRpmDeltaPct: ratioChange(totalRpm, prevTotalRpm),
      momTotalVrpmDeltaPct: ratioChange(totalVrpm, prevTotalVrpm),
      momRpsDeltaPct: ratioChange(rps, prevRps)
    },
    pacing: {
      isCurrentMonth,
      daysElapsed,
      daysInMonth,
      projectedRevenue,
      paceVsLastMonthPct: paceVsLastMonth,
      projectedTotalPVs,
      paceVsLastMonthPvsPct: paceVsLastMonthPvs,
      projectedSessions,
      paceVsLastMonthSessionsPct: paceVsLastMonthSessions,
      priorMonthRevenue: prevTotalRevenue,
      priorMonthTotalPVs: prevTotalPVs,
      priorMonthSessions: prevSessions
    },
    totals: {
      totalRevenue,
      affiliateRevenue,
      emailRevenue,
      kvpRevenue,
      videoRevenue,
      nativeRevenue,
      totalRpm,
      totalVrpm,
      humanViews,
      totalPVs,
      sessions,
      rps,
      totalClicksLatestMonth
    },
    topPublisher: topPublisher || null
  };
}

function buildPublisherRows(monthlyPublisherRows, filters) {
  const period = resolveTargetPeriod(monthlyPublisherRows, filters);
  return monthlyPublisherRows
    .filter((r) => rowMatchesKey(r, period.selectedKey))
    .filter(maybeExcludeNetworkTotal)
    .map((r) => ({
      publisher: String(pick(r, K.publisher) || "Unknown"),
      month: pick(r, ["month", "month_name"]),
      year: pick(r, ["year"]),
      totalRevenue: pickNumber(r, K.totalRev),
      affiliateRevenue: pickNumber(r, K.affiliateRev),
      emailRevenue: pickNumber(r, K.emailRev),
      kvpRevenue: pickNumber(r, K.kvpRev),
      videoRevenue: pickNumber(r, K.videoRev),
      nativeRevenue: pickNumber(r, K.nativeRev),
      humanViews: pickNumber(r, K.humanViews),
      botPvs: pickNumber(r, K.botPvs),
      totalPVs: pickNumber(r, K.totalPvs),
      sessions: pickNumber(r, K.sessions),
      rps: pickNumber(r, K.totalRps),
      rpm: pickNumber(r, K.totalRpm),
      affiliateRpm: pickNumber(r, K.affRpm),
      kvpRpm: pickNumber(r, K.kvpRpm),
      videoRpm: pickNumber(r, K.videoRpm),
      nativeRpm: pickNumber(r, K.nativeRpm),
      totalVrpm: pickNumber(r, K.totalVrpm),
      smartScrollViews: pickNumber(r, K.smartScrollViews),
      widgetLoads: pickNumber(r, K.widgetLoads),
      pvPerSession: pickNumber(r, K.pvPerSession),
      sessionTime: pickNumber(r, K.sessionTime)
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
}

/**
 * Network weekly trend: sums publisher rows per week. Blended RPM = rev ÷ PVs × 1k;
 * blended vRPM = rev ÷ SS in-views × 1k. Widget loads and in-views come from distinct sheet columns.
 */
function buildWeeklyTrend(weeklyRows, limit = 16) {
  const normalized = weeklyRows
    .filter(maybeExcludeNetworkTotal)
    .map((r) => {
      const rawWeek = pick(r, ["week_start", "week", "date"]);
      const weekLabel = formatSheetsDateLike(rawWeek);
      const weekSortKey =
        typeof rawWeek === "number" && Number.isFinite(rawWeek)
          ? rawWeek
          : weekLabel;
      return {
        weekSortKey,
        weekStart: weekLabel || String(rawWeek ?? ""),
        publisher: String(pick(r, K.publisher) || "Unknown"),
        totalRevenue: pickNumber(r, K.totalRev),
        sessions: pickNumber(r, K.sessions),
        totalPVs: pickNumber(r, K.totalPvs),
        widgetLoads: pickNumber(r, K.widgetLoads),
        smartScrollViews: pickNumber(r, K.smartScrollViews)
      };
    })
    .filter((r) => r.weekStart);

  const byWeek = new Map();
  normalized.forEach((row) => {
    const key = row.weekSortKey;
    const current = byWeek.get(key) || {
      weekSortKey: key,
      weekStart: row.weekStart,
      totalRevenue: 0,
      sessions: 0,
      totalPVs: 0,
      widgetLoads: 0,
      smartScrollViews: 0
    };
    current.totalRevenue += row.totalRevenue;
    current.sessions += row.sessions;
    current.totalPVs += row.totalPVs;
    current.widgetLoads += row.widgetLoads;
    current.smartScrollViews += row.smartScrollViews;
    byWeek.set(key, current);
  });

  const sorted = Array.from(byWeek.values()).sort((a, b) => {
    if (typeof a.weekSortKey === "number" && typeof b.weekSortKey === "number") {
      return a.weekSortKey - b.weekSortKey;
    }
    return String(a.weekStart).localeCompare(String(b.weekStart));
  });

  const sliced = sorted.slice(-Math.max(1, Number(limit) || 16));
  return sliced.map(({ weekSortKey: _drop, ...rest }) => {
    const rev = rest.totalRevenue;
    const pv = rest.totalPVs;
    const ss = rest.smartScrollViews;
    const blendedRpm = pv > 0 ? (rev / pv) * 1000 : 0;
    const blendedVrpm = ss > 0 ? (rev / ss) * 1000 : 0;
    return {
      weekStart: rest.weekStart,
      totalRevenue: rev,
      sessions: rest.sessions,
      totalPVs: pv,
      widgetLoads: rest.widgetLoads,
      smartScrollViews: ss,
      blendedRpm,
      blendedVrpm
    };
  });
}

/**
 * Per-publisher weekly rows (last N calendar weeks present). RPM = sheet or rev ÷ PVs × 1k;
 * vRPM = sheet or rev ÷ SS in-views × 1k (not ÷ widget loads).
 */
function buildWeeklyByPublisher(weeklyRows, weekLimit = 12) {
  const normalized = weeklyRows
    .filter(maybeExcludeNetworkTotal)
    .map((r) => {
      const rawWeek = pick(r, ["week_start", "week", "date"]);
      const weekLabel = formatSheetsDateLike(rawWeek);
      const weekSortKey =
        typeof rawWeek === "number" && Number.isFinite(rawWeek)
          ? rawWeek
          : weekLabel;
      const totalRevenue = pickNumber(r, K.totalRev);
      const totalPVs = pickNumber(r, K.totalPvs);
      const widgetLoads = pickNumber(r, K.widgetLoads);
      const smartScrollViews = pickNumber(r, K.smartScrollViews);
      const rpmSheet = pickNumber(r, K.totalRpm);
      const vrpmSheet = pickNumber(r, K.totalVrpm);
      const rpm =
        rpmSheet > 0
          ? rpmSheet
          : totalPVs > 0
            ? (totalRevenue / totalPVs) * 1000
            : 0;
      const vrpm =
        vrpmSheet > 0
          ? vrpmSheet
          : smartScrollViews > 0
            ? (totalRevenue / smartScrollViews) * 1000
            : 0;
      return {
        weekSortKey,
        weekStart: weekLabel || String(rawWeek ?? ""),
        publisher: String(pick(r, K.publisher) || "Unknown"),
        totalRevenue,
        totalPVs,
        widgetLoads,
        smartScrollViews,
        sessions: pickNumber(r, K.sessions),
        rpm,
        vrpm
      };
    })
    .filter((r) => r.weekStart);

  const weekKeys = [...new Set(normalized.map((r) => r.weekSortKey))].sort((a, b) => {
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a).localeCompare(String(b));
  });
  const keep = new Set(weekKeys.slice(-Math.max(1, Number(weekLimit) || 12)));
  return normalized.filter((r) => keep.has(r.weekSortKey));
}

/** Latest vs prior month revenue per publisher (same period resolution as buildKpis). */
function buildPublisherMoMComparison(monthlyPublisherRows, filters) {
  const period = resolveTargetPeriod(monthlyPublisherRows, filters);
  if (!period.selectedKey) return [];

  const current = monthlyPublisherRows
    .filter((r) => rowMatchesKey(r, period.selectedKey))
    .filter(maybeExcludeNetworkTotal);
  const previous = period.previousKey
    ? monthlyPublisherRows
        .filter((r) => rowMatchesKey(r, period.previousKey))
        .filter(maybeExcludeNetworkTotal)
    : [];

  const prevMap = new Map(
    previous.map((r) => [
      String(pick(r, K.publisher) || "Unknown").trim(),
      pickNumber(r, K.totalRev)
    ])
  );

  return current
    .map((r) => {
      const publisher = String(pick(r, K.publisher) || "Unknown").trim();
      const currentMonthRev = pickNumber(r, K.totalRev);
      const previousMonthRev = prevMap.get(publisher) ?? 0;
      return {
        publisher,
        currentMonthRev,
        previousMonthRev,
        momRevDeltaPct: ratioChange(currentMonthRev, previousMonthRev)
      };
    })
    .sort((a, b) => b.currentMonthRev - a.currentMonthRev);
}

/**
 * Monthly series for executive charts: revenue/traffic summed from Publishers tab.
 */
function buildMonthlyTotalsFromPublisherRows(publisherRows, _monthlyNetworkRows) {
  const map = new Map();
  publisherRows.filter(maybeExcludeNetworkTotal).forEach((r) => {
    const key = monthKey(r);
    if (!key) return;
    const parts = monthParts(r);
    if (!parts.monthNum || !parts.year) return;
    const label = `${monthLabelFromNum(parts.monthNum)} ${parts.year}`;
    if (!map.has(key)) {
      map.set(key, {
        month: parts.monthNum,
        year: parts.year,
        label,
        totalRev: 0,
        totalPVs: 0,
        humanViews: 0,
        sessions: 0,
        totalClicks: 0,
        affiliateRev: 0,
        emailRev: 0,
        kvpRev: 0,
        kvpRevEst: 0,
        kvpImpressions: 0,
        nativeRev: 0,
        videoRev: 0,
        smartScrollViews: 0,
        widgetLoads: 0
      });
    }
    const m = map.get(key);
    m.totalRev += pickNumber(r, K.totalRev);
    m.totalPVs += pickNumber(r, K.totalPvs);
    m.humanViews += pickNumber(r, K.humanViews);
    m.sessions += pickNumber(r, K.sessions);
    m.totalClicks += pickNumber(r, K.totalClicks);
    m.affiliateRev += pickNumber(r, K.affiliateRev);
    m.emailRev += pickNumber(r, K.emailRev);
    m.kvpRev += pickNumber(r, K.kvpRev);
    m.kvpRevEst += pickNumber(r, K.kvpRevEst);
    m.kvpImpressions += pickNumber(r, K.kvpImpressions);
    m.nativeRev += pickNumber(r, K.nativeRev);
    m.videoRev += pickNumber(r, K.videoRev);
    m.smartScrollViews += pickNumber(r, K.smartScrollViews);
    m.widgetLoads += pickNumber(r, K.widgetLoads);
  });
  return Array.from(map.values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
}

/** All-time per-publisher totals (matches executive-dashboard getPublisherTotals()). */
function buildPublisherTotalsAllTime(rows) {
  const map = new Map();
  rows.filter(maybeExcludeNetworkTotal).forEach((r) => {
    const pub = String(pick(r, K.publisher) || "Unknown");
    if (!map.has(pub)) {
      map.set(pub, {
        publisher: pub,
        totalRev: 0,
        totalPVs: 0,
        humanViews: 0,
        sessions: 0,
        totalClicks: 0,
        affiliateRev: 0,
        emailRev: 0,
        kvpRev: 0,
        kvpRevEst: 0,
        kvpImpressions: 0,
        nativeRev: 0,
        videoRev: 0,
        smartScrollViews: 0,
        widgetLoads: 0
      });
    }
    const p = map.get(pub);
    p.totalRev += pickNumber(r, K.totalRev);
    p.totalPVs += pickNumber(r, K.totalPvs);
    p.humanViews += pickNumber(r, K.humanViews);
    p.sessions += pickNumber(r, K.sessions);
    p.totalClicks += pickNumber(r, K.totalClicks);
    p.affiliateRev += pickNumber(r, K.affiliateRev);
    p.emailRev += pickNumber(r, K.emailRev);
    p.kvpRev += pickNumber(r, K.kvpRev);
    p.kvpRevEst += pickNumber(r, K.kvpRevEst);
    p.kvpImpressions += pickNumber(r, K.kvpImpressions);
    p.nativeRev += pickNumber(r, K.nativeRev);
    p.videoRev += pickNumber(r, K.videoRev);
    p.smartScrollViews += pickNumber(r, K.smartScrollViews);
    p.widgetLoads += pickNumber(r, K.widgetLoads);
  });
  return Array.from(map.values())
    .map((p) => {
      const avgRpm =
        p.totalPVs > 0 ? (p.totalRev / p.totalPVs) * 1000 : 0;
      const avgVrpm =
        p.smartScrollViews > 0 ? (p.totalRev / p.smartScrollViews) * 1000 : 0;
      const avgRps =
        p.sessions > 0 ? (p.totalRev / p.sessions) * 1000 : 0;
      return { ...p, avgRpm, avgVrpm, avgRps };
    })
    .sort((a, b) => b.totalRev - a.totalRev);
}

/**
 * @param {number} a
 * @param {number} b
 * @param {{ absTol?: number; relTol?: number }} [opts]
 */
function withinTolerance(a, b, opts = {}) {
  const absTol = opts.absTol ?? 0.5;
  const relTol = opts.relTol ?? 0.005;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  const d = Math.abs(a - b);
  const scale = Math.max(Math.abs(a), Math.abs(b), 1e-9);
  return d <= absTol || d <= scale * relTol;
}

/** Short USD for QA messages (rollup is USD-shaped). */
function fmtUsd(n) {
  if (!Number.isFinite(n)) return String(n);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(n);
}

/**
 * Server-side QA: rollup identities for the resolved "latest" month (same period as buildKpis).
 * Does not block the API — surfaces trust signals for the dashboard.
 */
function buildRollupQa(monthlyNetworkRows, monthlyPublisherRows, filters) {
  /** @type {{ id: string; severity: "pass" | "warn" | "fail"; message: string; detail?: Record<string, unknown> }[]} */
  const checks = [];
  const period = resolveTargetPeriod(monthlyNetworkRows, filters);

  const latestMonthLabel =
    period.selectedMonth && period.selectedYear
      ? `${monthLabelFromNum(period.selectedMonth)} ${period.selectedYear}`
      : null;

  if (!period.selectedKey) {
    checks.push({
      id: "period_resolved",
      severity: "fail",
      message:
        "Could not resolve a latest month from Monthly Rollup — Network (missing month/year on rows)."
    });
    return {
      latestMonthLabel,
      checks,
      summary: { ok: false, failCount: 1, warnCount: 0, passCount: 0 }
    };
  }

  const currentNetwork = pickNetworkSummaryRow(
    monthlyNetworkRows.filter((r) => rowMatchesKey(r, period.selectedKey))
  );
  const filteredPublishers = monthlyPublisherRows
    .filter((r) => rowMatchesKey(r, period.selectedKey))
    .filter(maybeExcludeNetworkTotal);

  const totalRev = pickNumber(currentNetwork, K.totalRev);
  const aff = pickNumber(currentNetwork, K.affiliateRev);
  const email = pickNumber(currentNetwork, K.emailRev);
  const kvp = pickNumber(currentNetwork, K.kvpRev);
  const vid = pickNumber(currentNetwork, K.videoRev);
  const nat = pickNumber(currentNetwork, K.nativeRev);
  const sumComp = aff + email + kvp + vid + nat;

  if (withinTolerance(sumComp, totalRev, { absTol: 1, relTol: 0.005 })) {
    checks.push({
      id: "total_rev_equals_channels",
      severity: "pass",
      message: `Total revenue matches affiliate + email + incremental ad + video + native (${latestMonthLabel}).`,
      detail: { totalRev, sumComponents: sumComp }
    });
  } else {
    checks.push({
      id: "total_rev_equals_channels",
      severity: "warn",
      message: `Total revenue may not match channel sum (expected: Total = Affiliate + Email + Incremental Ad Revenue + Video + Native).`,
      detail: {
        totalRev,
        sumComponents: sumComp,
        delta: totalRev - sumComp,
        affiliateRev: aff,
        emailRev: email,
        kvpRev: kvp,
        videoRev: vid,
        nativeRev: nat
      }
    });
  }

  const human = pickNumber(currentNetwork, K.humanViews);
  const bot = pickNumber(currentNetwork, K.botPvs);
  const totalPVs = pickNumber(currentNetwork, K.totalPvs);
  const pvSum = human + bot;
  if (totalPVs === 0 && pvSum === 0) {
    checks.push({
      id: "total_pvs_human_bot",
      severity: "pass",
      message: "Total PVs and human+bot are both zero (latest month).",
      detail: { humanViews: human, botPvs: bot, totalPVs }
    });
  } else if (withinTolerance(pvSum, totalPVs, { absTol: 2, relTol: 0.002 })) {
    checks.push({
      id: "total_pvs_human_bot",
      severity: "pass",
      message: `Total PVs equals human + bot (${latestMonthLabel}).`,
      detail: { humanViews: human, botPvs: bot, totalPVs }
    });
  } else {
    checks.push({
      id: "total_pvs_human_bot",
      severity: "warn",
      message: "Total PVs may not equal human views + bot PVs (rollup identity).",
      detail: { humanViews: human, botPvs: bot, sum: pvSum, totalPVs, delta: totalPVs - pvSum }
    });
  }

  const sumPubRev = filteredPublishers.reduce((s, r) => s + pickNumber(r, K.totalRev), 0);
  const pubVsNetDelta = totalRev - sumPubRev;
  const pctOffNetwork =
    Math.abs(totalRev) > 1e-6 ? (pubVsNetDelta / totalRev) * 100 : null;
  // Slightly looser than channel-sum: many publisher rows + sheet rounding can stack; still warn on real gaps.
  const pubSumTolerance = { absTol: 10, relTol: 0.01 };
  if (filteredPublishers.length === 0) {
    checks.push({
      id: "publishers_sum_vs_network",
      severity: "warn",
      message: "No publisher rows for the latest month (after excluding Network Total).",
      detail: { networkTotalRev: totalRev }
    });
  } else if (withinTolerance(sumPubRev, totalRev, pubSumTolerance)) {
    checks.push({
      id: "publishers_sum_vs_network",
      severity: "pass",
      message: `Sum of publisher total revenue matches network total (${latestMonthLabel}).`,
      detail: {
        sumPublisherTotalRev: sumPubRev,
        networkTotalRev: totalRev,
        publisherRows: filteredPublishers.length
      }
    });
  } else {
    checks.push({
      id: "publishers_sum_vs_network",
      severity: "warn",
      message: `Publishers tab sum (${fmtUsd(sumPubRev)}, ${filteredPublishers.length} rows) vs Network Total (${fmtUsd(totalRev)}): Δ ${fmtUsd(pubVsNetDelta)}${
        pctOffNetwork != null ? ` (${pctOffNetwork.toFixed(2)}% of network)` : ""
      }. Often missing/extra publisher rows or a Network-only adjustment.`,
      detail: {
        sumPublisherTotalRev: sumPubRev,
        networkTotalRev: totalRev,
        delta: pubVsNetDelta,
        pctOffNetwork,
        publisherRows: filteredPublishers.length
      }
    });
  }

  const pubKeys = filteredPublishers.map((r) =>
    String(pick(r, K.publisher) || "Unknown").trim().toLowerCase()
  );
  const unique = new Set(pubKeys);
  if (pubKeys.length === unique.size) {
    checks.push({
      id: "duplicate_publishers",
      severity: "pass",
      message: "No duplicate publisher names for the latest month.",
      detail: { count: pubKeys.length }
    });
  } else {
    checks.push({
      id: "duplicate_publishers",
      severity: "warn",
      message: "Duplicate publisher labels detected for the latest month (possible double-count risk).",
      detail: { rowCount: pubKeys.length, uniqueCount: unique.size }
    });
  }

  const failCount = checks.filter((c) => c.severity === "fail").length;
  const warnCount = checks.filter((c) => c.severity === "warn").length;
  const passCount = checks.filter((c) => c.severity === "pass").length;

  return {
    latestMonthLabel,
    checks,
    summary: {
      ok: failCount === 0,
      failCount,
      warnCount,
      passCount
    }
  };
}

/**
 * Latest month: per-channel gross on Network Total vs sum on Publishers tab.
 */
function buildChannelBreakdown(monthlyNetworkRows, monthlyPublisherRows, filters) {
  const period = resolveTargetPeriod(monthlyNetworkRows, filters);
  const latestMonthLabel =
    period.selectedMonth && period.selectedYear
      ? `${monthLabelFromNum(period.selectedMonth)} ${period.selectedYear}`
      : null;

  if (!period.selectedKey) {
    return {
      latestMonthLabel,
      monthKey: null,
      methodology: "Gross = channel columns (Network row vs summed Publishers tab).",
      channels: [],
      totals: null
    };
  }

  const currentNetwork = pickNetworkSummaryRow(
    monthlyNetworkRows.filter((r) => rowMatchesKey(r, period.selectedKey))
  );
  const filteredPublishers = monthlyPublisherRows
    .filter((r) => rowMatchesKey(r, period.selectedKey))
    .filter(maybeExcludeNetworkTotal);

  const totalNw = pickNumber(currentNetwork, K.totalRev);

  const pubAgg = { affiliate: 0, email: 0, kvp: 0, video: 0, native: 0 };
  let pubTot = 0;
  for (const r of filteredPublishers) {
    pubAgg.affiliate += pickNumber(r, K.affiliateRev);
    pubAgg.email += pickNumber(r, K.emailRev);
    pubAgg.kvp += pickNumber(r, K.kvpRev);
    pubAgg.video += pickNumber(r, K.videoRev);
    pubAgg.native += pickNumber(r, K.nativeRev);
    pubTot += pickNumber(r, K.totalRev);
  }

  const defs = [
    { id: "affiliate", label: "Affiliate", key: "affiliate" },
    { id: "email", label: "Email", key: "email" },
    { id: "kvp", label: "Incremental (KVP)", key: "kvp" },
    { id: "video", label: "Video", key: "video" },
    { id: "native", label: "Native", key: "native" }
  ];

  const pickNwCh = (row, ch) => {
    if (ch === "affiliate") return pickNumber(row, K.affiliateRev);
    if (ch === "email") return pickNumber(row, K.emailRev);
    if (ch === "kvp") return pickNumber(row, K.kvpRev);
    if (ch === "video") return pickNumber(row, K.videoRev);
    return pickNumber(row, K.nativeRev);
  };

  const channels = defs.map((def) => {
    const grossNw = pickNwCh(currentNetwork, def.key);
    const grossPub = pubAgg[def.key];
    const deltaGross = grossNw - grossPub;

    return {
      id: def.id,
      label: def.label,
      grossNetwork: grossNw,
      grossPublishers: grossPub,
      deltaGross,
      netEstNetwork: grossNw,
      netEstPublishers: grossPub,
      mulaAllocNetwork: 0,
      mulaAllocPublishers: 0,
      mulaPctOfChannelGrossNetwork: null,
      mulaPctOfChannelGrossPublishers: null
    };
  });

  const sumChNw = channels.reduce((s, c) => s + c.grossNetwork, 0);
  const sumChPub = channels.reduce((s, c) => s + c.grossPublishers, 0);

  return {
    latestMonthLabel,
    monthKey: period.selectedKey,
    methodology:
      "Gross: Affiliate, Email, KVP, Video, Native from Monthly Rollup — Network (row) vs sum on Publishers. Large Δ gross on a channel usually means classification or missing rows on one tab.",
    channels,
    totals: {
      totalGrossNetwork: totalNw,
      totalGrossPublishers: pubTot,
      deltaGrossTotal: totalNw - pubTot,
      mulaNetwork: 0,
      mulaPublishers: 0,
      sumChannelGrossNetwork: sumChNw,
      sumChannelGrossPublishers: sumChPub
    }
  };
}

module.exports = {
  buildKpis,
  buildPublisherRows,
  buildWeeklyTrend,
  buildWeeklyByPublisher,
  buildPublisherMoMComparison,
  buildMonthlyTotalsFromPublisherRows,
  buildPublisherTotalsAllTime,
  buildRollupQa,
  buildChannelBreakdown
};
