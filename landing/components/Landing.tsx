import { header, sticky, tickNav, tickNavLabel } from '@/content/landing';
import { Hero } from '@/components/sections/Hero';
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
import type { HeroVariant } from '@/lib/signup-schema';

export function Landing({ variant }: { variant: HeroVariant }) {
  return (
    <>
      <header className="nav">
        <div className="wrap nav-in">
          <a className="brand" href="#top">
            {header.brand}
          </a>
          <a className="btn btn-ink btn-sm" href="#signup" data-cta="nav">
            {header.cta}
          </a>
        </div>
      </header>
      <TickNav items={tickNav} label={tickNavLabel} />
      <main>
        <Hero variant={variant} />
        <Problem />
        <Shift />
        <HowItWorks variant={variant} />
        <Difference />
        <EasyStart />
        <SignupSection variant={variant} />
      </main>
      <Footer />
      <StickyCta label={sticky.cta} />
      <CtaTracker variant={variant} />
    </>
  );
}
