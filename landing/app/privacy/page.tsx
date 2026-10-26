import type { Metadata } from 'next';
import { privacyPage } from '@/content/landing';
import { CONSENT_VERSION, CONTACT_EMAIL, privacyPolicy } from '@/content/privacy';

export const metadata: Metadata = {
  title: `${privacyPolicy.title} · Experii`,
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <main className="wrap policy">
      <a className="policy-back" href="/">
        {privacyPage.back}
      </a>
      <h1>{privacyPolicy.title}</h1>
      <p className="policy-draft">{privacyPolicy.draftNotice}</p>
      <p className="policy-meta">
        {privacyPolicy.effectiveDate} · {CONSENT_VERSION}
      </p>
      {privacyPolicy.sections.map((s, i) => (
        <section key={s.heading} aria-labelledby={`p-${i + 1}`}>
          <h2 id={`p-${i + 1}`}>{s.heading}</h2>
          <ul>
            {s.body.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ))}
      <p className="policy-meta">
        {CONTACT_EMAIL ? (
          <a href={`mailto:${CONTACT_EMAIL}`}>
            {privacyPolicy.contactLabel} {CONTACT_EMAIL}
          </a>
        ) : (
          privacyPolicy.contactPending
        )}
      </p>
    </main>
  );
}
