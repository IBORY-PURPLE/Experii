import { download, sticky, tickNav, tickNavLabel } from '@/content/landing';
import { SiteHeader } from '@/components/SiteHeader';
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
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { DownloadNote } from '@/components/download/DownloadNote';
import type { HeroVariant } from '@/lib/signup-fields';

export function Landing({ variant }: { variant: HeroVariant }) {
  return (
    <>
      <SiteHeader />
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
      <ScrollReveal />
    </>
  );
}
