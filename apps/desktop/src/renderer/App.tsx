import { useCallback, useEffect, useRef, useState } from 'react';
import type { StoredCard } from '../shared/card';
import type {
  AuthStatus,
  ChatEvent,
  ConversationView,
  DoneNode,
  LockedNode,
  Result,
  Roadmap as RoadmapData,
  Subject,
} from '../shared/ipc';
import { CardView } from './CardView';
import { ChatPanel, type Banner } from './ChatPanel';
import { NewSubjectDialog, RegenerateDialog } from './Dialog';
import { Gate } from './Gate';
import { LockedBubble, Roadmap } from './Roadmap';
import { Sidebar } from './Sidebar';

const api = window.experii;

class ApiError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

async function call<T>(p: Promise<Result<T>>): Promise<T> {
  const r = await p;
  if (!r.ok) throw new ApiError(r.code);
  return r.data;
}

type Stream = {
  id: string;
  conversationId: string;
  text: string;
  sent: string;
};

type Making = { conversationId: string; subjectId: string; title: string };

type DialogState =
  | { kind: 'subject' }
  | { kind: 'regenerate'; conversationId: string };

export function App() {
  const [auth, setAuth] = useState<AuthStatus | null>(null);
  const [gate, setGate] = useState({
    waiting: false,
    error: null as string | null,
    planRequired: false,
  });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [conv, setConv] = useState<ConversationView | null>(null);
  const [stream, setStream] = useState<Stream | null>(null);
  const [input, setInput] = useState('');
  const [banner, setBanner] = useState<Banner | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [card, setCard] = useState<StoredCard | null>(null);
  const [openLockedId, setOpenLockedId] = useState<string | null>(null);
  const [making, setMaking] = useState<Making | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const streamRef = useRef<Stream | null>(null);
  streamRef.current = stream;
  // Card generation outlives clicks, so its result checks where the user is now, not where they started.
  const convRef = useRef<ConversationView | null>(null);
  convRef.current = conv;
  const subjectRef = useRef<string | null>(null);
  subjectRef.current = subjectId;

  const loadRoadmap = useCallback(async (id: string) => {
    const [map, list] = await Promise.all([
      call(api.getRoadmap(id)),
      call(api.listSubjects()),
    ]);
    setRoadmap(map);
    setSubjects(list);
    return map;
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) void api.cancel(streamRef.current.id);
  }, []);

  const showConversation = useCallback((view: ConversationView) => {
    setConv(view);
    setBanner(null);
    setInput(view.draft ?? '');
  }, []);

  const openConversation = useCallback(
    async (id: string) => {
      stopStream();
      showConversation(await call(api.getConversation(id)));
    },
    [stopStream, showConversation],
  );

  const newConversation = useCallback(
    async (sid: string, recommendedNodeId?: string) => {
      stopStream();
      showConversation(
        await call(api.openConversation(sid, recommendedNodeId)),
      );
    },
    [stopStream, showConversation],
  );

  const showCard = useCallback(async (cardId: string) => {
    setCard(await call(api.getCard(cardId)));
    setOpenLockedId(null);
  }, []);

  // Past conversations reopen only from the path or a card; entering a subject, at launch too, always starts a new one.
  const selectSubject = useCallback(
    async (id: string) => {
      stopStream();
      setSubjectId(id);
      setCard(null);
      setOpenLockedId(null);
      await loadRoadmap(id);
      await newConversation(id);
    },
    [loadRoadmap, newConversation, stopStream],
  );

  const enterApp = useCallback(async () => {
    const list = await call(api.listSubjects());
    setSubjects(list);
    if (list.length) await selectSubject(list[0].id);
  }, [selectSubject]);

  const signIn = useCallback(
    async (newAccount = false) => {
      setGate((g) => ({ ...g, waiting: true, error: null }));
      const r = await api.signIn(newAccount);
      if (r.ok) {
        setGate({ waiting: false, error: null, planRequired: false });
        setAuth(r.data);
        setBanner(null);
        // Signing in again from the chat banner returns to the open conversation instead of the first subject.
        if (!subjectRef.current) await enterApp();
      } else if (r.code === 'not_eligible_plan') {
        setGate({ waiting: false, error: null, planRequired: true });
      } else {
        setGate((g) => ({
          ...g,
          waiting: false,
          error: r.code === 'cancelled' ? null : r.code,
        }));
      }
    },
    [enterApp],
  );

  const signOut = useCallback(async () => {
    stopStream();
    const r = await api.signOut();
    setGate((g) => ({
      ...g,
      error: r.ok && !r.data.revoked ? 'revoke_unconfirmed' : null,
    }));
    setAuth({ state: 'signed_out' });
    setSubjects([]);
    setSubjectId(null);
    setRoadmap(null);
    setConv(null);
    setCard(null);
    setOpenLockedId(null);
  }, [stopStream]);

  const send = useCallback(
    async (override?: string) => {
      const text = (override ?? input).trim();
      if (!conv || !text || streamRef.current) return;
      const id = crypto.randomUUID();
      setConv({
        ...conv,
        messages: [...conv.messages, { role: 'user', text }],
      });
      const next = { id, conversationId: conv.id, text: '', sent: text };
      streamRef.current = next;
      setStream(next);
      setInput('');
      setBanner(null);
      const r = await api.send(conv.id, id, text);
      if (!r.ok)
        onStreamError(
          {
            streamId: id,
            conversationId: conv.id,
            type: 'error',
            code: r.code,
          },
          text,
        );
    },
    [conv, input],
  );

  const focusInput = () => inputRef.current?.focus();

  // The sign-in screen shows the waiting state and its cancel button; the banner alone could not.
  const relogin = () => {
    setAuth({ state: 'signed_out' });
    void signIn();
  };

  const reloginBanner = (body: string): Banner => ({
    tone: 'err',
    title: '다시 로그인해 주세요',
    body,
    actions: [{ label: '다시 로그인', run: relogin }],
  });

  const usageBanner = (body: string): Banner => ({
    tone: 'err',
    title: '사용량 한도에 걸렸어요',
    body,
    actions: [{ label: 'Manage usage', run: () => void api.openUsage() }],
  });

  const newConversationAction = () => ({
    label: '새 대화',
    run: () => {
      if (subjectRef.current) void newConversation(subjectRef.current);
    },
  });

  const bannerFor = (code: string, sent: string): Banner => {
    const kept = '보낸 메시지는 입력창에 그대로 있어요.';
    const target = convRef.current;
    switch (code) {
      case 'unauthorized':
        return reloginBanner(`로그인이 만료됐어요. ${kept}`);
      case 'context_too_long':
        return {
          tone: 'err',
          title: '대화가 너무 길어요',
          body: 'GPT가 한 번에 읽을 수 있는 길이를 넘었어요. 지금까지를 경험으로 남기거나 새 대화로 이어 가 주세요.',
          actions: [
            ...(target?.saved
              ? [
                  {
                    label: '경험으로 남기기',
                    run: () => void makeCard(target.id),
                  },
                ]
              : []),
            newConversationAction(),
          ],
        };
      case 'rate_limited':
        return usageBanner(`잠시 뒤 다시 보내 주세요. ${kept}`);
      case 'busy':
        return {
          tone: 'info',
          title: '이전 답을 받는 중이에요',
          body: '답이 끝나면 다시 보내 주세요.',
          actions: [],
        };
      default:
        return {
          tone: 'err',
          title: '답을 받지 못했어요',
          body: `네트워크가 끊겼거나 응답이 중간에 멈췄어요. ${kept}`,
          actions: [{ label: '다시 보내기', run: () => void send(sent) }],
        };
    }
  };

  const cardBanner = (code: string, conversationId: string): Banner => {
    const failed = (body: string): Banner => ({
      tone: 'err',
      title: '카드를 만들지 못했어요',
      body,
      actions: [
        {
          label: '다시 만들기',
          run: () => void makeCard(conversationId, true),
        },
      ],
    });
    switch (code) {
      case 'no_learning':
        return {
          tone: 'info',
          title: '카드로 남길 학습 내용이 없어요',
          body: '배우거나 확인한 내용이 대화에 더 쌓이면 다시 눌러 주세요.',
          actions: [
            {
              label: '계속 대화하기',
              run: () => {
                setBanner(null);
                focusInput();
              },
            },
          ],
        };
      case 'too_long':
        return {
          tone: 'err',
          title: '대화가 너무 길어요',
          body: '최근 대화만 남겨도 GPT가 읽을 수 있는 길이를 넘어서 카드를 만들지 못했어요. 새 대화로 이어 가 주세요.',
          actions: [newConversationAction()],
        };
      case 'invalid':
        return failed('GPT 답이 카드 형식에 맞지 않았어요. 다시 눌러 주세요.');
      case 'timeout':
        return failed('2분 안에 답이 오지 않았어요. 다시 눌러 주세요.');
      case 'unauthorized':
        return reloginBanner(
          '로그인이 만료됐어요. 로그인한 뒤 다시 눌러 주세요.',
        );
      case 'rate_limited':
        return usageBanner('잠시 뒤 다시 눌러 주세요.');
      case 'busy':
        return {
          tone: 'info',
          title: '답을 다 받은 뒤 눌러 주세요',
          body: 'GPT가 아직 이 대화에 답하는 중이에요.',
          actions: [],
        };
      default:
        return failed(
          '네트워크가 끊겼거나 응답이 중간에 멈췄어요. 다시 눌러 주세요.',
        );
    }
  };

  const makeCard = async (conversationId: string, confirmed = false) => {
    if (making || !subjectId || !roadmap) return;
    const node = roadmap.nodes.find(
      (n) => n.kind !== 'locked' && n.conversationId === conversationId,
    );
    if (node?.kind === 'done' && !confirmed) {
      setDialog({ kind: 'regenerate', conversationId });
      return;
    }
    setDialog(null);
    setBanner(null);
    const sid = subjectId;
    setMaking({
      conversationId,
      subjectId: sid,
      title:
        node && node.kind !== 'locked'
          ? node.title
          : (convRef.current?.title ?? ''),
    });
    const r = await api.generateCard(conversationId);
    setMaking(null);
    if (subjectRef.current !== sid) return;
    if (r.ok && r.data.kind === 'card') {
      const { cardId } = r.data;
      await loadRoadmap(sid);
      await showCard(cardId);
      setConv((c) => (c && c.id === conversationId ? { ...c, cardId } : c));
      return;
    }
    if (convRef.current?.id !== conversationId) return;
    if (!r.ok && r.code === 'cancelled') return;
    if (!r.ok && r.code === 'not_eligible_plan') {
      setGate({ waiting: false, error: null, planRequired: true });
      return;
    }
    setBanner(cardBanner(r.ok ? r.data.kind : r.code, conversationId));
  };

  const openDone = async (node: DoneNode, toggle: boolean) => {
    if (toggle && card?.id === node.cardId) {
      setCard(null);
      return;
    }
    await showCard(node.cardId);
    if (convRef.current?.id !== node.conversationId)
      await openConversation(node.conversationId);
  };

  const rate = async (useful: boolean) => {
    if (!card || !subjectId) return;
    await call(api.rateCard(card.id, useful));
    setCard(await call(api.getCard(card.id)));
    await loadRoadmap(subjectId);
  };

  const reopen = async (target: StoredCard) => {
    if (convRef.current?.id !== target.conversationId)
      await openConversation(target.conversationId);
    focusInput();
  };

  const regenerate = async (target: StoredCard) => {
    if (convRef.current?.id !== target.conversationId)
      await openConversation(target.conversationId);
    await makeCard(target.conversationId);
  };

  const toggleLocked = (node: LockedNode) => {
    setCard(null);
    setOpenLockedId((id) => (id === node.id ? null : node.id));
  };

  const startRecommended = async (node: LockedNode) => {
    if (!subjectId) return;
    setOpenLockedId(null);
    await newConversation(subjectId, node.id);
    focusInput();
  };

  function onStreamError(ev: ChatEvent, sent: string) {
    streamRef.current = null;
    setStream(null);
    setConv((c) =>
      c && c.id === ev.conversationId
        ? { ...c, messages: c.messages.slice(0, -1) }
        : c,
    );
    setInput((cur) => cur || sent);
    if (ev.code === 'cancelled') return;
    if (ev.code === 'not_eligible_plan') {
      setGate({ waiting: false, error: null, planRequired: true });
      return;
    }
    setBanner(bannerFor(ev.code ?? 'server', sent));
  }

  const handlerRef = useRef<(ev: ChatEvent) => void>(() => {});
  handlerRef.current = (ev: ChatEvent) => {
    const s = streamRef.current;
    if (!s || ev.streamId !== s.id) return;
    if (ev.type === 'delta') {
      // Deltas arrive in bursts between renders, so append to the latest state, not the rendered one.
      setStream((cur) =>
        cur?.id === ev.streamId
          ? { ...cur, text: cur.text + (ev.text ?? '') }
          : cur,
      );
    } else if (ev.type === 'done') {
      streamRef.current = null;
      setStream(null);
      void call(api.getConversation(ev.conversationId)).then((view) =>
        setConv((c) =>
          c && c.id === view.id ? { ...view, draft: undefined } : c,
        ),
      );
      if (subjectId) void loadRoadmap(subjectId);
    } else {
      onStreamError(ev, s.sent);
    }
  };

  useEffect(() => {
    const offChat = api.onChatEvent((ev) => handlerRef.current(ev));
    const offAuth = api.onAuthChanged(() => {
      void call(api.authStatus()).then(setAuth);
    });
    void call(api.authStatus()).then(async (status) => {
      setAuth(status);
      if (status.state === 'signed_in') await enterApp();
    });
    return () => {
      offChat();
      offAuth();
    };
  }, [enterApp]);

  const createSubject = async (title: string) => {
    const r = await api.createSubject(title);
    if (!r.ok)
      return r.code === 'duplicate'
        ? '이미 있는 과목이에요'
        : '과목을 만들지 못했어요';
    setDialog(null);
    await selectSubject(r.data.id);
    return null;
  };

  if (!auth) return null;
  if (auth.state === 'signed_out' || gate.planRequired) {
    return (
      <Gate
        mode={gate.planRequired ? 'plan_required' : 'sign_in'}
        waiting={gate.waiting}
        error={gate.error}
        account={auth.state === 'signed_in' ? auth.email : null}
        onSignIn={() => void signIn(gate.planRequired)}
        onCancel={() =>
          void api
            .signOut()
            .then(() => setGate((g) => ({ ...g, waiting: false })))
        }
      />
    );
  }

  const subject = subjects.find((s) => s.id === subjectId) ?? null;
  const done = (roadmap?.nodes.filter((n) => n.kind === 'done') ??
    []) as DoneNode[];
  const lockedNode = roadmap?.nodes.find(
    (n): n is LockedNode => n.kind === 'locked' && n.id === openLockedId,
  );
  const makingHere = making?.subjectId === subjectId ? making : null;

  const headAction = conv?.saved ? (
    making?.conversationId === conv.id ? (
      <>
        <span className="head-status" role="status">
          <i className="spin" aria-hidden />
          카드 만드는 중…
        </span>
        <button
          className="btn small"
          onClick={() => void api.cancelCard(conv.id)}
        >
          취소
        </button>
      </>
    ) : (
      <button
        className="btn small primary"
        disabled={!!stream || !!making}
        onClick={() => void makeCard(conv.id)}
      >
        경험으로 남기기
      </button>
    )
  ) : null;

  return (
    <div className="app">
      <Sidebar
        subjects={subjects}
        subjectId={subjectId}
        experiences={[...done].reverse()}
        making={makingHere}
        openCardId={card?.id ?? null}
        account="ChatGPT Plus"
        onSelect={(id) => void selectSubject(id)}
        onNewSubject={() => setDialog({ kind: 'subject' })}
        onOpenCard={(n) => void openDone(n, false)}
        onSignOut={() => void signOut()}
      />
      <main className="middle">
        {roadmap && subject ? (
          <Roadmap
            roadmap={roadmap}
            activeConversationId={conv?.id ?? null}
            makingConversationId={makingHere?.conversationId ?? null}
            openCardId={card?.id ?? null}
            openLockedId={lockedNode?.id ?? null}
            cardView={
              card && (
                <CardView
                  card={card}
                  subjectTitle={subject.title}
                  regenerating={making?.conversationId === card.conversationId}
                  onRate={(useful) => void rate(useful)}
                  onReopen={() => void reopen(card)}
                  onRegenerate={() => void regenerate(card)}
                  onClose={() => setCard(null)}
                />
              )
            }
            lockedBubble={
              lockedNode && (
                <LockedBubble
                  node={lockedNode}
                  onStart={() => void startRecommended(lockedNode)}
                />
              )
            }
            onOpenConversation={(id) => void openConversation(id)}
            onOpenCard={(n) => void openDone(n, true)}
            onOpenLocked={toggleLocked}
          />
        ) : (
          <div className="path-empty">
            <div className="ghost-path" aria-hidden>
              <span />
              <span />
              <span />
            </div>
            <div>
              <h2>과목을 만들면 여기에 길이 생겨요</h2>
              <p>공부한 대화가 경험 카드가 되어 이 길에 하나씩 쌓여요.</p>
              <button
                className="btn primary large"
                onClick={() => setDialog({ kind: 'subject' })}
              >
                첫 과목 만들기
              </button>
            </div>
          </div>
        )}
      </main>
      <ChatPanel
        subjectTitle={subject?.title ?? null}
        conversation={conv}
        streamingText={
          stream && stream.conversationId === conv?.id ? stream.text : null
        }
        banner={banner}
        input={input}
        inputRef={inputRef}
        headAction={headAction}
        makingCard={!!conv && making?.conversationId === conv.id}
        onInput={setInput}
        onSend={() => void send()}
        onStop={stopStream}
        onNewConversation={() => subjectId && void newConversation(subjectId)}
        onOpenUsage={() => void api.openUsage()}
      />
      {dialog?.kind === 'subject' && (
        <NewSubjectDialog
          onCreate={createSubject}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === 'regenerate' && (
        <RegenerateDialog
          onConfirm={() => void makeCard(dialog.conversationId, true)}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
