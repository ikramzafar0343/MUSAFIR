import type { ReactNode } from "react";

export function LegalPage({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  children: ReactNode;
}) {
  return (
    <div className="info-page">
      <div className="mx-auto max-w-[52rem] px-6 md:px-20">
        <header className="section-intro">
          <span className="section-intro-eyebrow">{eyebrow}</span>
          <h1 className="section-intro-title">{title}</h1>
          <p className="section-intro-description">{lead}</p>
        </header>
        <div className="info-page-content legal-copy">{children}</div>
      </div>
    </div>
  );
}
