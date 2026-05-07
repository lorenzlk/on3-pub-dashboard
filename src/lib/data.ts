export interface PublisherData {
  month: number;
  year: number;
  publisher: string;
  humanViews: number;
  botPVs: number;
  totalPVs: number;
  smartScrollViews: number;
  pvPerSession: number;
  totalRev: number;
  affiliateRev: number;
  kvpRev: number;
  videoRev: number;
  nativeRev: number;
  totalRPM: number;
  affiliateRPM: number;
  kvpRPM: number;
  videoRPM: number;
  nativeRPM: number;
  totalClicks: number;
  affiliateClicks: number;
  nextPageClicks: number;
  videoClicks: number;
  nativeClicks: number;
  sessions: number;
  totalRPS: number;
  affiliateCTR: number;
  affiliateEPC: number;
}

export const publisherData: PublisherData[] = [
  // March 2026
  { month: 3, year: 2026, publisher: "Blavity", humanViews: 7700, botPVs: 7400, totalPVs: 15100, smartScrollViews: 38, pvPerSession: 656.52, totalRev: 0, affiliateRev: 0, kvpRev: 0, videoRev: 0, nativeRev: 0, totalRPM: 0, affiliateRPM: 0, kvpRPM: 0, videoRPM: 0, nativeRPM: 0, totalClicks: 20, affiliateClicks: 15, nextPageClicks: 5, videoClicks: 0, nativeClicks: 0, sessions: 23, totalRPS: 0, affiliateCTR: 0.001, affiliateEPC: 0 },
  { month: 3, year: 2026, publisher: "Brit.Co", humanViews: 3900000, botPVs: 4176000, totalPVs: 8076000, smartScrollViews: 110400, pvPerSession: 20.94, totalRev: 14.15, affiliateRev: 1.42, kvpRev: 0, videoRev: 0, nativeRev: 12.73, totalRPM: 0, affiliateRPM: 0, kvpRPM: 0, videoRPM: 0, nativeRPM: 0, totalClicks: 276, affiliateClicks: 130, nextPageClicks: 0, videoClicks: 0, nativeClicks: 146, sessions: 385700, totalRPS: 0.037, affiliateCTR: 0, affiliateEPC: 0.0109 },
  { month: 3, year: 2026, publisher: "McClatchy", humanViews: 0, botPVs: 0, totalPVs: 0, smartScrollViews: 0, pvPerSession: 0, totalRev: -24.58, affiliateRev: -24.58, kvpRev: 0, videoRev: 0, nativeRev: 0, totalRPM: 0, affiliateRPM: 0, kvpRPM: 0, videoRPM: 0, nativeRPM: 0, totalClicks: 0, affiliateClicks: 0, nextPageClicks: 0, videoClicks: 0, nativeClicks: 0, sessions: 0, totalRPS: 0, affiliateCTR: 0, affiliateEPC: 0 },
  { month: 3, year: 2026, publisher: "On3", humanViews: 944300, botPVs: 354360, totalPVs: 1298660, smartScrollViews: 685200, pvPerSession: 1.79, totalRev: 4678.47, affiliateRev: 748.46, kvpRev: 1020, videoRev: 2620.2, nativeRev: 289.81, totalRPM: 3.6, affiliateRPM: 0.58, kvpRPM: 0.79, videoRPM: 2.02, nativeRPM: 0.22, totalClicks: 24288, affiliateClicks: 1881, nextPageClicks: 21240, videoClicks: 0, nativeClicks: 1167, sessions: 727300, totalRPS: 6.433, affiliateCTR: 0.0014, affiliateEPC: 0.3979 },
  { month: 3, year: 2026, publisher: "Reader's Digest", humanViews: 305450, botPVs: 8639, totalPVs: 314089, smartScrollViews: 29675, pvPerSession: 1.22, totalRev: 8.11, affiliateRev: 8.11, kvpRev: 0, videoRev: 0, nativeRev: 0, totalRPM: 0.03, affiliateRPM: 0.03, kvpRPM: 0, videoRPM: 0, nativeRPM: 0, totalClicks: 301, affiliateClicks: 147, nextPageClicks: 154, videoClicks: 0, nativeClicks: 0, sessions: 257645, totalRPS: 0.031, affiliateCTR: 0.0005, affiliateEPC: 0.0552 },
  { month: 3, year: 2026, publisher: "Swimming World", humanViews: 195500, botPVs: 1350000, totalPVs: 1545500, smartScrollViews: 22020, pvPerSession: 10.04, totalRev: 9.04, affiliateRev: 4.23, kvpRev: 0, videoRev: 0, nativeRev: 4.81, totalRPM: 0.01, affiliateRPM: 0, kvpRPM: 0, videoRPM: 0, nativeRPM: 0, totalClicks: 153, affiliateClicks: 125, nextPageClicks: 0, videoClicks: 0, nativeClicks: 28, sessions: 153900, totalRPS: 0.059, affiliateCTR: 0.0001, affiliateEPC: 0.0338 },
  { month: 3, year: 2026, publisher: "Taste of Home", humanViews: 687500, botPVs: 51150, totalPVs: 738650, smartScrollViews: 72500, pvPerSession: 1.21, totalRev: 1.36, affiliateRev: 1.36, kvpRev: 0, videoRev: 0, nativeRev: 0, totalRPM: 0, affiliateRPM: 0, kvpRPM: 0, videoRPM: 0, nativeRPM: 0, totalClicks: 679, affiliateClicks: 234, nextPageClicks: 445, videoClicks: 0, nativeClicks: 0, sessions: 610989, totalRPS: 0.002, affiliateCTR: 0.0003, affiliateEPC: 0.0058 },
  { month: 3, year: 2026, publisher: "TWSN", humanViews: 213480, botPVs: 204500, totalPVs: 417980, smartScrollViews: 22690, pvPerSession: 3.35, totalRev: 20.87, affiliateRev: -0.79, kvpRev: 21.66, videoRev: 0, nativeRev: 0, totalRPM: 0.05, affiliateRPM: 0, kvpRPM: 0.05, videoRPM: 0, nativeRPM: 0, totalClicks: 33, affiliateClicks: 33, nextPageClicks: 0, videoClicks: 0, nativeClicks: 0, sessions: 124820, totalRPS: 0.167, affiliateCTR: 0.0001, affiliateEPC: -0.0239 },
  { month: 3, year: 2026, publisher: "Western Journal", humanViews: 1906200, botPVs: 118600, totalPVs: 2024800, smartScrollViews: 93475, pvPerSession: 1.58, totalRev: 14.1, affiliateRev: 14.1, kvpRev: 0, videoRev: 0, nativeRev: 0, totalRPM: 0.01, affiliateRPM: 0.01, kvpRPM: 0, videoRPM: 0, nativeRPM: 0, totalClicks: 2207, affiliateClicks: 231, nextPageClicks: 1976, videoClicks: 0, nativeClicks: 0, sessions: 1278400, totalRPS: 0.011, affiliateCTR: 0.0001, affiliateEPC: 0.061 },

  // February 2026
  { month: 2, year: 2026, publisher: "Brit.Co", humanViews: 5070000, botPVs: 3553000, totalPVs: 8623000, smartScrollViews: 123500, pvPerSession: 11.41, totalRev: 192.93, affiliateRev: 160.12, kvpRev: 0, videoRev: 0, nativeRev: 32.81, totalRPM: 0.02, affiliateRPM: 0.02, kvpRPM: 0, videoRPM: 0, nativeRPM: 0, totalClicks: 1231, affiliateClicks: 856, nextPageClicks: 0, videoClicks: 0, nativeClicks: 375, sessions: 756000, totalRPS: 0.255, affiliateCTR: 0.0001, affiliateEPC: 0.1871 },
  { month: 2, year: 2026, publisher: "McClatchy", humanViews: 476000, botPVs: 331000, totalPVs: 807000, smartScrollViews: 165200, pvPerSession: 2.3, totalRev: 708.02, affiliateRev: 708.02, kvpRev: 0, videoRev: 0, nativeRev: 0, totalRPM: 0.88, affiliateRPM: 0.88, kvpRPM: 0, videoRPM: 0, nativeRPM: 0, totalClicks: 0, affiliateClicks: 0, nextPageClicks: 0, videoClicks: 0, nativeClicks: 0, sessions: 351000, totalRPS: 2.017, affiliateCTR: 0, affiliateEPC: 0 },
  { month: 2, year: 2026, publisher: "On3", humanViews: 1402000, botPVs: 1038000, totalPVs: 2440000, smartScrollViews: 1014600, pvPerSession: 2.38, totalRev: 1567.14, affiliateRev: 464.73, kvpRev: 1043.29, videoRev: 0, nativeRev: 59.12, totalRPM: 0.64, affiliateRPM: 0.19, kvpRPM: 0.43, videoRPM: 0, nativeRPM: 0.02, totalClicks: 27361, affiliateClicks: 3478, nextPageClicks: 23555, videoClicks: 0, nativeClicks: 328, sessions: 1025300, totalRPS: 1.528, affiliateCTR: 0.0014, affiliateEPC: 0.1336 },
  { month: 2, year: 2026, publisher: "Swimming World", humanViews: 200800, botPVs: 1095000, totalPVs: 1295800, smartScrollViews: 28950, pvPerSession: 6.02, totalRev: 12.89, affiliateRev: 9.05, kvpRev: 0, videoRev: 0, nativeRev: 3.84, totalRPM: 0.01, affiliateRPM: 0.01, kvpRPM: 0, videoRPM: 0, nativeRPM: 0, totalClicks: 147, affiliateClicks: 121, nextPageClicks: 0, videoClicks: 0, nativeClicks: 26, sessions: 215400, totalRPS: 0.06, affiliateCTR: 0.0001, affiliateEPC: 0.0748 },
  { month: 2, year: 2026, publisher: "TWSN", humanViews: 1201500, botPVs: 539000, totalPVs: 1740500, smartScrollViews: 62300, pvPerSession: 2.69, totalRev: 668.61, affiliateRev: 27.81, kvpRev: 625.4, videoRev: 0, nativeRev: 15.4, totalRPM: 0.38, affiliateRPM: 0.02, kvpRPM: 0.36, videoRPM: 0, nativeRPM: 0.01, totalClicks: 1174, affiliateClicks: 1039, nextPageClicks: 0, videoClicks: 0, nativeClicks: 135, sessions: 646500, totalRPS: 1.034, affiliateCTR: 0.0006, affiliateEPC: 0.0268 },

  // January 2026
  { month: 1, year: 2026, publisher: "Brit.Co", humanViews: 1109500, botPVs: 3355000, totalPVs: 4464500, smartScrollViews: 102700, pvPerSession: 13.81, totalRev: 483.8, affiliateRev: 135.1, kvpRev: 0, videoRev: 0, nativeRev: 348.7, totalRPM: 0.11, affiliateRPM: 0.03, kvpRPM: 0, videoRPM: 0, nativeRPM: 0.08, totalClicks: 4093, affiliateClicks: 538, nextPageClicks: 0, videoClicks: 0, nativeClicks: 3555, sessions: 323300, totalRPS: 1.496, affiliateCTR: 0.0001, affiliateEPC: 0.2511 },
  { month: 1, year: 2026, publisher: "McClatchy", humanViews: 1286000, botPVs: 2504000, totalPVs: 3790000, smartScrollViews: 314900, pvPerSession: 3.21, totalRev: 2031.59, affiliateRev: 2031.59, kvpRev: 0, videoRev: 0, nativeRev: 0, totalRPM: 0.54, affiliateRPM: 0.54, kvpRPM: 0, videoRPM: 0, nativeRPM: 0, totalClicks: 0, affiliateClicks: 0, nextPageClicks: 0, videoClicks: 0, nativeClicks: 0, sessions: 1179000, totalRPS: 1.723, affiliateCTR: 0, affiliateEPC: 0 },
  { month: 1, year: 2026, publisher: "On3", humanViews: 2706000, botPVs: 3486000, totalPVs: 6192000, smartScrollViews: 2019800, pvPerSession: 3.31, totalRev: 2763.04, affiliateRev: 776.84, kvpRev: 1338.2, videoRev: 0, nativeRev: 648, totalRPM: 0.45, affiliateRPM: 0.13, kvpRPM: 0.22, videoRPM: 0, nativeRPM: 0.1, totalClicks: 46201, affiliateClicks: 4860, nextPageClicks: 36065, videoClicks: 0, nativeClicks: 5276, sessions: 1873000, totalRPS: 1.475, affiliateCTR: 0.0008, affiliateEPC: 0.1598 },
  { month: 1, year: 2026, publisher: "Swimming World", humanViews: 240700, botPVs: 1642500, totalPVs: 1883200, smartScrollViews: 47580, pvPerSession: 8.73, totalRev: 22.34, affiliateRev: 13.83, kvpRev: 0, videoRev: 0, nativeRev: 8.51, totalRPM: 0.01, affiliateRPM: 0.01, kvpRPM: 0, videoRPM: 0, nativeRPM: 0, totalClicks: 194, affiliateClicks: 128, nextPageClicks: 0, videoClicks: 0, nativeClicks: 66, sessions: 215800, totalRPS: 0.104, affiliateCTR: 0.0001, affiliateEPC: 0.108 },
  { month: 1, year: 2026, publisher: "TWSN", humanViews: 1007000, botPVs: 1649000, totalPVs: 2656000, smartScrollViews: 79800, pvPerSession: 3.58, totalRev: 1162.83, affiliateRev: 28.2, kvpRev: 973.79, videoRev: 0, nativeRev: 160.84, totalRPM: 0.44, affiliateRPM: 0.01, kvpRPM: 0.37, videoRPM: 0, nativeRPM: 0.06, totalClicks: 3166, affiliateClicks: 399, nextPageClicks: 0, videoClicks: 0, nativeClicks: 2767, sessions: 741300, totalRPS: 1.569, affiliateCTR: 0.0002, affiliateEPC: 0.0707 },

  // December 2025
  { month: 12, year: 2025, publisher: "Brit.Co", humanViews: 586500, botPVs: 4756000, totalPVs: 5342500, smartScrollViews: 69100, pvPerSession: 31.1, totalRev: 107.74, affiliateRev: 75.67, kvpRev: 0, videoRev: 0, nativeRev: 32.07, totalRPM: 0.02, affiliateRPM: 0.01, kvpRPM: 0, videoRPM: 0, nativeRPM: 0.01, totalClicks: 699, affiliateClicks: 284, nextPageClicks: 0, videoClicks: 0, nativeClicks: 415, sessions: 171800, totalRPS: 0.627, affiliateCTR: 0.0001, affiliateEPC: 0.2664 },
  { month: 12, year: 2025, publisher: "McClatchy", humanViews: 1322500, botPVs: 2551265, totalPVs: 3873765, smartScrollViews: 445300, pvPerSession: 3.37, totalRev: 2391.12, affiliateRev: 2391.12, kvpRev: 0, videoRev: 0, nativeRev: 0, totalRPM: 0.62, affiliateRPM: 0.62, kvpRPM: 0, videoRPM: 0, nativeRPM: 0, totalClicks: 0, affiliateClicks: 0, nextPageClicks: 0, videoClicks: 0, nativeClicks: 0, sessions: 1150500, totalRPS: 2.078, affiliateCTR: 0, affiliateEPC: 0 },
  { month: 12, year: 2025, publisher: "On3", humanViews: 2482000, botPVs: 3992000, totalPVs: 6474000, smartScrollViews: 2113400, pvPerSession: 3.73, totalRev: 4564.46, affiliateRev: 1864.69, kvpRev: 2540.06, videoRev: 0, nativeRev: 159.71, totalRPM: 0.71, affiliateRPM: 0.29, kvpRPM: 0.39, videoRPM: 0, nativeRPM: 0.02, totalClicks: 53700, affiliateClicks: 5752, nextPageClicks: 46620, videoClicks: 0, nativeClicks: 1328, sessions: 1736000, totalRPS: 2.629, affiliateCTR: 0.0009, affiliateEPC: 0.3242 },
  { month: 12, year: 2025, publisher: "Swimming World", humanViews: 340600, botPVs: 977000, totalPVs: 1317600, smartScrollViews: 79510, pvPerSession: 5.91, totalRev: 6.16, affiliateRev: 6.16, kvpRev: 0, videoRev: 0, nativeRev: 0, totalRPM: 0, affiliateRPM: 0, kvpRPM: 0, videoRPM: 0, nativeRPM: 0, totalClicks: 58, affiliateClicks: 58, nextPageClicks: 0, videoClicks: 0, nativeClicks: 0, sessions: 222800, totalRPS: 0.028, affiliateCTR: 0, affiliateEPC: 0.1062 },
  { month: 12, year: 2025, publisher: "TWSN", humanViews: 729500, botPVs: 1716000, totalPVs: 2445500, smartScrollViews: 64650, pvPerSession: 2.74, totalRev: 820.02, affiliateRev: 70.38, kvpRev: 698.49, videoRev: 0, nativeRev: 51.15, totalRPM: 0.34, affiliateRPM: 0.03, kvpRPM: 0.29, videoRPM: 0, nativeRPM: 0.02, totalClicks: 1195, affiliateClicks: 187, nextPageClicks: 0, videoClicks: 0, nativeClicks: 1008, sessions: 894000, totalRPS: 0.917, affiliateCTR: 0.0001, affiliateEPC: 0.3764 },

  // November 2025
  { month: 11, year: 2025, publisher: "Brit.Co", humanViews: 488000, botPVs: 3670000, totalPVs: 4158000, smartScrollViews: 71400, pvPerSession: 22.43, totalRev: 164.97, affiliateRev: 164.97, kvpRev: 0, videoRev: 0, nativeRev: 0, totalRPM: 0.04, affiliateRPM: 0.04, kvpRPM: 0, videoRPM: 0, nativeRPM: 0, totalClicks: 390, affiliateClicks: 390, nextPageClicks: 0, videoClicks: 0, nativeClicks: 0, sessions: 185400, totalRPS: 0.89, affiliateCTR: 0.0001, affiliateEPC: 0.423 },
  { month: 11, year: 2025, publisher: "McClatchy", humanViews: 2093000, botPVs: 3222000, totalPVs: 5315000, smartScrollViews: 429000, pvPerSession: 2.67, totalRev: 3135.64, affiliateRev: 3135.64, kvpRev: 0, videoRev: 0, nativeRev: 0, totalRPM: 0.59, affiliateRPM: 0.59, kvpRPM: 0, videoRPM: 0, nativeRPM: 0, totalClicks: 0, affiliateClicks: 0, nextPageClicks: 0, videoClicks: 0, nativeClicks: 0, sessions: 1988000, totalRPS: 1.577, affiliateCTR: 0, affiliateEPC: 0 },
  { month: 11, year: 2025, publisher: "On3", humanViews: 1892000, botPVs: 3166000, totalPVs: 5058000, smartScrollViews: 1636000, pvPerSession: 3.16, totalRev: 1560.73, affiliateRev: 1560.73, kvpRev: 0, videoRev: 0, nativeRev: 0, totalRPM: 0.31, affiliateRPM: 0.31, kvpRPM: 0, videoRPM: 0, nativeRPM: 0, totalClicks: 41645, affiliateClicks: 4355, nextPageClicks: 37290, videoClicks: 0, nativeClicks: 0, sessions: 1599000, totalRPS: 0.976, affiliateCTR: 0.0009, affiliateEPC: 0.3584 },
  { month: 11, year: 2025, publisher: "Swimming World", humanViews: 242300, botPVs: 1059000, totalPVs: 1301300, smartScrollViews: 45600, pvPerSession: 7.49, totalRev: 6.3, affiliateRev: 6.3, kvpRev: 0, videoRev: 0, nativeRev: 0, totalRPM: 0, affiliateRPM: 0, kvpRPM: 0, videoRPM: 0, nativeRPM: 0, totalClicks: 39, affiliateClicks: 39, nextPageClicks: 0, videoClicks: 0, nativeClicks: 0, sessions: 173700, totalRPS: 0.036, affiliateCTR: 0, affiliateEPC: 0.1615 },
  { month: 11, year: 2025, publisher: "TWSN", humanViews: 438000, botPVs: 2245000, totalPVs: 2683000, smartScrollViews: 32950, pvPerSession: 4.85, totalRev: 197.96, affiliateRev: 7.98, kvpRev: 189.98, videoRev: 0, nativeRev: 0, totalRPM: 0.07, affiliateRPM: 0, kvpRPM: 0.07, videoRPM: 0, nativeRPM: 0, totalClicks: 7, affiliateClicks: 7, nextPageClicks: 0, videoClicks: 0, nativeClicks: 0, sessions: 552700, totalRPS: 0.358, affiliateCTR: 0, affiliateEPC: 1.14 },

  // October 2025
  { month: 10, year: 2025, publisher: "Brit.Co", humanViews: 1396000, botPVs: 1050000, totalPVs: 2446000, smartScrollViews: 48680, pvPerSession: 21.25, totalRev: 0, affiliateRev: 0, kvpRev: 0, videoRev: 0, nativeRev: 0, totalRPM: 0, affiliateRPM: 0, kvpRPM: 0, videoRPM: 0, nativeRPM: 0, totalClicks: 137, affiliateClicks: 137, nextPageClicks: 0, videoClicks: 0, nativeClicks: 0, sessions: 115100, totalRPS: 0, affiliateCTR: 0.0001, affiliateEPC: 0 },
  { month: 10, year: 2025, publisher: "McClatchy", humanViews: 652000, botPVs: 608000, totalPVs: 1260000, smartScrollViews: 48000, pvPerSession: 3.32, totalRev: 137.13, affiliateRev: 137.13, kvpRev: 0, videoRev: 0, nativeRev: 0, totalRPM: 0.11, affiliateRPM: 0.11, kvpRPM: 0, videoRPM: 0, nativeRPM: 0, totalClicks: 0, affiliateClicks: 0, nextPageClicks: 0, videoClicks: 0, nativeClicks: 0, sessions: 379000, totalRPS: 0.362, affiliateCTR: 0, affiliateEPC: 0 },
  { month: 10, year: 2025, publisher: "On3", humanViews: 1121000, botPVs: 802000, totalPVs: 1923000, smartScrollViews: 851000, pvPerSession: 2.15, totalRev: 18, affiliateRev: 18, kvpRev: 0, videoRev: 0, nativeRev: 0, totalRPM: 0.01, affiliateRPM: 0.01, kvpRPM: 0, videoRPM: 0, nativeRPM: 0, totalClicks: 18163, affiliateClicks: 2253, nextPageClicks: 15910, videoClicks: 0, nativeClicks: 0, sessions: 894000, totalRPS: 0.02, affiliateCTR: 0.0012, affiliateEPC: 0.008 },
  { month: 10, year: 2025, publisher: "Swimming World", humanViews: 567000, botPVs: 617500, totalPVs: 1184500, smartScrollViews: 230700, pvPerSession: 2.49, totalRev: 0, affiliateRev: 0, kvpRev: 0, videoRev: 0, nativeRev: 0, totalRPM: 0, affiliateRPM: 0, kvpRPM: 0, videoRPM: 0, nativeRPM: 0, totalClicks: 42, affiliateClicks: 42, nextPageClicks: 0, videoClicks: 0, nativeClicks: 0, sessions: 476000, totalRPS: 0, affiliateCTR: 0, affiliateEPC: 0 },
  { month: 10, year: 2025, publisher: "TWSN", humanViews: 39000, botPVs: 219000, totalPVs: 258000, smartScrollViews: 0, pvPerSession: 129, totalRev: 0.36, affiliateRev: 0, kvpRev: 0.36, videoRev: 0, nativeRev: 0, totalRPM: 0, affiliateRPM: 0, kvpRPM: 0, videoRPM: 0, nativeRPM: 0, totalClicks: 1, affiliateClicks: 1, nextPageClicks: 0, videoClicks: 0, nativeClicks: 0, sessions: 2000, totalRPS: 0.181, affiliateCTR: 0, affiliateEPC: 0 },

  // September 2025
  { month: 9, year: 2025, publisher: "Brit.Co", humanViews: 560000, botPVs: 0, totalPVs: 560000, smartScrollViews: 31700, pvPerSession: 11.31, totalRev: 0, affiliateRev: 0, kvpRev: 0, videoRev: 0, nativeRev: 0, totalRPM: 0, affiliateRPM: 0, kvpRPM: 0, videoRPM: 0, nativeRPM: 0, totalClicks: 55, affiliateClicks: 55, nextPageClicks: 0, videoClicks: 0, nativeClicks: 0, sessions: 49500, totalRPS: 0, affiliateCTR: 0.0001, affiliateEPC: 0 },
  { month: 9, year: 2025, publisher: "On3", humanViews: 297000, botPVs: 0, totalPVs: 297000, smartScrollViews: 184000, pvPerSession: 1.38, totalRev: 0, affiliateRev: 0, kvpRev: 0, videoRev: 0, nativeRev: 0, totalRPM: 0, affiliateRPM: 0, kvpRPM: 0, videoRPM: 0, nativeRPM: 0, totalClicks: 1905, affiliateClicks: 715, nextPageClicks: 1190, videoClicks: 0, nativeClicks: 0, sessions: 215000, totalRPS: 0, affiliateCTR: 0.0024, affiliateEPC: 0 },
  { month: 9, year: 2025, publisher: "Swimming World", humanViews: 267000, botPVs: 0, totalPVs: 267000, smartScrollViews: 173500, pvPerSession: 1.08, totalRev: 0, affiliateRev: 0, kvpRev: 0, videoRev: 0, nativeRev: 0, totalRPM: 0, affiliateRPM: 0, kvpRPM: 0, videoRPM: 0, nativeRPM: 0, totalClicks: 13, affiliateClicks: 13, nextPageClicks: 0, videoClicks: 0, nativeClicks: 0, sessions: 248000, totalRPS: 0, affiliateCTR: 0, affiliateEPC: 0 },
];

