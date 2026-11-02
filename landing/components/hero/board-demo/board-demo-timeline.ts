import { gsap } from 'gsap';

// The hero window's story, one loop of about 30 seconds, run on the markup AppReplica and AppParts drew. GSAP core only, fetched by
// BoardDemoPlayer with import() once the window is on screen. It moves transforms and opacity; the exceptions are small parts inside the
// window and never the page's layout: the card's open width (--x-open), the frame that grows (clip-path, then left/top/width/height),
// the capture box (--cap-w and --cap-h move its width and height), the experience row that opens (height) and its ring (box-shadow),
// the canvas dots that follow the camera (background-size and -position) and the zoom figure (text, only when it changes).

export interface BoardDemoHooks {
  // The step (0..4) and which of its lines is current; the caption row follows.
  caption: (step: number, line: number) => void;
  // Called when a new loop starts from the still.
  loop: (n: number) => void;
}
export interface BoardDemoControl {
  play: () => void;
  pause: () => void;
  // Stops and puts the window back exactly as the server drew it.
  kill: () => void;
}
export interface BoardDemoTalk {
  interviewer1: string;
  me1: string;
  interviewer2: string;
  me2: string;
  pass: string;
}

type View = { x: number; y: number; z: number };

const CANVAS = { x: 248, y: 64 };
// Still at the start of every loop, so the first frame is the page's own still.
const LEAD = 0.6;
const END = 29.5;
// [seconds, step, line]: the caption row; every line stays at least two seconds.
const CAPTION: [number, number, number][] = [
  [0, 0, 0],
  [2.0, 0, 1],
  [4.2, 1, 0],
  [6.2, 1, 1],
  [8.2, 1, 2],
  [10.2, 2, 0],
  [14.4, 3, 0],
  [16.4, 3, 1],
  [18.4, 4, 0],
  [24.7, 4, 1],
];

// The camera's stops (board view: translate, then scale), found on the 799 x 801 canvas.
const V0: View = { x: 0, y: 10, z: 0.9 };
const V1: View = { x: -440, y: -205, z: 1.3 };
const V2: View = { x: -334, y: -90, z: 0.95 };
const VO: View = { x: 20, y: 139, z: 0.62 };
const V4: View = { x: -725, y: -100, z: 1.25 };
const VP: View = { x: 28, y: 59, z: 0.8 };
const V6: View = { x: -735, y: -45, z: 1 };
const V7: View = { x: 5, y: 38, z: 0.85 };
const V9: View = { x: -10, y: 30, z: 0.85 };

const body = (v: View, wx: number, wy: number): [number, number] => [CANVAS.x + v.x + v.z * wx, CANVAS.y + v.y + v.z * wy];

