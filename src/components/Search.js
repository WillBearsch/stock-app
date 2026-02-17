import React from "react";

const Search = ({
  query,
  setQuery,
  results,
  onSelect,
  loading = false,
  placeholder = "Search ticker or company",
}) => {
  return (
    <div className="search-wrap">
      <input
        className="search-input"
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        aria-label="Search stocks"
      />
      <button className="search-button" type="button" aria-hidden>
        /
      </button>
      {query.trim().length > 0 && (
        <ul className="search-results" role="listbox" aria-label="Search results">
          {loading && <li className="muted">Searching...</li>}
          {!loading && results.length === 0 && <li className="muted">No matches</li>}
          {results.map((item) => (
            <li key={`${item.symbol}-${item.description}`}>
              <button
                type="button"
                className="result-item"
                onClick={() => onSelect(item)}
              >
                <strong>{item.symbol}</strong>
                <div className="muted">{item.description}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default React.memo(Search);
