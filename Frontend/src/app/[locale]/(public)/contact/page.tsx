import Image from "next/image";
import Link from "next/link";

import { brandName } from "@/constants/brand";
import { INFO_STILLS } from "@/constants/site";
import { ContactDetails } from "@/features/content/contact-details";
import { ContactForm } from "@/features/content/contact-form";
import { getStorefront } from "@/lib/storefront";

export default async function ContactPage() {
  const storefront = await getStorefront();
  return (
    <div className="info-page">
      <div className="mx-auto max-w-[1600px] px-6 md:px-20">
        <div className="info-page-shell">
          <figure className="ritual-still ritual-still--olive ritual-still--jar">
            <span className="ritual-still-arch" aria-hidden="true" />
            <Image
              src={INFO_STILLS.contact.src}
              alt={INFO_STILLS.contact.alt}
              width={800}
              height={800}
              sizes="(max-width: 899px) 14rem, 18rem"
              className="ritual-still-image"
            />
          </figure>
          <div>
            <header className="section-intro">
              <span className="section-intro-eyebrow">Get in Touch</span>
              <h1 className="section-intro-title">Contact Us</h1>
              <p className="section-intro-description">{storefront.content.contactLead}</p>
            </header>
            <div className="info-page-content">
              <ContactDetails />
              <ContactForm />
              <p className="info-page-note">
                Our client care team responds within one business day, Monday through Saturday.
              </p>
              <div className="info-page-actions">
                <Link href="/about-us" className="luxury-button-outline" aria-label={`About ${brandName}`}>
                  About {brandName}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
