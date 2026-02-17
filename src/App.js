import "./App.css";
import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { RouteSkeleton } from "./components/Skeleton";
import useHashRoute from "./hooks/useHashRoute";
import useStockData from "./hooks/useStockData";
import useTheme from "./hooks/useTheme";

const OverviewRoute = lazy(() => import("./routes/OverviewRoute"));
const WatchlistRoute = lazy(() => import("./routes/WatchlistRoute"));
const ExploreRoute = lazy(() => import("./routes/ExploreRoute"));

const routeConfig = {
  "/overview": { label: "Overview", component: OverviewRoute },
  "/watchlist": { label: "Watchlist", component: WatchlistRoute },
  "/explore": { label: "Explore", component: ExploreRoute },
};

function App() {
  const market = useStockData();
  const { route, navigate } = useHashRoute();
  const { theme, toggleTheme } = useTheme();
  const [displayRoute, setDisplayRoute] = useState(route in routeConfig ? route : "/overview");
  const [phase, setPhase] = useState("enter");

  useEffect(() => {
    const nextRoute = route in routeConfig ? route : "/overview";
    if (nextRoute === displayRoute) return;
    setPhase("exit");
    const timer = window.setTimeout(() => {
      setDisplayRoute(nextRoute);
      setPhase("enter");
    }, 180);
    return () => window.clearTimeout(timer);
  }, [route, displayRoute]);

  const ActiveRoute = useMemo(
    () => routeConfig[displayRoute]?.component || OverviewRoute,
    [displayRoute]
  );

  return (
    <main className="app-shell">
      <header className="app-nav panel">
        <nav className="nav-links" aria-label="Primary routes">
          {Object.entries(routeConfig).map(([path, details]) => (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              className={`nav-btn ${route === path ? "active" : ""}`}
            >
              {details.label}
            </button>
          ))}
        </nav>
        <button type="button" className="theme-btn" onClick={toggleTheme}>
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
      </header>
      <section className={`route-stage ${phase}`}>
        <Suspense fallback={<RouteSkeleton />}>
          <ActiveRoute market={market} />
        </Suspense>
      </section>
    </main>
  );
}

export default App;
