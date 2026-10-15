"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { IconClose, IconSearch } from "@/components/icons/icons";
import { formatMoney } from "@/constants/storefront";
import { type SearchHit, searchProductsAction } from "@/features/navigation/search-actions";
import { resolvePublicAssetSrc } from "@/lib/public-assets";
import { lockScroll } from "@/lib/scroll-lock";

const MIN_QUERY = 2;
const DEBOUNCE_MS = 280;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const requestIdRef = useRef(0);

  const handleClose = useCallback(() => {
    requestIdRef.current += 1;
    setQuery("");
    setResults([]);
    setLoading(false);
    setHasSearched(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const unlock = lockScroll();
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => {
      unlock();
      window.clearTimeout(focusTimer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const panel = panelRef.current;
      if (!panel) {
        return;
      }
      const nodes = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1,
      );
      if (nodes.length < 2) {
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!first || !last) {
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      void searchProductsAction(trimmed).then((hits) => {
        if (requestId !== requestIdRef.current) {
          return;
        }
        setResults(hits);
        setLoading(false);
        setHasSearched(true);
      });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [open, query]);

  const tooShort = query.trim().length < MIN_QUERY;
  const visibleResults = tooShort ? [] : results;

  if (!open) {
    return null;
  }

  return (
    <div className="search-modal">
      <button type="button" className="search-modal-backdrop" aria-label="Close search" onClick={handleClose} />
      <div className="search-modal-shell">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="search-modal-panel"
        >
          <h2 id={titleId} className="sr-only">
            Search products
          </h2>
          <form className="search-modal-form" onSubmit={(event) => event.preventDefault()}>
            <IconSearch />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="search-modal-input"
              placeholder="Search coats, shirts, SKU..."
              autoComplete="off"
              spellCheck={false}
            />
            <button type="button" className="search-modal-close" aria-label="Close search" onClick={handleClose}>
              <IconClose />
            </button>
          </form>
          <div className="search-modal-body">
            {tooShort ? <p className="search-modal-hint">Type at least 2 characters to search.</p> : null}
            {!tooShort && loading ? <p className="search-modal-status">Searching...</p> : null}
            {!tooShort && !loading && hasSearched && visibleResults.length === 0 ? (
              <p className="search-modal-status">No products found for “{query.trim()}”.</p>
            ) : null}
            {!tooShort && !loading && visibleResults.length > 0 ? (
              <ul className="search-modal-results">
                {visibleResults.map((product) => (
                  <li key={product.id}>
                    <Link href={`/product/${product.id}`} className="search-modal-result" onClick={handleClose}>
                      <div className="search-modal-result-media">
                        {product.image ? (
                          <Image
                            src={resolvePublicAssetSrc(product.image)}
                            alt=""
                            width={56}
                            height={72}
                            className="search-modal-result-image"
                            unoptimized
                          />
                        ) : (
                          <span className="search-modal-result-fallback" aria-hidden="true" />
                        )}
                      </div>
                      <div className="search-modal-result-copy">
                        <span className="search-modal-result-name">{product.title}</span>
                        {product.sku ? <span className="search-modal-result-meta">{product.sku}</span> : null}
                      </div>
                      <span className="search-modal-result-price">{formatMoney(product.price, product.currency)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
