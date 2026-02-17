import React from "react";

const SkeletonBlock = ({ className = "" }) => <div className={`skeleton ${className}`} aria-hidden />;

const RouteSkeleton = () => (
  <section className="dashboard">
    <div className="top panel">
      <SkeletonBlock className="skeleton-line skeleton-title" />
      <SkeletonBlock className="skeleton-line" />
    </div>
    <div className="panel chart">
      <SkeletonBlock className="skeleton-line skeleton-title" />
      <SkeletonBlock className="skeleton-chart" />
    </div>
    <div className="panel side">
      <SkeletonBlock className="skeleton-line skeleton-title" />
      <SkeletonBlock className="skeleton-grid" />
    </div>
    <div className="panel watch">
      <SkeletonBlock className="skeleton-line skeleton-title" />
      <SkeletonBlock className="skeleton-list" />
    </div>
  </section>
);

export { SkeletonBlock, RouteSkeleton };
