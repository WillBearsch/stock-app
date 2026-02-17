import React, { useMemo } from "react";
import Card from "../components/Card";
import VirtualizedList from "../components/VirtualizedList";

const toCurrency = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

const WatchlistRoute = ({ market }) => {
  const { watchlist, watchlistQuotes, selectSymbol, toggleWatchlist } = market;

  const longList = useMemo(() => {
    const repeated = [];
    const multiplier = 30;
    for (let i = 0; i < multiplier; i += 1) {
      for (const symbol of watchlist) {
        repeated.push(`${symbol}${i === 0 ? "" : `-${i}`}`);
      }
    }
    return repeated;
  }, [watchlist]);

  return (
    <section className="dashboard single-panel">
      <Card className="watch watch-expanded">
        <div className="watch-header">
          <h2 className="section-name">Virtualized Watchlist</h2>
          <span className="muted">{longList.length} rows rendered efficiently</span>
        </div>
        <VirtualizedList
          items={longList}
          itemHeight={62}
          viewportHeight={560}
          renderItem={(rowSymbol, index) => {
            const baseSymbol = rowSymbol.split("-")[0];
            const q = watchlistQuotes[baseSymbol];
            const diff = Number(q?.c ?? 0) - Number(q?.pc ?? 0);
            return (
              <div className="watch-item virtual-item" key={`${rowSymbol}-${index}`}>
                <button type="button" onClick={() => selectSymbol(baseSymbol)}>
                  <strong>{rowSymbol}</strong>
                </button>
                <span>{q?.c ? toCurrency(q.c) : "-"}</span>
                <button
                  type="button"
                  className={`micro-btn ${watchlist.includes(baseSymbol) ? "active" : ""}`}
                  onClick={() => toggleWatchlist(baseSymbol)}
                >
                  {watchlist.includes(baseSymbol) ? "Remove" : "Add"}
                </button>
                <span className={`mini-change ${diff >= 0 ? "delta up" : "delta down"}`}>
                  {diff >= 0 ? "+" : ""}
                  {diff.toFixed(2)}
                </span>
              </div>
            );
          }}
        />
      </Card>
    </section>
  );
};

export default React.memo(WatchlistRoute);
