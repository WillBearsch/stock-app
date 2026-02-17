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
    setLoading(true);
    setError("");
    try {
      const [profileData, quoteData, candleData] = await Promise.all([
        getCompanyProfile(symbol),
        getQuote(symbol),
        getCandles(symbol, range),
      ]);
      setProfile(profileData);
      setQuote(quoteData);
      setCandles(candleData);
    } catch (_err) {
      setError("Unable to fetch market data right now.");
    } finally {
      setLoading(false);
    }
  }, [symbol, range]);

  const refreshQuoteOnly = useCallback(async () => {
    try {
      const quoteData = await getQuote(symbol);
      setQuote(quoteData);
    } catch (_err) {
      setError("Quote refresh failed.");
    }
  }, [symbol]);

  const refreshWatchlist = useCallback(async () => {
    try {
      const entries = await Promise.all(
        watchlist.map(async (item) => {
          const nextQuote = await getQuote(item);
          return [item, nextQuote];
        })
      );
      setWatchlistQuotes(Object.fromEntries(entries));
    } catch (_err) {
      setError("Watchlist refresh failed.");
    }
  }, [watchlist]);

  useEffect(() => {
    refreshPrimaryData();
  }, [refreshPrimaryData]);

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

    return candles.c.map((close, index) => ({
      close,
      timestamp: candles.t[index] * 1000,
      label: new Date(candles.t[index] * 1000).toLocaleDateString(undefined, {
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
