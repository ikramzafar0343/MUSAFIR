import Link from "next/link";

import { brandName } from "@/constants/brand";

export default function NotFound() {
  return (
    <section className="flex h-screen items-center justify-center bg-brand-bg">
      <div className="px-6 text-center">
        <p className="text-brand-secondary mb-6 text-7xl tracking-[0.2em] opacity-50">404</p>
        <h1 className="mb-10 text-2xl tracking-[0.16em] uppercase md:text-3xl">Page Not Found</h1>
        <Link href="/" className="luxury-button-solid">
          Return to {brandName}
        </Link>
      </div>
    </section>
  );
}