export function createBoardDemo(win: HTMLElement, hooks: BoardDemoHooks, talk: BoardDemoTalk): BoardDemoControl {
  // The window as the server drew it. Restoring it is a plain innerHTML swap, which a dev server that hot-replaces the window's
  // components in the middle of a story cannot follow; a production page has no such thing.
  const snapshot = win.innerHTML;
  let loops = 0;
  let tl: gsap.core.Timeline;
  let alive = true;
  // Whether the visitor's side wants it to run: a loop boundary must not start a paused story.
  let want = false;

  // The cursors keep a readable size on screen whatever the window's scale: zoom takes a plain number, not a container unit.
  const box = win.parentElement!;
  // Nothing is written until the story starts, so a story that is held at its first frame is still exactly the server's window.
  let started = false;
  const scaleCursors = () => {
    if (!started) return;
    const s = box.clientWidth / 1427;
    win.querySelector<HTMLElement>('.bd-layer')?.style.setProperty('--x-cursor-k', String(Math.min(2.4, Math.max(1.15, 1.15 / s))));
  };
  const ro = new ResizeObserver(scaleCursors);
  ro.observe(box);

  // fadeIn: the loop begins from a cleared window (a restart that is playing); the first run begins from the still as it is.
  const build = (fadeIn: boolean) => {
    const $ = <T extends HTMLElement = HTMLElement>(id: string) => win.querySelector<T>(`#bd-${id}`)!;
    const bodyEl = win.querySelector<HTMLElement>('.bd-body')!;
    const story = gsap.timeline();
    started = false;

    // Where things are, in logical pixels: from the body's corner, or from the world's origin (board coordinates).
    const inBody = (el: HTMLElement): [number, number] => {
      let x = 0;
      let y = 0;
      for (let n: HTMLElement | null = el; n && n !== bodyEl; n = n.offsetParent as HTMLElement | null) {
        x += n.offsetLeft;
        y += n.offsetTop;
      }
      return [x, y];
    };
    const world = $('world');
    const inWorld = (el: HTMLElement): [number, number] => {
      let x = 0;
      let y = 0;
      for (let n: HTMLElement | null = el; n && n !== world; n = n.offsetParent as HTMLElement | null) {
        x += n.offsetLeft;
        y += n.offsetTop;
      }
      return [x, y];
    };
    const centreInBody = (el: HTMLElement, fx = 0.5, fy = 0.5): [number, number] => {
      const [x, y] = inBody(el);
      return [x + el.offsetWidth * fx, y + el.offsetHeight * fy];
    };
    const centreOnBoard = (v: View, el: HTMLElement, fx = 0.5, fy = 0.5): [number, number] => {
      const [x, y] = inWorld(el);
      return body(v, x + el.offsetWidth * fx, y + el.offsetHeight * fy);
    };

    // ---- the camera -------------------------------------------------------------------------------------------------------
    const canvas = $('canvas');
    const zoomPct = $('zoom');
    const cam: View = { ...V0 };
    const draw = () => {
      world.style.transform = `translate(${cam.x}px, ${cam.y}px) scale(${cam.z})`;
      let dot = 24 * cam.z;
      while (dot < 12) dot *= 2;
      canvas.style.setProperty('--dot', `${dot}px`);
      canvas.style.setProperty('--px', `${cam.x}px`);
      canvas.style.setProperty('--py', `${cam.y}px`);
      const pct = `${Math.round(cam.z * 100)}%`;
      if (zoomPct.textContent !== pct) zoomPct.textContent = pct;
    };
    const camTo = (v: View | (() => View), at: number, d = 0.58) => {
      const get = (k: keyof View) => (typeof v === 'function' ? () => v()[k] : v[k]);
      story.to(cam, { x: get('x'), y: get('y'), z: get('z'), duration: d, ease: 'power2.inOut', onUpdate: draw }, at);
    };

    // ---- small moves ------------------------------------------------------------------------------------------------------
    // Brings a hidden part in: it is shown the moment the tween starts. Only the properties `from` names are animated, so an element
    // with a transform of its own (the toast centres itself) keeps it.
    const show = (el: HTMLElement, at: number, d = 0.25, from: gsap.TweenVars = {}) => {
      const to: gsap.TweenVars = { opacity: 1, duration: d, ease: 'power2.out', immediateRender: false };
      for (const k of Object.keys(from)) if (k !== 'transformOrigin') to[k] = k === 'scale' ? 1 : 0;
      story.call(() => { el.hidden = false; }, undefined, at);
      story.fromTo(el, { opacity: 0, ...from }, to, at);
    };
    // A staggered fade over a list that is made when the story starts (the words of a paragraph), so the page stays as drawn until then.
    const reveal = (list: () => HTMLElement[], at: number, total: number) => {
      const p = { n: 0 };
      story.to(p, { n: 1, duration: total, ease: 'none', onUpdate: () => { const els = list(); const k = p.n * els.length; els.forEach((el, i) => { el.style.opacity = String(Math.min(1, Math.max(0, k - i + 0.6))); }); } }, at);
    };
    const hide = (el: HTMLElement, at: number, d = 0.2, to: gsap.TweenVars = {}) => {
      story.to(el, { opacity: 0, duration: d, ease: 'power3.in', ...to }, at);
      story.call(() => { el.hidden = true; }, undefined, at + d);
    };
    const flag = (el: HTMLElement, at: number, fn: (el: HTMLElement) => void) => story.call(() => fn(el), undefined, at);
    const text = (el: HTMLElement, at: number, value: string) => story.call(() => { el.textContent = value; }, undefined, at);
    const words = (el: HTMLElement) => {
      const parts = (el.textContent ?? '').split(' ');
      el.textContent = '';
      return parts.map((w, i) => {
        const span = document.createElement('span');
        span.textContent = w;
        el.append(span, i < parts.length - 1 ? ' ' : '');
        return span;
      });
    };
    const pressBtn = (el: HTMLElement, at: number) => {
      story.to(el, { scale: 0.97, duration: 0.08, ease: 'power2.out' }, at);
      story.to(el, { scale: 1, duration: 0.12, ease: 'power2.out' }, at + 0.08);
    };

    // ---- cursors ----------------------------------------------------------------------------------------------------------
    const me = $('cursor-me');
    const ai = $('cursor-ai');
    const bodyOf = (c: HTMLElement) => c.querySelector<HTMLElement>('.x-cursor-body')!;
    // A curve instead of a straight line: x and y ease a little differently.
    const go = (c: HTMLElement, to: () => [number, number], at: number, d: number, ease = 'power2.inOut') => {
      story.to(c, { x: () => to()[0], duration: d, ease }, at);
      story.to(c, { y: () => to()[1], duration: d, ease: ease === 'none' ? 'none' : 'power3.inOut' }, at);
    };
    const click = (c: HTMLElement, at: number) => {
      story.to(bodyOf(c), { scale: 0.9, duration: 0.08, ease: 'power2.out' }, at);
      story.to(bodyOf(c), { scale: 1, duration: 0.14, ease: 'power2.out' }, at + 0.08);
    };
    const shape = (c: HTMLElement, at: number, s: 'arrow' | 'cross' | 'grab') => flag(c, at, (el) => { el.dataset.shape = s; });
    // A cursor says a line for d seconds. place moves the bubble off the cursor's usual lower right (left and top in the cursor's own units).
    const say = (c: HTMLElement, at: number, line: string, d = 1, place?: { left: string; top: string }) => {
      const p = c.querySelector<HTMLElement>('.x-bubble p')!;
      const b = c.querySelector<HTMLElement>('.x-bubble')!;
      story.call(() => {
        p.textContent = line;
        b.style.left = place?.left ?? '';
        b.style.top = place?.top ?? '';
        c.dataset.talk = 'on';
      }, undefined, at);
      story.fromTo(b, { opacity: 0, scale: 0.92, transformOrigin: '0 0' }, { opacity: 1, scale: 1, duration: 0.16, ease: 'power3.out', immediateRender: false }, at);
      story.to(b, { opacity: 0, duration: 0.12, ease: 'power3.in' }, at + d - 0.12);
      story.call(() => { c.dataset.talk = 'off'; }, undefined, at + d);
    };

    // ---- elements ---------------------------------------------------------------------------------------------------------
    const input = $('input');
    const ta = $<HTMLTextAreaElement>('textarea');
    const send = $<HTMLButtonElement>('send');
    const title = $('chat-title');
    const tabCount = $('tab-count');
    const q1 = $('q1');
    const a1 = $('a1');
    const a1Text = $('a1-text');
    const a1Title = $('a1-title');
    const a1Table = $('a1-table');
    const tonote = $('tonote');
    const card = $('card-1');
    const note = $('note-card');
    const toast = $('toast');
    const account = win.querySelector<HTMLElement>('.account')!;

    // The answer's own pieces start clear: they come in word by word and row by row. All of it is done when the story starts, after the
    // still's lead-in, so until then the window is exactly what the server drew.
    const cardTitle = card.querySelector<HTMLElement>('.x-card-title')!;
    const cardSum = card.querySelector<HTMLElement>('.x-card-sum')!;
    const cardAsk = $('ask');
    const spot = $('card-1-spot');
    const b2 = $('b-ai').querySelector<HTMLElement>('.md p')!;
    const lists: Record<'a1' | 'sum' | 'b2', HTMLElement[]> = { a1: [], sum: [], b2: [] };
    story.call(() => {
      started = true;
      scaleCursors();
      lists.a1 = words(a1Text);
      lists.sum = words(cardSum);
      lists.b2 = words(b2);
      gsap.set([...lists.a1, ...lists.sum, ...lists.b2, a1Title, tonote, cardTitle, cardAsk, spot], { opacity: 0 });
      gsap.set(a1Table, { clipPath: 'inset(0px 0px 100% 0px)' });
      gsap.set(me, { x: 70, y: 920 });
      gsap.set(ai, { x: 1490, y: 330 });
    }, undefined, 0);

    // The answer's table, a row at a time: the lines come with their row (a row's opacity would leave the grid lines behind).
    const tableRows = () => [...a1Table.querySelectorAll<HTMLElement>('thead tr, tbody tr')];
    const rowwise = (at: number, per: number) => {
      const p = { n: 0 };
      const clip = () => {
        const rows = tableRows();
        const k = Math.round(p.n);
        if (k >= rows.length) {
          a1Table.style.clipPath = 'none';
          return;
        }
        const tbl = a1Table.querySelector<HTMLElement>('table')!;
        const bottom = k === 0 ? 0 : tbl.offsetTop + rows[k - 1].offsetTop + rows[k - 1].offsetHeight;
        a1Table.style.clipPath = `inset(0px 0px ${a1Table.offsetHeight - bottom}px 0px)`;
      };
      story.to(p, { n: 5, duration: per * 5, ease: 'steps(5)', onUpdate: clip }, at);
    };

    // The picture the capture takes: the answer's title and table, copied (no raster image), sized like the film's 228 x 199 shot.
    const grab = (() => {
      let r: { x: number; y: number; w: number; h: number } | undefined;
      return () => {
        if (!r) {
          const [tx, ty] = inBody(a1Table);
          const [, sy] = inBody(a1Title);
          const x = tx - 19;
          const y = sy - 6;
          r = { x, y, w: a1Table.offsetWidth + 38, h: ty + a1Table.offsetHeight + 8 - y };
        }
        return r;
      };
    })();
    const shot = () => {
      const g = grab();
      const wrap = document.createElement('div');
      wrap.className = 'md bd-shot';
      wrap.style.cssText = `width:${g.w}px;padding:6px 19px 8px;`;
      const tClone = a1Title.cloneNode(true) as HTMLElement;
      const bClone = a1Table.cloneNode(true) as HTMLElement;
      for (const el of [tClone, bClone]) el.removeAttribute('style');
      wrap.append(tClone, bClone);
      for (const el of [tClone, bClone, ...tClone.querySelectorAll('[id]'), ...bClone.querySelectorAll('[id]')]) el.removeAttribute('id');
      return wrap;
    };

    // ---- 0.0 - 4.2  connected: the account, the question, the answer ----------------------------------------------------------------
    // the cursor goes to the account line first: that is where the connection shows
    const avatar = account.querySelector<HTMLElement>('.avatar')!;
    show(me, 0.1, 0.2);
    go(me, () => centreInBody(account, 0.4, 0.2), 0.1, 0.6);
    story.to(avatar, { opacity: 0.25, duration: 0.18, yoyo: true, repeat: 1, ease: 'power1.inOut' }, 0.7);
    story.fromTo(account, { boxShadow: 'inset 0 0 0 0px rgba(61, 90, 153, 0)' }, { boxShadow: 'inset 0 0 0 3px rgba(61, 90, 153, 0.6)', duration: 0.35, yoyo: true, repeat: 1, ease: 'power1.inOut', immediateRender: false }, 0.7);
    go(me, () => { const [x, y] = centreInBody(input, 0.7, 0.4); return [x, y]; }, 1.1, 0.6);
    flag(input, 1.75, (el) => el.classList.add('is-focused'));
    click(me, 1.75);
    const question = q1.textContent ?? '';
    const typed = { n: 0 };
    story.call(() => { send.disabled = false; }, undefined, 1.9);
    story.to(typed, { n: question.length, duration: 1.0, ease: 'none', onUpdate: () => { ta.value = question.slice(0, Math.round(typed.n)); } }, 1.85);
    story.call(() => { ta.value = ''; send.disabled = true; }, undefined, 2.9);
    pressBtn(send, 2.85);
    show(q1, 2.9, 0.22, { y: 8 });
    story.to(title, { opacity: 0, duration: 0.1 }, 2.9);
    text(title, 3.0, question);
    story.to(title, { opacity: 1, duration: 0.2 }, 3.0);
    story.call(() => { a1.hidden = false; }, undefined, 3.1);
    reveal(() => lists.a1, 3.1, 0.45);
    story.to(a1Title, { opacity: 1, duration: 0.15 }, 3.5);
    rowwise(3.6, 0.1);
    story.to(tonote, { opacity: 1, duration: 0.2 }, 4.1);

    // ---- 4.2 - 6.2  capture ---------------------------------------------------------------------------------------------------
    const cap = $('capture');
    const capBox = cap.querySelector<HTMLElement>('.x-capture-box')!;
    const flash = cap.querySelector<HTMLElement>('.x-capture-flash')!;
    const float = $('float');
    story.call(() => {
      const g = grab();
      cap.hidden = false;
      cap.dataset.state = 'grab';
      cap.style.setProperty('--cap-x', `${g.x}px`);
      cap.style.setProperty('--cap-y', `${g.y}px`);
      cap.style.setProperty('--cap-w', '0px');
      cap.style.setProperty('--cap-h', '0px');
      me.dataset.notag = '';
    }, undefined, 4.2);
    story.fromTo(cap, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: 'power2.out', immediateRender: false }, 4.2);
    shape(me, 4.25, 'cross');
    go(me, () => [grab().x, grab().y], 4.2, 0.45);
    go(me, () => [grab().x + grab().w, grab().y + grab().h], 4.65, 0.9, 'power1.inOut');
    story.to(cap, { '--cap-w': () => `${grab().w}px`, '--cap-h': () => `${grab().h}px`, duration: 0.9, ease: 'power1.inOut' }, 4.65);
    // let go: solid edge, white flash, the shutter's small bounce
    flag(cap, 5.55, (el) => { el.dataset.state = 'shot'; });
    story.fromTo(flash, { opacity: 0 }, { opacity: 1, duration: 0.07, ease: 'power2.out', immediateRender: false }, 5.55);
    story.to(flash, { opacity: 0, duration: 0.08, ease: 'power2.in' }, 5.62);
    story.to(capBox, { scale: 1.02, duration: 0.08, ease: 'power2.out' }, 5.55);
    story.to(capBox, { scale: 1, duration: 0.12, ease: 'power2.in' }, 5.63);
    // the shot comes up off the chat
    story.call(() => {
      const g = grab();
      float.append(shot());
      float.style.width = `${g.w + 2}px`;
      float.style.height = `${g.h + 2}px`;
      float.hidden = false;
      float.classList.add('lifted');
      gsap.set(float, { x: g.x - 1, y: g.y - 1, scale: 1, rotation: 0, opacity: 1, transformOrigin: '0 0' });
    }, undefined, 5.58);
    story.to(float, { scale: 1.02, rotation: -2, duration: 0.3, ease: 'power4.out' }, 5.62);
    hide(cap, 5.7, 0.2);
    flag(me, 5.9, (el) => { delete el.dataset.notag; });
    shape(me, 5.9, 'grab');

    // ---- 6.2 - 8.2  paste: across to the board, lands, is read --------------------------------------------------------------
    const dropzone = $('dropzone');
    const landing = $('landing');
    const droptag = $('droptag');
    const CARD = { x: 380, y: 360, w: 480, h: 243 };
    story.call(() => {
      const [lx, ly] = [V0.x + V0.z * CARD.x, V0.y + V0.z * CARD.y];
      landing.style.cssText = `left:${lx}px;top:${ly}px;width:${V0.z * CARD.w}px;height:${V0.z * CARD.h}px`;
      droptag.style.cssText = `left:${lx}px;top:${ly - 40}px`;
    }, undefined, 5.8);
    for (const el of [dropzone, landing, droptag]) show(el, 5.9, 0.2);
    const flightScale = () => (V0.z * 230) / (grab().w + 2);
    const landing0 = (): [number, number] => body(V0, CARD.x + 17, CARD.y + 13);
    story.to(float, { x: () => landing0()[0], y: () => landing0()[1], scale: flightScale, rotation: 0, duration: 0.7, ease: 'power2.inOut' }, 5.95);
    go(me, () => { const [x, y] = landing0(); return [x + (grab().w + 2) * flightScale(), y + (grab().h + 2) * flightScale()]; }, 5.95, 0.7);
    // let go over the board: the card (picture only) takes the picture's place in the same frame
    const fig = $('card-1-fig');
    story.call(() => {
      const g = grab();
      const s0 = 228 / g.w;
      const inner = shot();
      inner.style.cssText += `position:absolute;left:0;top:0;transform-origin:0 0;transform:scale(${s0});`;
      fig.style.height = `${g.h * s0 + 2}px`;
      fig.append(inner);
      const rowEl = a1Table.querySelectorAll('tbody tr')[2] as HTMLElement;
      const [rx, ry] = inBody(rowEl);
      spot.style.setProperty('--spot-x', `${(rx - g.x) * s0}px`);
      spot.style.setProperty('--spot-y', `${(ry - g.y) * s0}px`);
      spot.style.setProperty('--spot-w', `${a1Table.offsetWidth * s0}px`);
      spot.style.setProperty('--spot-h', `${rowEl.offsetHeight * s0}px`);
      float.hidden = true;
      card.hidden = false;
      card.dataset.state = 'reading';
      for (const el of [dropzone, landing, droptag]) el.hidden = true;
    }, undefined, 6.65);
    story.fromTo(card, { scale: 1.06, opacity: 1, transformOrigin: '0 0' }, { scale: 1, duration: 0.4, ease: 'back.out(0.66)', immediateRender: false }, 6.65);
    shape(me, 6.7, 'arrow');
    go(me, () => [1130, 560], 6.7, 0.5);
    show(toast, 6.68, 0.2);
    hide(toast, 8.9, 0.25);
    text(tabCount, 6.68, '필기 4개');
    story.fromTo(tabCount, { scale: 1.12, transformOrigin: '0 50%' }, { scale: 1, duration: 0.4, ease: 'back.out(1.4)', immediateRender: false }, 6.68);
    story.to(card, { '--x-open': 1, duration: 0.5, ease: 'expo.out' }, 6.95);
    camTo(V1, 6.95, 0.6);
    flag(card, 7.9, (el) => { el.dataset.state = 'read'; });
    story.to(cardTitle, { opacity: 1, duration: 0.18 }, 7.9);
    reveal(() => lists.sum, 8.0, 0.45);
    story.to(spot, { opacity: 1, duration: 0.25 }, 8.45);
    story.to(cardAsk, { opacity: 1, duration: 0.2 }, 8.6);
    story.to(spot, { opacity: 0, duration: 0.3 }, 9.4);

    // ---- 8.2 - 10.2  a second note from the answer ----------------------------------------------------------------------------
    go(me, () => centreInBody(tonote.querySelector<HTMLElement>('.btn')!), 8.45, 0.6);
    click(me, 9.05);
    pressBtn(tonote.querySelector<HTMLElement>('.btn')!, 9.05);
    camTo(V2, 9.1, 0.55);
    go(me, () => [560, 560], 9.7, 0.8);
    show(note, 9.25, 0.3, { scale: 0.96, transformOrigin: '0 0' });
    show(toast, 9.25, 0.2);
    hide(toast, 11.0, 0.25);
    text(tabCount, 9.25, '필기 5개');
    story.fromTo(tabCount, { scale: 1.12, transformOrigin: '0 50%' }, { scale: 1, duration: 0.4, ease: 'back.out(1.4)', immediateRender: false }, 9.25);

    // ---- 10.2 - 14.4  organize: the offer, the accept, the notes gather ----------------------------------------------------------
    const section = $('section');
    const tag = $('section-tag');
    const proposal = $('proposal');
    const accept = $('accept');
    // The frame is shown whole (z .62) only while it grows; the reason is read close up
    camTo(VO, 10.3, 0.5);
    const draw3 = (el: HTMLElement, at: number, d = 0.28) => {
      const reveal3 = el.querySelector<SVGPathElement>('.x-link-reveal')!;
      const dot = el.querySelector<SVGCircleElement>('circle')!;
      story.call(() => { el.hidden = false; }, undefined, at);
      story.fromTo(reveal3, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: d, ease: 'expo.out', immediateRender: false }, at);
      story.fromTo(dot, { opacity: 0 }, { opacity: 1, duration: 0.08, immediateRender: false }, at + d - 0.08);
    };
    draw3($('l3'), 10.5);
    draw3($('l1'), 10.6);
    draw3($('l2'), 10.7);
    story.call(() => { section.hidden = false; }, undefined, 10.6);
    story.fromTo(section, { clipPath: 'inset(0% 100% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5, ease: 'power2.inOut', immediateRender: false }, 10.6);
    story.set(section, { clipPath: 'none' }, 11.12);
    show(tag, 11.05, 0.2);
    show(proposal, 10.95, 0.3, { scale: 0.97, transformOrigin: '0 0' });
    camTo(V4, 11.05, 0.55);
    // to [수락] from below, so that it never crosses [나중에] (on its right) and stays off the words above the buttons
    go(me, () => { const [x, y] = centreOnBoard(V4, accept); return [x - 12, y + 72]; }, 11.2, 0.75);
    go(me, () => centreOnBoard(V4, accept), 12.55, 0.55);
    click(me, 13.3);
    pressBtn(accept, 13.3);
    hide(proposal, 13.3, 0.22, { scale: 0.97 });
    for (const id of ['l1', 'l2', 'l3']) hide($(id), 13.3, 0.1);
    camTo(VP, 13.35, 0.7);
    const move = (id: string, from: [number, number], to: [number, number], at: number) => {
      const el = $(id);
      story.call(() => el.classList.add('moving'), undefined, at);
      story.to(el, { x: to[0] - from[0], y: to[1] - from[1], duration: 0.5, ease: 'power4.out' }, at);
      story.call(() => el.classList.remove('moving'), undefined, at + 0.5);
    };
    move('old-1', [600, 176], [64, 224], 13.4);
    move('old-2', [60, 250], [64, 374], 13.42);
    move('card-1', [380, 360], [384, 224], 13.46);
    move('note-card', [900, 540], [384, 499], 13.5);
    story.to(section, { left: 40, top: 200, width: 848, height: 453, duration: 0.55, ease: 'power4.out' }, 13.42);
    story.to(section, { '--x-done': 1, duration: 0.2 }, 13.8);
    show($('practice'), 14.05, 0.2);
    draw3($('s1'), 14.0, 0.25);
    draw3($('s3'), 14.05, 0.25);
    draw3($('s2'), 14.1, 0.25);

    // ---- 14.4 - 18.4  recommend: a read, three suggestions, one is started ------------------------------------------------------
    const tool = $('tool');
    show(tool, 14.4, 0.15);
    camTo(V6, 14.5, 0.6);
    hide(tool, 15.0, 0.1);
    const recs = [$('rec-1'), $('rec-2'), $('rec-3')];
    recs.forEach((r, i) => show(r, 15.0 + i * 0.1, 0.35, { x: -16 }));
    draw3($('r1'), 15.15, 0.3);
    draw3($('r2'), 15.2, 0.3);
    draw3($('r3'), 15.25, 0.3);
    show($('rec-ask'), 15.45, 0.25);
    const start1 = recs[0].querySelector<HTMLElement>('.x-rec-act .btn')!;
    go(me, () => centreOnBoard(V6, start1), 15.6, 0.85);
    click(me, 17.1);
    pressBtn(start1, 17.1);
    // the press shows for a moment before the blue chip takes the button's place
    flag(recs[0], 17.22, (el) => el.classList.add('is-started'));
    story.to(recs[0], { '--x-done': 1, duration: 0.25 }, 17.22);
    story.to($('r1'), { '--x-done': 1, duration: 0.25 }, 17.22);
    // a new conversation: the head, and the thread's first answer
    story.to(title, { opacity: 0, duration: 0.1 }, 17.25);
    text(title, 17.35, 'ON과 WHERE 조건 차이');
    story.to(title, { opacity: 1, duration: 0.2 }, 17.35);
    const groupA = [win.querySelector<HTMLElement>('#bd-messages > .day')!, q1, a1];
    story.call(() => { for (const el of groupA) el.hidden = true; $('b-day').hidden = false; $('b-user').hidden = false; $('b-ai').hidden = false; }, undefined, 17.35);
    story.fromTo($('b-user'), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.22, immediateRender: false }, 17.35);
    reveal(() => lists.b2, 17.7, 0.7);

    // ---- 18.4 - 29.2  interview: the interviewer asks on the board; the stamp ------------------------------------------------------
    const practice = $('practice');
    camTo(V7, 18.4, 0.6);
    go(me, () => centreOnBoard(V7, practice), 18.4, 0.85);
    click(me, 19.3);
    pressBtn(practice, 19.3);
    show(ai, 19.3, 0.15);
    go(ai, () => body(V7, 356, 283), 19.3, 0.55, 'expo.out');
    say(ai, 19.85, talk.interviewer1, 0.95);
    go(me, () => [640, 700], 19.95, 0.7);
    say(me, 20.9, talk.me1, 0.8);
    // the follow-up points at the Seojun row of the picture (the picture is 18 and 14 in on the card, which sits at 384, 224)
    const rowBox = () => {
      const n = (k: string) => parseFloat(spot.style.getPropertyValue(k));
      return { x: 384 + 18 + n('--spot-x'), y: 224 + 14 + n('--spot-y'), w: n('--spot-w'), h: n('--spot-h') };
    };
    // the camera centres on the row; the pointer's tip rests inside the row near its right end, and the bubble goes to the right of the
    // table, where the card has room, so that it does not hide the row
    const V8 = (): View => { const r = rowBox(); return { x: 399.5 - 1.6 * (r.x + r.w / 2), y: 400.5 - 1.6 * (r.y + r.h / 2), z: 1.6 }; };
    const seojunTip = (): [number, number] => { const r = rowBox(); return body(V8(), r.x + r.w - 26, r.y + r.h / 2); };
    camTo(V8, 21.7, 0.6);
    go(ai, seojunTip, 21.7, 0.6);
    story.to(spot, { opacity: 1, duration: 0.2 }, 22.0);
    say(ai, 21.85, talk.interviewer2, 0.95, { left: '36px', top: '-6px' });
    say(me, 22.95, talk.me2, 0.8);
    say(ai, 23.9, talk.pass, 0.7);
    camTo(V9, 23.9, 0.7);
    hide(me, 23.8, 0.2);
    go(ai, () => body(V9, 848, 200), 24.05, 0.55);
    click(ai, 24.65);
    // the stamp lands like a stamp: no fade
    const stamp = $('stamp');
    story.call(() => { stamp.hidden = false; }, undefined, 24.75);
    story.fromTo(stamp, { scale: 2.16, transformOrigin: '50% 50%' }, { scale: 1.35, duration: 0.35, ease: 'back.out(0.66)', immediateRender: false }, 24.75);
    text($('count'), 24.85, '1');
    story.call(() => { $('exp').hidden = true; $('exp-row').hidden = false; }, undefined, 24.85);
    story.fromTo($('exp-row'), { height: 0, opacity: 0, overflow: 'hidden' }, { height: 'auto', opacity: 1, overflow: 'visible', duration: 0.6, ease: 'power4.out', immediateRender: false }, 24.85);
    // a soft blue ring on the new row, once
    const expRow = $('exp-row').querySelector<HTMLElement>('.exp')!;
    story.fromTo(expRow, { boxShadow: '0 0 0 0px rgba(61, 90, 153, 0)' }, { boxShadow: '0 0 0 3px rgba(61, 90, 153, 0.6)', duration: 0.5, yoyo: true, repeat: 1, ease: 'power1.inOut', immediateRender: false }, 25.2);
    hide(ai, 25.0, 0.25, { x: '+=60' });
    story.to(spot, { opacity: 0, duration: 0.3 }, 24.9);
    // hold the last scene, then the inside of the window clears and comes back as the still
    story.to(bodyEl, { opacity: 0, duration: 0.3, ease: 'power1.in' }, END - 0.3);

    const main = gsap.timeline({ paused: true });
    if (fadeIn) {
      gsap.set(bodyEl, { opacity: 0 });
      main.to(bodyEl, { opacity: 1, duration: 0.3, ease: 'power1.out', clearProps: 'opacity' }, 0);
    }
    main.add(story, LEAD);
    let last = '';
    main.eventCallback('onUpdate', () => {
      const t = main.time() - LEAD;
      let i = 0;
      while (i + 1 < CAPTION.length && CAPTION[i + 1][0] <= t) i += 1;
      const key = `${CAPTION[i][1]}.${CAPTION[i][2]}`;
      if (key !== last) {
        last = key;
        hooks.caption(CAPTION[i][1], CAPTION[i][2]);
      }
    });
    main.eventCallback('onComplete', () => {
      gsap.delayedCall(0, () => {
        if (!alive) return;
        main.kill();
        win.innerHTML = snapshot;
        loops += 1;
        hooks.loop(loops);
        hooks.caption(0, 0);
        // a pause that came at the boundary holds the next loop at its first frame, which is the still itself (no fade-in to wait for)
        tl = build(want);
        if (want) tl.play(0);
      });
    });
    return main;
  };

  tl = build(false);

  return {
    play: () => { want = true; tl.play(); },
    pause: () => { want = false; tl.pause(); },
    kill: () => {
      alive = false;
      ro.disconnect();
      tl.kill();
      gsap.killTweensOf(win.querySelectorAll('*'));
      win.innerHTML = snapshot;
    },
  };
}
