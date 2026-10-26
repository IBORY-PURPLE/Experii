import { download, header, sticky, tickNav, tickNavLabel } from '@/content/landing';
import { Hero } from '@/components/sections/Hero';
import { BeforeAfter } from '@/components/sections/BeforeAfter';
import { Problem } from '@/components/sections/Problem';
import { Shift } from '@/components/sections/Shift';
import { HowItWorks } from '@/components/sections/HowItWorks';
import { Difference } from '@/components/sections/Difference';
import { EasyStart } from '@/components/sections/EasyStart';
import { SignupSection } from '@/components/sections/SignupSection';
import { Footer } from '@/components/sections/Footer';
import { TickNav } from '@/components/ui/TickNav';
import { StickyCta } from '@/components/ui/StickyCta';
import { CtaTracker } from '@/components/ui/CtaTracker';
import { DownloadButton, DownloadNote } from '@/components/download/Download';
import type { HeroVariant } from '@/lib/signup-schema';

export function Landing({ variant }: { variant: HeroVariant }) {
  return (
    <>
      <header className="nav">
        <div className="wrap nav-in">
          <a className="brand" href="#top">
            {header.brand}
          </a>
          <div className="nav-act">
            <a className="btn btn-soft btn-sm" href="#signup" data-cta="nav">
              {header.cta}
            </a>
            <DownloadButton copy={download} location="nav" small />
          </div>
        </div>
      </header>
      <TickNav items={tickNav} label={tickNavLabel} />
      <main>
        <Hero variant={variant} />
        <BeforeAfter />
        <Problem />
        <Shift />
        <HowItWorks variant={variant} />
        <Difference />
        <EasyStart />
        <SignupSection variant={variant} />
      </main>
      <Footer />
      <StickyCta label={sticky.cta} />
      <DownloadNote copy={download} />
      <CtaTracker variant={variant} />
    </>
  );
}
