import React, { Suspense, lazy, useMemo } from "react";
import Card from "../components/Card";
import Header from "../components/Header";
import { SkeletonBlock } from "../components/Skeleton";

const LazyPriceChart = lazy(() => import("../components/PriceChart"));

const ranges = ["1D", "1W", "1M", "1Y"];

const toCurrency = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

const OverviewRoute = ({ market }) => {
  const {
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
  } = market;

  const marketCap = useMemo(() => {
    const cap = Number(profile?.marketCapitalization || 0);
    if (!cap) return "N/A";
    return `${cap.toLocaleString(undefined, { maximumFractionDigits: 0 })}M`;
  }, [profile]);

  return (
    <section className="dashboard">
      <Header
        profile={profile}
        quote={quote}
        query={query}
        setQuery={setQuery}
        searchResults={searchResults}
        searchLoading={searchLoading}
        onSelectSearchResult={(item) => selectSymbol(item.symbol)}
        onToggleWatchlist={() => toggleWatchlist(profile?.ticker || symbol)}
        inWatchlist={watchlist.includes(profile?.ticker || symbol)}
      />

      <Card className="chart">
        <div className="title-row">
          <h2 className="name section-name">{symbol} trend</h2>
          <div className="muted">Near-real-time updates every 15s</div>
        </div>
        <div className="range-row">
          {ranges.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRange(item)}
              className={`range-btn ${range === item ? "active" : ""}`}
            >
              {item}
            </button>
          ))}
        </div>
        {loading ? (
          <SkeletonBlock className="skeleton-chart" />
        ) : (
          <Suspense fallback={<SkeletonBlock className="skeleton-chart" />}>
            <LazyPriceChart key={`${symbol}-${range}`} chartData={chartData} />
          </Suspense>
        )}
      </Card>

      <Card className="watch">
        <div className="watch-header">
          <h3 className="section-name">Watchlist</h3>
          <span className="muted">{watchlist.length} symbols</span>
        </div>
        <ul className="watch-list">
          {watchlist.slice(0, 10).map((item) => {
            const wQuote = watchlistQuotes[item];
            const price = Number(wQuote?.c ?? 0);
            const diff = Number(wQuote?.c ?? 0) - Number(wQuote?.pc ?? 0);
            return (
              <li key={item} className="watch-item">
                <button type="button" onClick={() => selectSymbol(item)}>
                  <strong>{item}</strong>
                </button>
                <span>{price ? toCurrency(price) : "-"}</span>
                <button
                  className={`micro-btn ${watchlist.includes(item) ? "active" : ""}`}
                  type="button"
                  onClick={() => toggleWatchlist(item)}
                >
                  {watchlist.includes(item) ? "Remove" : "Add"}
                </button>
                <span className={`mini-change ${diff >= 0 ? "delta up" : "delta down"}`}>
                  {diff >= 0 ? "+" : ""}
                  {diff.toFixed(2)}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="side">
        <div className="side-header">
          <h3 className="section-name">Snapshot</h3>
          <span className="muted">{profile?.country || "US"}</span>
        </div>
        <div className="meta-grid">
          <div className="metric">
            <p className="metric-label">Open</p>
            <p className="metric-value">{toCurrency(quote?.o)}</p>
          </div>
          <div className="metric">
            <p className="metric-label">Prev Close</p>
            <p className="metric-value">{toCurrency(quote?.pc)}</p>
          </div>
          <div className="metric">
            <p className="metric-label">Day High</p>
            <p className="metric-value">{toCurrency(quote?.h)}</p>
          </div>
          <div className="metric">
            <p className="metric-label">Day Low</p>
            <p className="metric-value">{toCurrency(quote?.l)}</p>
          </div>
          <div className="metric">
            <p className="metric-label">Market Cap</p>
            <p className="metric-value">{marketCap}</p>
          </div>
          <div className="metric">
            <p className="metric-label">Industry</p>
            <p className="metric-value">{profile?.finnhubIndustry || "N/A"}</p>
          </div>
          <div className="metric">
            <p className="metric-label">IPO</p>
            <p className="metric-value">{profile?.ipo || "N/A"}</p>
          </div>
          <div className="metric">
            <p className="metric-label">Website</p>
            <p className="metric-value">
              {profile?.weburl ? (
                <a href={profile.weburl} target="_blank" rel="noreferrer">
                  Visit
                </a>
              ) : (
                "N/A"
              )}
            </p>
          </div>
        </div>
        {error ? <div className="muted">{error}</div> : null}
      </Card>
    </section>
  );
};

export default React.memo(OverviewRoute);
