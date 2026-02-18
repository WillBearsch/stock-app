import { mockCompanyDetails } from "../constants/mock";

const API_BASE = "https://finnhub.io/api/v1";
const API_KEY = process.env.REACT_APP_FINNHUB_API_KEY || process.env.FINNHUB_API_KEY;
const ALPHA_VANTAGE_API_KEY =
  process.env.REACT_APP_ALPHA_VANTAGE_API_KEY || process.env.ALPHA_VANTAGE_API_KEY;
const ALPHA_VANTAGE_BASE = "https://www.alphavantage.co/query";
const DAY_SECONDS = 24 * 60 * 60;

const RANGE_CONFIG = {
  "1D": { seconds: DAY_SECONDS, resolution: "5" },
  "1W": { seconds: 7 * DAY_SECONDS, resolution: "30" },
  "1M": { seconds: 30 * DAY_SECONDS, resolution: "60" },
  "1Y": { seconds: 365 * DAY_SECONDS, resolution: "D" },
};
const RANGE_FALLBACK_POINTS = {
  "1D": 1,
  "1W": 5,
  "1M": 22,
  "1Y": 52,
};

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

const requestAlphaVantage = async (params = {}) => {
  if (!ALPHA_VANTAGE_API_KEY) {
    throw new Error("Missing API key. Set REACT_APP_ALPHA_VANTAGE_API_KEY in .env");
  }

  const query = new URLSearchParams({
    ...params,
    apikey: ALPHA_VANTAGE_API_KEY,
  });

  const response = await fetch(`${ALPHA_VANTAGE_BASE}?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`Alpha Vantage request failed with status ${response.status}`);
  }

  return response.json();
};

const mapAlphaQuote = (result) => {
  const quote = result?.["Global Quote"];
  if (!quote) {
    throw new Error("Missing Alpha Vantage quote payload");
  }

  const current = Number(quote["05. price"]);
  const previous = Number(quote["08. previous close"]);
  if (!Number.isFinite(current) || current <= 0) {
    throw new Error("Invalid Alpha Vantage quote");
  }

  const open = Number(quote["02. open"]);
  const high = Number(quote["03. high"]);
  const low = Number(quote["04. low"]);

  return {
    c: current,
    h: Number.isFinite(high) && high > 0 ? high : current,
    l: Number.isFinite(low) && low > 0 ? low : current,
    o: Number.isFinite(open) && open > 0 ? open : current,
    pc: Number.isFinite(previous) && previous > 0 ? previous : current,
    t: Math.floor(Date.now() / 1000),
  };
};

const hashString = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const buildMockQuote = (symbol) => {
  const seed = hashString(symbol || "UNKNOWN");
  const base = 80 + (seed % 420);
  const offset = ((seed % 11) - 5) * 0.37;
  const current = Number((base + offset).toFixed(2));
  const previous = Number((current - ((seed % 7) - 3) * 0.28).toFixed(2));
  const high = Number((Math.max(current, previous) + 1.2).toFixed(2));
  const low = Number((Math.min(current, previous) - 1.2).toFixed(2));

  return {
    c: current,
    h: high,
    l: low,
    o: previous,
    pc: previous,
    t: Math.floor(Date.now() / 1000),
  };
};

const rangeToUnix = (range) => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const config = RANGE_CONFIG[range] || RANGE_CONFIG["1M"];

  return {
    from: nowSeconds - config.seconds,
    to: nowSeconds,
  };
};

const rangeToResolution = (range) => {
  const config = RANGE_CONFIG[range] || RANGE_CONFIG["1M"];
  return config.resolution;
};

const parseAlphaTimestamp = (value) => {
  if (!value) return NaN;
  const normalized = String(value).includes(" ")
    ? String(value).replace(" ", "T")
    : `${value}T00:00:00`;
  return Date.parse(normalized);
};

const mapAlphaSeriesToCandles = (series, from, to, range) => {
  const rows = Object.entries(series || {})
    .map(([timeLabel, point]) => {
      const ts = parseAlphaTimestamp(timeLabel);
      return {
        t: Math.floor(ts / 1000),
        o: Number(point["1. open"]),
        h: Number(point["2. high"]),
        l: Number(point["3. low"]),
        c: Number(point["4. close"]),
        v: Number(point["5. volume"] || 0),
      };
    })
    .filter(
      (row) =>
        Number.isFinite(row.t) &&
        Number.isFinite(row.c) &&
        Number.isFinite(row.o) &&
        Number.isFinite(row.h) &&
        Number.isFinite(row.l)
    )
    .sort((a, b) => a.t - b.t);

  const filtered = rows.filter((row) => row.t >= from && row.t <= to);
  const selected =
    filtered.length > 0
      ? filtered
      : rows.slice(-1 * (RANGE_FALLBACK_POINTS[range] || RANGE_FALLBACK_POINTS["1M"]));

  if (!selected.length) {
    throw new Error("No Alpha Vantage historical rows available");
  }

  return {
    s: "ok",
    t: selected.map((row) => row.t),
    o: selected.map((row) => row.o),
    h: selected.map((row) => row.h),
    l: selected.map((row) => row.l),
    c: selected.map((row) => row.c),
    v: selected.map((row) => row.v),
  };
};

const getCandlesFromAlpha = async (symbol, range, from, to) => {
  const isOneYear = range === "1Y";
  const params = isOneYear
    ? { function: "TIME_SERIES_WEEKLY", symbol }
    : { function: "TIME_SERIES_DAILY", symbol, outputsize: "compact" };
  const result = await requestAlphaVantage(params);
  const series = isOneYear ? result?.["Weekly Time Series"] : result?.["Time Series (Daily)"];

  if (!series) {
    console.error("[getCandles] Alpha Vantage unexpected response:", result);
    throw new Error("Alpha Vantage returned no usable historical series");
  }

  return mapAlphaSeriesToCandles(series, from, to, range);
};

export const getQuote = async (symbol) => {
  try {
    return await request("/quote", { symbol });
  } catch (_finnhubError) {
    try {
      const alphaResult = await requestAlphaVantage({
        function: "GLOBAL_QUOTE",
        symbol,
      });
      return mapAlphaQuote(alphaResult);
    } catch (_alphaError) {
      return buildMockQuote(symbol);
    }
  }
};

export const getCompanyProfile = async (symbol) => {
  try {
    return await request("/stock/profile2", { symbol });
  } catch (_error) {
    return { ...mockCompanyDetails, ticker: symbol };
  }
};

export const getCandles = async (symbol, range) => {
  const { from, to } = rangeToUnix(range);
  const resolution = rangeToResolution(range);

  const requestUrl = `${API_BASE}/stock/candle?${toQuery({
    symbol,
    resolution,
    from,
    to,
  })}`;

  const response = await fetch(requestUrl);
  const text = await response.text();
  let result = null;
  try {
    result = JSON.parse(text);
  } catch (_err) {
    result = { raw: text };
  }

  if (response.ok && result?.s === "ok" && Array.isArray(result.c) && Array.isArray(result.t)) {
    return result;
  }

  console.error("[getCandles] Finnhub candle request failed", {
    symbol,
    range,
    resolution,
    from,
    to,
    status: response.status,
    response: result,
  });

  try {
    const alphaCandles = await getCandlesFromAlpha(symbol, range, from, to);
    console.info("[getCandles] Using Alpha Vantage historical fallback", {
      symbol,
      range,
      points: alphaCandles.c.length,
    });
    return alphaCandles;
  } catch (alphaError) {
    console.error("[getCandles] Alpha Vantage candle fallback failed", alphaError);
    throw new Error("Unable to fetch historical candle data");
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
