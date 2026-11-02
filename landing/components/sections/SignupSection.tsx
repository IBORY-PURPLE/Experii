import { signup } from '@/content/landing';
import { consent } from '@/content/privacy';
import { SignupForm } from '@/components/signup/SignupForm';
import type { HeroVariant } from '@/lib/signup-fields';

export function SignupSection({ variant }: { variant: HeroVariant }) {
  return (
    <section id="signup" className="sec signup" aria-labelledby="su-h">
      <div className="wrap">
        <div className="su">
          <div className="su-copy" data-reveal="">
            <h2 id="su-h" className="h2">
              {signup.title}
            </h2>
            <p className="su-note">{signup.note}</p>
          </div>
          <div data-reveal="">
            <SignupForm variant={variant} copy={signup} consent={consent} />
          </div>
        </div>
      </div>
    </section>
  );
}
