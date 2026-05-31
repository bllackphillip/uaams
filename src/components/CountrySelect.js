"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { COUNTRIES } from "@/lib/constants";

export default function CountrySelect({ value, onChange, name, required, error, readOnly, placeholder = "Select country" }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  const selected = COUNTRIES.find((c) => c.name === value);
  const filtered = search.trim()
    ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : COUNTRIES;

  useEffect(() => {
    function handleOutsideClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function handleSelect(country) {
    onChange({ target: { name, value: country.name } });
    setOpen(false);
    setSearch("");
  }

  function toggleOpen() {
    if (readOnly) return;
    setOpen((v) => !v);
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={toggleOpen}
        className={`w-full border rounded px-3 py-2 text-sm text-left flex items-center gap-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
          readOnly
            ? "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
            : error
            ? "border-red-400"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        {selected ? (
          <>
            <Image
              src={`https://flagcdn.com/20x15/${selected.code.toLowerCase()}.png`}
              alt={selected.name}
              width={20}
              height={15}
              className="shrink-0 rounded-sm"
              unoptimized
            />
            <span className={readOnly ? "text-gray-500" : "text-gray-900"}>{selected.name}</span>
          </>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        {!readOnly && (
          <svg className="w-4 h-4 ml-auto text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col" style={{ maxHeight: "260px" }}>
          {/* Search input */}
          <div className="p-2 border-b border-gray-100 shrink-0">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country..."
              className="w-full text-sm px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>
          {/* List */}
          <div className="overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 px-3 py-3 text-center">No countries found</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => handleSelect(c)}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 hover:bg-blue-50 transition-colors ${
                    value === c.name ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-800"
                  }`}
                >
                  <Image
                    src={`https://flagcdn.com/20x15/${c.code.toLowerCase()}.png`}
                    alt={c.name}
                    width={20}
                    height={15}
                    className="shrink-0 rounded-sm"
                    unoptimized
                  />
                  {c.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Hidden input keeps form semantics; actual validation is done in JS */}
      <input type="hidden" name={name} value={value || ""} />

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
