import { mockCompanyDetails, mockHistoricalData, mockStockQuote } from "../constants/mock";

const API_BASE = "https://finnhub.io/api/v1";
const API_KEY = process.env.REACT_APP_FINNHUB_API_KEY || process.env.FINNHUB_API_KEY;

const toQuery = (params) => {
  const query = new URLSearchParams({
    ...params,
    token: API_KEY || "",
  });
  return query.toString();
};

const request = async (path, params = {}) => {
  if (!API_KEY) {
    throw new Error("Missing API key. Set REACT_APP_FINNHUB_API_KEY in .env");
  }

  const response = await fetch(`${API_BASE}${path}?${toQuery(params)}`);
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json();
};

export const getQuote = async (symbol) => {
  try {
    return await request("/quote", { symbol });
  } catch (_error) {
    return mockStockQuote;
  }
};

export const getCompanyProfile = async (symbol) => {
  try {
    return await request("/stock/profile2", { symbol });
  } catch (_error) {
    return { ...mockCompanyDetails, ticker: symbol };
  }
};

const rangeToUnix = (range) => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const day = 24 * 60 * 60;
  const ranges = {
    "1D": day,
    "1W": 7 * day,
    "1M": 30 * day,
    "3M": 90 * day,
    "1Y": 365 * day,
  };

  return {
    from: nowSeconds - (ranges[range] || ranges["1M"]),
    to: nowSeconds,
  };
};

const rangeToResolution = (range) => {
  const map = {
    "1D": "5",
    "1W": "30",
    "1M": "60",
    "3M": "D",
    "1Y": "W",
  };
  return map[range] || "60";
};

export const getCandles = async (symbol, range) => {
  try {
    const { from, to } = rangeToUnix(range);
    const resolution = rangeToResolution(range);
    const result = await request("/stock/candle", {
      symbol,
      resolution,
      from,
      to,
    });

    if (result?.s !== "ok" || !Array.isArray(result.c)) {
      throw new Error("No chart data");
    }
    return result;
  } catch (_error) {
    return mockHistoricalData;
  }
};

export const searchSymbols = async (query) => {
  if (!query || query.trim().length < 1) {
    return [];
  }

  try {
    const result = await request("/search", { q: query.trim() });
    return (result?.result || [])
      .filter((item) => item.type === "Common Stock")
      .slice(0, 8);
  } catch (_error) {
    return [];
  }
};
