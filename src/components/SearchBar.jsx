import React, { useState, useEffect } from "react";

const SearchBar = ({ onSearch }) => {
  const [term, setTerm] = useState("");

  useEffect(() => {
    const t = setTimeout(() => onSearch(term), 200);
    return () => clearTimeout(t);
  }, [term, onSearch]);

  return (
    <div className="relative">
      <input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search keys/values…"
        className="w-full rounded-xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <svg
        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" strokeWidth="2" />
        <path d="M21 21l-3.5-3.5" strokeWidth="2" />
      </svg>
    </div>
  );
};

export default SearchBar;
