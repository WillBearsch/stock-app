import React, { useMemo } from "react";
import Card from "../components/Card";

const marketUniverse = [
  "AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "META", "GOOGL", "AMD", "NFLX", "PLTR",
  "SHOP", "CRM", "ORCL", "INTC", "CSCO", "UBER", "SNOW", "ADBE", "PANW", "QCOM",
];

const ExploreRoute = ({ market }) => {
  const { watchlist, watchlistQuotes, selectSymbol, toggleWatchlist } = market;

  const movers = useMemo(() => {
    return marketUniverse
      .map((symbol) => {
        const quote = watchlistQuotes[symbol];
        const diff = Number(quote?.c ?? 0) - Number(quote?.pc ?? 0);
        const pct = quote?.pc ? (diff / quote.pc) * 100 : 0;
        return { symbol, pct, price: quote?.c ?? 0 };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [watchlistQuotes]);

  return (
    <section className="dashboard single-panel">
      <Card className="side side-expanded">
        <div className="side-header">
          <h2 className="section-name">Market Movers</h2>
          <span className="muted">Hover rows for actions</span>
        </div>
        <div className="movers-grid">
          {movers.map((item) => (
            <div key={item.symbol} className="mover-row">
              <button type="button" className="mover-main" onClick={() => selectSymbol(item.symbol)}>
                <strong>{item.symbol}</strong>
                <span className="muted">${Number(item.price || 0).toFixed(2)}</span>
              </button>
              <span className={`mini-change ${item.pct >= 0 ? "delta up" : "delta down"}`}>
                {item.pct >= 0 ? "+" : ""}
                {item.pct.toFixed(2)}%
              </span>
              <button
                type="button"
                className={`micro-btn ${watchlist.includes(item.symbol) ? "active" : ""}`}
                onClick={() => toggleWatchlist(item.symbol)}
              >
                {watchlist.includes(item.symbol) ? "Saved" : "Watch"}
              </button>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
};

export default React.memo(ExploreRoute);
