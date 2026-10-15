import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { brandDescription, brandName, brandTagline } from "@/constants/brand";
import { INFO_STILLS } from "@/constants/site";
import { getStorefront } from "@/lib/storefront";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Our Story | ${brandName}`,
    description: brandDescription,
  };
}

export default async function AboutPage() {
  const storefront = await getStorefront();
  return (
    <div className="info-page">
      <div className="mx-auto max-w-[1600px] px-6 md:px-20">
        <div className="info-page-shell">
          <figure className="ritual-still ritual-still--mint">
            <span className="ritual-still-arch" aria-hidden="true" />
            <Image
              src={INFO_STILLS.about.src}
              alt={INFO_STILLS.about.alt}
              width={304}
              height={637}
              sizes="12rem"
              className="ritual-still-image"
            />
          </figure>
          <div>
            <header className="section-intro">
              <span className="section-intro-eyebrow">OUR STORY</span>
              <h1 className="section-intro-title">{brandTagline}</h1>
            </header>
            <div className="info-page-content">
              {storefront.content.aboutCopy
                .split(/\n+/)
                .map((paragraph) => paragraph.trim())
                .filter(Boolean)
                .map((paragraph) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}
              <div className="info-page-actions">
                <Link href="/collections/all" className="luxury-button-outline">
                  Shop The Collection
                </Link>
                <Link href="/contact" className="luxury-button-solid">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