// Helper functions
export const getMonthName = (month: number): string => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[month - 1];
};

export const formatCurrency = (value: number): string => {
  if (!Number.isFinite(value)) return "—";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1000) {
    return `${sign}$${(abs / 1000).toFixed(2)}K`;
  }
  return `${sign}$${abs.toFixed(2)}`;
};

/** Full USD for tooltips / QA (no K/M compaction). */
export const formatCurrencyFull = (value: number): string => {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value);
};

/** Whole numbers with grouping for chart tooltips and axes (PVs, views, sessions). */
export const formatChartCount = (value: number): string => {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    Math.round(value)
  );
};

/** Percent for charts (rates, SS ÷ PVs, etc.). */
export const formatPercentChart = (
  value: number,
  fractionDigits = 1
): string => {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(fractionDigits)}%`;
};

export const formatNumber = (value: number): string => {
  if (!Number.isFinite(value)) return "—";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1000) {
    return `${sign}${(abs / 1000).toFixed(1)}K`;
  }
  return `${sign}${abs.toFixed(0)}`;
};

/** MoM ratio (e.g. from API) → percentage points for display (e.g. -5.2 means −5.2%). */
export function pctFromRatio(ratio: number | null | undefined): number | undefined {
  if (ratio == null || !Number.isFinite(ratio)) return undefined;
  return ratio * 100;
}

const MOM_MIN_PRIOR_REVENUE_USD = 25;
const MOM_MAX_ABS_PCT = 400;

/**
 * MoM line for revenue-style metrics. `pctPoints` must be from pctFromRatio (already ×100 vs raw ratio).
 * Do not multiply by 100 again in UI.
 */
export function formatMomPercentLine(
  pctPoints: number | undefined,
  options?: {
    priorRevenue?: number | null;
    priorMonthLabel?: string | null;
    /** Omit “vs {month}” and shorten edge-case copy (dense tiles). */
    compact?: boolean;
  }
): string | null {
  if (pctPoints == null || !Number.isFinite(pctPoints)) return null;
  const pr = options?.priorRevenue;
  const compact = options?.compact === true;
  if (pr != null && Number.isFinite(pr) && Math.abs(pr) < MOM_MIN_PRIOR_REVENUE_USD) {
    return compact ? "—" : "MoM — prior month too small to compare";
  }
  if (Math.abs(pctPoints) > MOM_MAX_ABS_PCT) {
    return compact ? "—" : "MoM — not comparable (prior month near zero)";
  }
  const sign = pctPoints >= 0 ? "+" : "";
  const tail =
    compact || !options?.priorMonthLabel ? "" : ` vs ${options.priorMonthLabel}`;
  return `${sign}${pctPoints.toFixed(1)}% MoM${tail}`;
}

/** RPM MoM; caps absurd % when prior-month RPM was ~0. */
export function formatRpmMomPercentLine(
  pctPoints: number | undefined,
  options?: { priorMonthLabel?: string | null; compact?: boolean }
): string | null {
  if (pctPoints == null || !Number.isFinite(pctPoints)) return null;
  const compact = options?.compact === true;
  if (Math.abs(pctPoints) > MOM_MAX_ABS_PCT) {
    return compact ? "—" : "MoM — not comparable (prior RPM near zero)";
  }
  const sign = pctPoints >= 0 ? "+" : "";
  const tail =
    compact || !options?.priorMonthLabel ? "" : ` vs ${options.priorMonthLabel}`;
  return `${sign}${pctPoints.toFixed(1)}% MoM${tail}`;
}

export const getPublishers = (): string[] => {
  return [...new Set(publisherData.map(d => d.publisher))].sort();
};

export const getMonthlyTotals = () => {
  const grouped = publisherData.reduce((acc, curr) => {
    const key = `${curr.year}-${curr.month}`;
    if (!acc[key]) {
      acc[key] = {
        month: curr.month,
        year: curr.year,
        label: `${getMonthName(curr.month)} ${curr.year}`,
        totalRev: 0,
        totalPVs: 0,
        humanViews: 0,
        sessions: 0,
        totalClicks: 0,
        affiliateRev: 0,
        kvpRev: 0,
        nativeRev: 0,
        videoRev: 0,
      };
    }
    acc[key].totalRev += curr.totalRev;
    acc[key].totalPVs += curr.totalPVs;
    acc[key].humanViews += curr.humanViews;
    acc[key].sessions += curr.sessions;
    acc[key].totalClicks += curr.totalClicks;
    acc[key].affiliateRev += curr.affiliateRev;
    acc[key].kvpRev += curr.kvpRev;
    acc[key].nativeRev += curr.nativeRev;
    acc[key].videoRev += curr.videoRev;
    return acc;
  }, {} as Record<string, {
    month: number;
    year: number;
    label: string;
    totalRev: number;
    totalPVs: number;
    humanViews: number;
    sessions: number;
    totalClicks: number;
    affiliateRev: number;
    kvpRev: number;
    nativeRev: number;
    videoRev: number;
  }>);

  return Object.values(grouped).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
};

export const getPublisherTotals = () => {
  const grouped = publisherData.reduce((acc, curr) => {
    if (!acc[curr.publisher]) {
      acc[curr.publisher] = {
        publisher: curr.publisher,
        totalRev: 0,
        totalPVs: 0,
        humanViews: 0,
        sessions: 0,
        totalClicks: 0,
        affiliateRev: 0,
        kvpRev: 0,
        nativeRev: 0,
      };
    }
    acc[curr.publisher].totalRev += curr.totalRev;
    acc[curr.publisher].totalPVs += curr.totalPVs;
    acc[curr.publisher].humanViews += curr.humanViews;
    acc[curr.publisher].sessions += curr.sessions;
    acc[curr.publisher].totalClicks += curr.totalClicks;
    acc[curr.publisher].affiliateRev += curr.affiliateRev;
    acc[curr.publisher].kvpRev += curr.kvpRev;
    acc[curr.publisher].nativeRev += curr.nativeRev;
    return acc;
  }, {} as Record<string, {
    publisher: string;
    totalRev: number;
    totalPVs: number;
    humanViews: number;
    sessions: number;
    totalClicks: number;
    affiliateRev: number;
    kvpRev: number;
    nativeRev: number;
  }>);

  return Object.values(grouped).sort((a, b) => b.totalRev - a.totalRev);
};
