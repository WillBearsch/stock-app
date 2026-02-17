import React from "react";

const Card = ({ children, className = "" }) => {
  return (
    <div className={`panel ${className}`}>
      {children}
    </div>
  );
};

export default React.memo(Card);
