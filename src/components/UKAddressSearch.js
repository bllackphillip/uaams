"use client";

import { useState, useEffect, useRef } from "react";

// NOTE FOR REPORT:
// Full house-level address lookup is implemented in src/app/api/address-lookup/route.js
// using the Ideal Postcodes API (uncomment + add IDEALPOSTCODES_API_KEY to enable).
// getAddress.io (original provider) was shut down 4 February 2026 by court order.
//
// This component uses postcodes.io (free, no API key):
//   - /postcodes?q={partial}  →  prefix search, shows dropdown as user types
//   - /postcodes/{postcode}   →  full lookup on selection, fills city + postcode

export default function UKAddressSearch({ onSelect }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function onOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  async function doSearch(q) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `https://api.postcodes.io/postcodes?q=${encodeURIComponent(q)}&limit=8`
      );
      const data = await res.json();
      if (data.status === 200 && data.result?.length > 0) {
        setSuggestions(data.result);
        setOpen(true);
      } else {
        setSuggestions([]);
        setOpen(false);
      }
    } catch {
      setError("Could not search postcodes. Fill in your address manually below.");
    } finally {
      setLoading(false);
    }
  }

  // Debounced search — fires after 2+ characters
  useEffect(() => {
    clearTimeout(debounceRef.current);
    const q = query.trim();

    if (q.length < 2) {
      debounceRef.current = setTimeout(() => {
        setError("");
        setSuggestions([]);
        setOpen(false);
      }, 0);
      return () => clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => doSearch(q), 350);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function handleSelect(result) {
    const postcode = result.postcode;
    const city = result.admin_district || result.region || "";
    setQuery(postcode);
    setOpen(false);
    setSuggestions([]);
    onSelect({ line1: "", line2: "", city, postcode });
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Start typing your postcode (e.g. IP2)"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
          autoComplete="off"
          maxLength={8}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {suggestions.map((s) => (
            <button
              key={s.postcode}
              type="button"
              onClick={() => handleSelect(s)}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-0 transition-colors"
            >
              <span className="font-medium text-gray-900">{s.postcode}</span>
              {s.admin_district && (
                <span className="text-gray-400 ml-2">
                  {s.admin_district}
                  {s.admin_county && s.admin_county !== s.admin_district
                    ? `, ${s.admin_county}`
                    : ""}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
