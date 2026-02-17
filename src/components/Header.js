import React from "react";
import Search from "./Search";

const Header = ({
  profile,
  quote,
  query,
  setQuery,
  searchResults,
  onSelectSearchResult,
  searchLoading,
  onToggleWatchlist,
  inWatchlist,
}) => {
  const price = Number(quote?.c ?? 0);
  const prevClose = Number(quote?.pc ?? 0);
  const diff = price - prevClose;
  const diffPct = prevClose ? (diff / prevClose) * 100 : 0;

  return (
    <section className="top panel">
      <div className="top-grid">
        <div>
          <div className="title-row">
            <div>
              <h1 className="name">{profile?.name || "Unknown Company"}</h1>
              <div className="ticker">
                {profile?.ticker || "N/A"} {profile?.exchange ? `- ${profile.exchange}` : ""}
              </div>
            </div>
            <div className="quote-row">
              <div className="price">${price.toFixed(2)}</div>
              <div className={`delta ${diff >= 0 ? "up" : "down"}`}>
                {diff >= 0 ? "+" : ""}
                {diff.toFixed(2)} ({diffPct.toFixed(2)}%)
              </div>
              {onToggleWatchlist ? (
                <button
                  type="button"
                  className={`micro-btn ${inWatchlist ? "active" : ""}`}
                  onClick={onToggleWatchlist}
                >
                  {inWatchlist ? "In Watchlist" : "Add Watchlist"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
        <Search
          query={query}
          setQuery={setQuery}
          results={searchResults}
          onSelect={onSelectSearchResult}
          loading={searchLoading}
        />
      </div>
    </section>
  );
};

export default React.memo(Header);
