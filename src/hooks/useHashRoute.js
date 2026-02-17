import { useEffect, useMemo, useState } from "react";

const normalizePath = (raw) => {
  const path = (raw || "").replace(/^#/, "").trim();
  if (!path) return "/overview";
  return path.startsWith("/") ? path : `/${path}`;
};

const useHashRoute = () => {
  const [route, setRoute] = useState(() => normalizePath(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setRoute(normalizePath(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = useMemo(
    () => (path) => {
      const nextPath = normalizePath(path);
      if (nextPath === route) return;
      window.location.hash = nextPath;
    },
    [route]
  );

  return { route, navigate };
};

export default useHashRoute;
