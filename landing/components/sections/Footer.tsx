import { footer } from '@/content/landing';
import { CONTACT_EMAIL } from '@/content/privacy';

export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap foot-in">
        <span className="brand">{footer.brand}</span>
        <p>{footer.notice}</p>
        <p className="foot-links">
          <a href="/privacy">{footer.privacy}</a>
          {CONTACT_EMAIL ? (
            <a href={`mailto:${CONTACT_EMAIL}`}>
              {footer.contactLabel} {CONTACT_EMAIL}
            </a>
          ) : (
            <span>{footer.contactPending}</span>
          )}
        </p>
      </div>
    </footer>
  );
}
