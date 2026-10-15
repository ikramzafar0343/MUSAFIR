import type { ReactNode } from "react";

import { type Locale,LOCALES } from "@/constants/site";

export const dynamic = "force-dynamic";

export function generateStaticParams(): Array<{ locale: Locale }> {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  void locale;
  return children;
}
