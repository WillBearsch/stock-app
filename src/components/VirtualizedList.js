import React, { useMemo, useState } from "react";

const VirtualizedList = ({
  items,
  itemHeight = 56,
  viewportHeight = 420,
  overscan = 6,
  renderItem,
}) => {
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(viewportHeight / itemHeight) + overscan * 2;
  const end = Math.min(items.length, start + visibleCount);

  const visibleItems = useMemo(() => items.slice(start, end), [items, start, end]);

  return (
    <div
      className="virtual-list"
      style={{ height: viewportHeight }}
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${start * itemHeight}px)` }}>
          {visibleItems.map((item, index) => renderItem(item, start + index))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(VirtualizedList);
