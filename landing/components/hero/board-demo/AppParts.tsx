import type { CSSProperties, ReactNode } from 'react';

// What the timeline brings in after the start (board-demo-timeline.ts): the same app markup as the film's states, drawn hidden so that the
// start still is exactly the page without JS. The timeline shows them, moves them and takes them away again; nothing here is visible
// on its own. World parts are placed in board coordinates (left, top), the way the app places a note.
const HID = { hidden: true } as const;
const css = (v: Record<string, string | number>) => v as CSSProperties;

function Svg({ size = 16, children }: { size?: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}
const SourceIcon = () => (
  <Svg>
    <path d="M4.5 5.5h15v10h-9l-4.5 3.5v-3.5h-1.5z" />
  </Svg>
);
const PageIcon = () => (
  <Svg>
    <path d="M6.5 3.5h7l4 4v13h-11z" />
    <path d="M13.5 3.5v4h4M9.5 12.5h5M9.5 16h5" />
  </Svg>
);

// One bend with the app's 8px corner: hv starts horizontal, vh starts vertical. Straight if the ends line up (build-states.mjs route).
function route([x1, y1]: [number, number], [x2, y2]: [number, number], order: 'hv' | 'vh') {
  const [left, top] = [Math.min(x1, x2), Math.min(y1, y2)];
  const [w, h] = [Math.max(Math.abs(x2 - x1), 1), Math.max(Math.abs(y2 - y1), 1)];
  const [ax, ay, bx, by] = [x1 - left, y1 - top, x2 - left, y2 - top].map((n) => +n.toFixed(2));
  const [sx, sy, r] = [Math.sign(bx - ax), Math.sign(by - ay), 8];
  let d = `M${ax} ${ay}L${bx} ${by}`;
  if (sx && sy && order === 'hv') d = `M${ax} ${ay}H${bx - sx * r}Q${bx} ${ay} ${bx} ${ay + sy * r}V${by}`;
  if (sx && sy && order === 'vh') d = `M${ax} ${ay}V${by - sy * r}Q${ax} ${by} ${ax + sx * r} ${by}H${bx}`;
  return { left, top, w, h, d, bx, by };
}

// A line the agent offers: dashed until --x-done is 1, drawn in through a mask (.x-link-reveal's dash offset).
function Link({ id, from, to, order = 'hv', thin = false, done = 0 }: { id: string; from: [number, number]; to: [number, number]; order?: 'hv' | 'vh'; thin?: boolean; done?: 0 | 1 }) {
  const { left, top, w, h, d, bx, by } = route(from, to, order);
  return (
    <svg
      id={id}
      className={`x-link is-proposal${thin ? ' is-thin' : ''}`}
      style={css({ left, top, zIndex: 3, '--x-done': done })}
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      {...HID}
    >
      <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x="-8" y="-8" width={w + 16} height={h + 16}>
        <path className="x-link-reveal" pathLength="1" d={d} />
      </mask>
      <g mask={`url(#${id}-mask)`}>
        <path className="x-link-dashed" d={d} />
        <path className="x-link-solid" d={d} />
      </g>
      <circle cx={bx} cy={by} r={thin ? 3 : 4} />
    </svg>
  );
}

function Cursor({ id, who, tag }: { id: string; who: 'me' | 'ai'; tag: string }) {
  return (
    <div id={id} className="x-cursor" data-who={who} data-shape="arrow" data-talk="off" {...HID}>
      <div className="x-cursor-body">
        <svg className="x-cursor-arrow" viewBox="0 0 24 24" strokeWidth="1.5" aria-hidden="true">
          <path d="M6 3.5l12 7.2-5.3 1.4 3.1 5.6-2.5 1.4-3.1-5.6L6 17.6z" />
        </svg>
        <svg className="x-cursor-cross" viewBox="0 0 24 24" aria-hidden="true">
          <path className="x-under" strokeWidth="3.5" d="M12 3v6M12 15v6M3 12h6M15 12h6" />
          <path className="x-over" strokeWidth="1.5" d="M12 3v6M12 15v6M3 12h6M15 12h6" />
        </svg>
        <svg className="x-cursor-grab" viewBox="0 0 24 24" strokeWidth="1.5" aria-hidden="true">
          <path d="M8 12V6.5a1.5 1.5 0 0 1 3 0V11m0-5.5V4.5a1.5 1.5 0 0 1 3 0V11m0-5a1.5 1.5 0 0 1 3 0v6.5a7 7 0 0 1-7 7h-.6a6 6 0 0 1-5-2.7L3.6 13a1.5 1.5 0 0 1 2.5-1.6L8 13.5" />
        </svg>
        <span className="x-cursor-tag">{tag}</span>
        <div className="bubble x-bubble">
          <small>{tag}</small>
          <p />
        </div>
      </div>
    </div>
  );
}

const Place = ({ left, top, z = 2 }: { left: number; top: number; z?: number }) => css({ left, top, zIndex: z });

// Inside .world.
export function WorldParts() {
  return (
    <>
      <div id="bd-section" className="x-section" style={css({ left: 36, top: 152, width: 1152, height: 540, zIndex: 0, '--x-done': 0 })} {...HID}>
        <p id="bd-section-tag" className="droptag x-section-tag" {...HID}>
          <PageIcon />
          <b>JOIN 결과 비교</b>
          <span>필기 4개</span>
        </p>
        <button id="bd-practice" className="btn small x-section-practice" style={{ left: 187.3 }} tabIndex={-1} {...HID}>
          면접 연습
        </button>
      </div>
      <div id="bd-card-1" className="sticky x-card" data-state="reading" style={css({ ...Place({ left: 380, top: 360 }), '--x-open': 0 })} {...HID}>
        <figure id="bd-card-1-fig" className="x-photo-shot">
          <i id="bd-card-1-spot" className="x-photo-spot" />
        </figure>
        <button className="sticky-src" tabIndex={-1}>
          <SourceIcon />
          Q1 · 오후 1:42
        </button>
        <div className="x-card-body">
          <div className="tool-line running x-card-reading">
            <i className="spin" />
            <span>사진 읽는 중…</span>
          </div>
          <b className="x-card-title">LEFT JOIN 결과 (4행)</b>
          <p className="x-card-sum">4행이 나오고, 서준의 order_id만 NULL이에요.</p>
          <button id="bd-ask" className="btn small x-card-ask" tabIndex={-1}>
            모르겠어요
          </button>
        </div>
      </div>
      <div id="bd-note-card" className="sticky x-card is-note" style={Place({ left: 900, top: 540 })} {...HID}>
        <b className="x-card-title">짝이 없는 회원은 NULL</b>
        <p className="x-card-sum">주문이 없는 서준도 남고, order_id 칸만 NULL로 채워져요.</p>
        <button className="sticky-src" tabIndex={-1}>
          <SourceIcon />
          Q1 · 오후 1:42
        </button>
      </div>
      <Link id="bd-l1" from={[732, 360]} to={[732, 297]} order="vh" />
      <Link id="bd-l2" from={[860, 580]} to={[900, 580]} />
      <Link id="bd-l3" from={[324, 372]} to={[380, 372]} />
      <div id="bd-proposal" className="bubble x-proposal-bubble" data-arrow="left" style={Place({ left: 884, top: 300, z: 4 })} {...HID}>
        <small>AI</small>
        <p>서준은 주문이 없어 INNER에선 빠지고 LEFT에선 NULL이에요.</p>
        <div className="x-proposal-actions">
          <button id="bd-accept" className="btn small" tabIndex={-1}>
            수락
          </button>
          <button className="btn small" tabIndex={-1}>
            나중에
          </button>
        </div>
      </div>
      <Link id="bd-s1" from={[328, 283]} to={[384, 283]} done={1} />
      <Link id="bd-s2" from={[516, 467]} to={[516, 499]} done={1} />
      <Link id="bd-s3" from={[328, 420]} to={[384, 420]} done={1} />
      <div id="bd-tool" className="tool-line running x-board-tool" style={Place({ left: 936, top: 200 })} {...HID}>
        <i className="spin" />
        <span>다음 학습 고르는 중…</span>
      </div>
      <div id="bd-recs" className="x-recs is-free" style={Place({ left: 936, top: 200 })}>
        {[
          ['ON과 WHERE 조건 차이', '조건을 WHERE에 두면 서준 행이 사라질 수 있어요.', 0],
          ['중복 키와 행 수 증가', '민지는 주문이 2개라 결과에 2행으로 나왔어요.', 135],
          ['주문 없는 회원만 뽑기', '서준처럼 order_id가 NULL인 행만 고르면 돼요.', 310],
        ].map(([title, why, top], i) => (
          <article key={title} id={`bd-rec-${i + 1}`} className="x-rec is-dashed" style={{ left: 0, top: top as number }} {...HID}>
            <div className="rec">
              <div className="rec-head">
                <b>{title}</b>
                <div className="x-rec-act">
                  <button className="btn small" tabIndex={-1}>
                    이걸로 시작
                  </button>
                  <span className="chip current">진행 중</span>
                </div>
              </div>
              <p className="rec-why">
                <span>근거 · </span>
                {why}
              </p>
              <div className="x-rec-foot">
                <button className="btn small ghost" tabIndex={-1}>
                  지금은 싫어요
                </button>
              </div>
            </div>
          </article>
        ))}
        <div id="bd-rec-ask" className="x-rec-ask" style={{ left: 0, top: 445 }} {...HID}>
          <div className="next-foot">
            <button className="btn small block" tabIndex={-1}>
              <SourceIcon />
              GPT와 상의해서 정하기
            </button>
          </div>
        </div>
      </div>
      <Link id="bd-r1" from={[936, 261]} to={[864, 261]} thin />
      <Link id="bd-r2" from={[936, 396]} to={[864, 396]} thin />
      <Link id="bd-r3" from={[936, 571]} to={[648, 571]} thin />
      <div id="bd-stamp" className="knob x-stamp" style={{ left: 804, top: 156 }} {...HID}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5.5 12.5l4.25 4.25L18.5 8" />
        </svg>
        <span>연습 통과</span>
      </div>
    </>
  );
}

// Last children of .board, in canvas pixels (the screen's, after the camera): what the app shows while words are dragged over it.
export function BoardSlotParts() {
  return (
    <>
      <div id="bd-dropzone" className="dropzone" aria-hidden="true" {...HID} />
      <div id="bd-landing" className="landing" aria-hidden="true" {...HID} />
      <p id="bd-droptag" className="droptag" aria-hidden="true" {...HID}>
        <PageIcon />
        <b>여기에 놓으면 필기가 돼요</b>
        <span>Q1 답에서</span>
      </p>
      <div id="bd-toast" className="toast" role="status" {...HID}>
        <span>Q1 답에서 필기를 남겼어요</span>
      </div>
    </>
  );
}

// Last children of .bd-body: the capture shade and the layer the cursors and the lifted picture travel in.
export function BodyParts() {
  return (
    <>
      <div id="bd-capture" className="x-capture" data-state="grab" aria-hidden="true" {...HID}>
        <div className="x-capture-box">
          <i className="x-capture-edge" />
          <i className="x-capture-flash" />
        </div>
      </div>
      <div className="bd-layer" aria-hidden="true">
        <figure id="bd-float" className="x-photo-shot bd-float" {...HID} />
        <Cursor id="bd-cursor-me" who="me" tag="나" />
        <Cursor id="bd-cursor-ai" who="ai" tag="AI 면접관" />
      </div>
    </>
  );
}

// In .messages: the first conversation (today's question and the answer with the result table) and the second (the suggestion started).
export function ChatParts() {
  return (
    <>
      <div id="bd-q1" className="msg-user" {...HID}>
        LEFT JOIN은 결과가 어떻게 달라?
      </div>
      <div id="bd-a1" className="msg-ai" {...HID}>
        <div className="who">ChatGPT</div>
        <div className="md">
          <p id="bd-a1-text">LEFT JOIN은 왼쪽 테이블(회원)의 행을 모두 남겨요. 그래서 결과가 4행이에요.</p>
          <p id="bd-a1-title">
            <strong>LEFT JOIN 결과 (4행)</strong>
          </p>
          <div id="bd-a1-table" className="md-table">
            <table>
              <thead>
                <tr>
                  <th>member_name</th>
                  <th style={{ textAlign: 'right' }}>order_id</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>민지</td>
                  <td style={{ textAlign: 'right' }}>101</td>
                </tr>
                <tr>
                  <td>민지</td>
                  <td style={{ textAlign: 'right' }}>102</td>
                </tr>
                <tr>
                  <td>서준</td>
                  <td className="null" style={{ textAlign: 'right' }}>
                    NULL
                  </td>
                </tr>
                <tr>
                  <td>하린</td>
                  <td style={{ textAlign: 'right' }}>103</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div id="bd-tonote" className="x-tonote-row">
          <button className="btn small x-tonote" tabIndex={-1}>
            <Svg>
              <path d="M12 5v14M5 12h14" />
            </Svg>
            보드에 필기
          </button>
        </div>
      </div>
      <div id="bd-b-day" className="day" {...HID}>
        새 대화
      </div>
      <div id="bd-b-user" className="msg-user" {...HID}>
        ON과 WHERE 조건 차이
      </div>
      <div id="bd-b-ai" className="msg-ai" {...HID}>
        <div className="who">ChatGPT</div>
        <div className="md">
          <p>ON에 둔 조건은 짝을 찾을 때만 쓰여요. 그래서 LEFT JOIN의 왼쪽 행은 그대로 남아요.</p>
        </div>
      </div>
    </>
  );
}

// In .side-scroll after the empty line: what builds up under the topic once a practice is passed.
export function SideExp() {
  return (
    <div id="bd-exp-row" className="side-list" {...HID}>
      <button className="exp" aria-current="false" tabIndex={-1}>
        <span className="t">JOIN 결과 비교</span>
        <span className="m">오늘 · 연습 통과</span>
      </button>
    </div>
  );
}
