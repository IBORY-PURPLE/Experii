import { signup } from '@/content/landing';
import { SignupForm } from '@/components/signup/SignupForm';
import type { HeroVariant } from '@/lib/signup-fields';

export function SignupSection({ variant }: { variant: HeroVariant }) {
  return (
    <section id="signup" className="sec signup" aria-labelledby="su-h">
      <div className="wrap">
        <div className="su">
          <div className="su-copy">
            <h2 id="su-h" className="h2">
              {signup.title}
            </h2>
            <p className="su-note">{signup.note}</p>
          </div>
          <div>
            <SignupForm variant={variant} />
          </div>
        </div>
      </div>
    </section>
  );
}
