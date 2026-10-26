'use client';

import { useEffect, useState } from 'react';

const WATCH = { 'hero-cta': 'hero', stage: 'stage', signup: 'signup' } as const;
type Key = (typeof WATCH)[keyof typeof WATCH];

export function StickyCta({ label }: { label: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const visible: Record<Key, boolean> = { hero: true, stage: false, signup: false };
    const mobile = matchMedia('(max-width: 767px)');
    const body = document.body;

    const update = () => {
      const on = mobile.matches && !visible.hero && !visible.stage && !visible.signup;
      setShow(on);
      if (on) body.dataset.sticky = 'on';
      else delete body.dataset.sticky;
      if (visible.signup) body.dataset.signupVisible = '';
      else delete body.dataset.signupVisible;
    };

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) visible[WATCH[e.target.id as keyof typeof WATCH]] = e.isIntersecting;
      update();
    });
    for (const id of Object.keys(WATCH)) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    mobile.addEventListener('change', update);
    return () => {
      io.disconnect();
      mobile.removeEventListener('change', update);
      delete body.dataset.sticky;
      delete body.dataset.signupVisible;
    };
  }, []);

  return (
    <div className="sticky-cta" data-show={show ? '' : undefined} inert={!show}>
      <a className="btn btn-ink" href="#signup" data-cta="sticky">
        {label}
      </a>
    </div>
  );
}
