import { IconEnvelope, IconMap, IconPhone } from "@/components/icons/icons";
import { SUPPORT_ADDRESS, SUPPORT_CONTACTS, SUPPORT_EMAIL } from "@/constants/site";

export function ContactDetails() {
  return (
    <ul className="info-page-contact-list">
      <li className="info-page-contact-item">
        <IconMap className="info-page-contact-icon" />
        <div>
          <p className="info-page-contact-label">Visit</p>
          <p className="info-page-contact-value">{SUPPORT_ADDRESS}</p>
        </div>
      </li>
      <li className="info-page-contact-item">
        <IconPhone className="info-page-contact-icon" />
        <div>
          <p className="info-page-contact-label">Call / WhatsApp</p>
          {SUPPORT_CONTACTS.map((item) => (
            <p key={item.id} className="info-page-contact-value">
              <span className="info-page-contact-region">{item.label}</span>
              <a href={`tel:${item.e164}`} className="info-page-link">
                {item.display}
              </a>
              {" · "}
              <a href={`https://wa.me/${item.digits}`} target="_blank" rel="noreferrer" className="info-page-link">
                WhatsApp
              </a>
            </p>
          ))}
        </div>
      </li>
      <li className="info-page-contact-item">
        <IconEnvelope className="info-page-contact-icon" />
        <div>
          <p className="info-page-contact-label">Sales email</p>
          <p className="info-page-contact-value">
            <a href={`mailto:${SUPPORT_EMAIL}`} className="info-page-link">
              {SUPPORT_EMAIL}
            </a>
          </p>
        </div>
      </li>
    </ul>
  );
}
