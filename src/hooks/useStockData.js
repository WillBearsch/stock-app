import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getCandles,
  getCompanyProfile,
  getQuote,
  searchSymbols,
} from "../services/marketApi";
import useDebouncedValue from "./useDebouncedValue";

const DEFAULT_SYMBOL = "AAPL";
const DEFAULT_RANGE = "1M";
const WATCHLIST_STORAGE_KEY = "stock-app-watchlist";
const DEFAULT_WATCHLIST = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "META", "GOOGL", "AMD"];

const readInitialWatchlist = () => {
  try {
    const stored = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!stored) return DEFAULT_WATCHLIST;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_WATCHLIST;
    }
    return parsed;
  } catch (_err) {
    return DEFAULT_WATCHLIST;
  }
};

const useStockData = () => {
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [range, setRange] = useState(DEFAULT_RANGE);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [profile, setProfile] = useState(null);
  const [quote, setQuote] = useState(null);
  const [candles, setCandles] = useState(null);
  const [watchlist, setWatchlist] = useState(readInitialWatchlist);
  const [watchlistQuotes, setWatchlistQuotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  const refreshPrimaryData = useCallback(async () => {
    setError("");
    try {
      const [profileData, quoteData] = await Promise.all([
        getCompanyProfile(symbol),
        getQuote(symbol),
      ]);
      setProfile(profileData);
      setQuote(quoteData);
      setWatchlistQuotes((prev) => ({ ...prev, [symbol]: quoteData }));
    } catch (_err) {
      setError("Unable to fetch market data right now.");
    }
  }, [symbol]);

  const refreshCandles = useCallback(async () => {
    setLoading(true);
    try {
      const candleData = await getCandles(symbol, range);
      setCandles(candleData);
    } catch (_err) {
      setCandles(null);
      setError("Unable to fetch historical close prices right now.");
    } finally {
      setLoading(false);
    }
  }, [symbol, range]);

  const refreshQuoteOnly = useCallback(async () => {
    try {
      const quoteData = await getQuote(symbol);
      setQuote(quoteData);
      setWatchlistQuotes((prev) => ({ ...prev, [symbol]: quoteData }));
    } catch (_err) {
      setError("Quote refresh failed.");
    }
  }, [symbol]);

  const refreshWatchlist = useCallback(async () => {
    const symbols = [...new Set(watchlist)];
    const results = await Promise.allSettled(
      symbols.map(async (item) => {
        const nextQuote = await getQuote(item);
        return [item, nextQuote];
      })
    );

    setWatchlistQuotes((prev) => {
      const next = {};

      for (const symbolItem of symbols) {
        if (prev[symbolItem]) {
          next[symbolItem] = prev[symbolItem];
        }
      }

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          const [item, nextQuote] = result.value;
          next[item] = nextQuote;
        }
      });

      return next;
    });

    if (results.some((result) => result.status === "rejected")) {
      setError("Some watchlist quotes could not be refreshed.");
    }
  }, [watchlist]);

  useEffect(() => {
    refreshPrimaryData();
  }, [refreshPrimaryData]);

  useEffect(() => {
    refreshCandles();
  }, [refreshCandles]);

  useEffect(() => {
    refreshWatchlist();
  }, [refreshWatchlist]);

  useEffect(() => {
    const quoteTimer = window.setInterval(() => {
      refreshQuoteOnly();
    }, 15000);

    const watchlistTimer = window.setInterval(() => {
      refreshWatchlist();
    }, 30000);

    return () => {
      window.clearInterval(quoteTimer);
      window.clearInterval(watchlistTimer);
    };
  }, [refreshQuoteOnly, refreshWatchlist]);

  useEffect(() => {
    let ignore = false;

    const search = async () => {
      if (!debouncedQuery || debouncedQuery.trim().length < 1) {
        setSearchResults([]);
        return;
      }
      setSearchLoading(true);
      const results = await searchSymbols(debouncedQuery);
      if (!ignore) {
        setSearchResults(results);
      }
      setSearchLoading(false);
    };

    search();

    return () => {
      ignore = true;
    };
  }, [debouncedQuery]);

  const chartData = useMemo(() => {
    if (!candles?.c || !candles?.t) {
      return [];
    }

    return candles.c
      .map((close, index) => ({
        close: Number(close),
        timestamp: Number(candles.t[index]) * 1000,
      }))
      .filter((point) => Number.isFinite(point.close) && Number.isFinite(point.timestamp))
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((point) => ({
        ...point,
        label: new Date(point.timestamp).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
      }));
  }, [candles]);

  const selectSymbol = useCallback((nextSymbol) => {
    setSymbol(nextSymbol);
    setQuery("");
    setSearchResults([]);
    setWatchlist((prev) => {
      if (prev.includes(nextSymbol)) {
        return prev;
      }
      return [nextSymbol, ...prev].slice(0, 8);
    });
  }, []);

  const toggleWatchlist = useCallback(
    async (nextSymbol) => {
      const normalizedSymbol = String(nextSymbol || "").trim().toUpperCase();
      if (!normalizedSymbol) return;

      const wasIncluded = watchlist.includes(normalizedSymbol);
      setWatchlist((prev) => {
        if (prev.includes(normalizedSymbol)) {
          return prev.filter((item) => item !== normalizedSymbol);
        }
        return [normalizedSymbol, ...prev].slice(0, 300);
      });

      if (wasIncluded) {
        setWatchlistQuotes((prev) => {
          const next = { ...prev };
          delete next[normalizedSymbol];
          return next;
        });
      }

      // Optimistic UI update first, then hydrate quote in the background.
      if (!wasIncluded) {
        if (normalizedSymbol === symbol && quote) {
          setWatchlistQuotes((prev) => ({ ...prev, [normalizedSymbol]: quote }));
        } else {
          try {
            const nextQuote = await getQuote(normalizedSymbol);
            setWatchlistQuotes((prev) => ({ ...prev, [normalizedSymbol]: nextQuote }));
          } catch (_err) {
            setError("Unable to refresh watchlist quote.");
          }
        }
      }
    },
    [watchlist, quote, symbol]
  );

  return {
    symbol,
    range,
    setRange,
    query,
    setQuery,
    searchResults,
    searchLoading,
    profile,
    quote,
    chartData,
    watchlist,
    watchlistQuotes,
    loading,
    error,
    selectSymbol,
    toggleWatchlist,
  };
};

export default useStockData;
