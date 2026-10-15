"use client";

import { useState } from "react";

import { DEFAULT_RETURN_POLICY, PRODUCT_SPECIFICATION_FIELDS } from "@/constants/catalog";

type TabsModel = {
  description: { intro: string; detail: string; highlights: string[] };
  specifications: { composition: string; care: string; includes: string };
  returnPolicy: string;
};

const TABS = ["Description", "Specifications", "Return Policy"] as const;

export function ProductTabs({ product }: { product: TabsModel }) {
  const [active, setActive] = useState<(typeof TABS)[number]>("Description");
  const specs = PRODUCT_SPECIFICATION_FIELDS.filter(({ key }) => product.specifications[key]?.trim());
  const policy = (product.returnPolicy || DEFAULT_RETURN_POLICY)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="product-tabs-wrap">
      <div className="product-tabs-nav">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActive(tab)}
            className={`product-tab-btn ${active === tab ? "product-tab-btn-active" : "product-tab-btn-inactive"}`}
          >
            {tab}
            {active === tab ? <span className="product-tab-indicator" /> : null}
          </button>
        ))}
      </div>
      <div className="product-tab-panel">
        <div className="product-tab-content">
          {active === "Description" ? (
            <div className="product-tab-prose">
              <p>
                {product.description.detail && product.description.detail !== product.description.intro
                  ? product.description.detail
                  : product.description.intro}
              </p>
              {product.description.highlights.length > 0 ? (
                <ul className="product-tab-list">
                  {product.description.highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          {active === "Specifications" ? (
            <div className="product-tab-details">
              {specs.length > 0 ? (
                specs.map(({ key, label }) => (
                  <p key={key}>
                    <strong className="text-brand-primary">{label}:</strong> {product.specifications[key]}
                  </p>
                ))
              ) : (
                <p>No specifications listed for this product.</p>
              )}
            </div>
          ) : null}
          {active === "Return Policy" ? (
            <div className="product-tab-details">
              {policy.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
