import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type DragEvent,
} from 'react';
import type { StoredCard } from '../shared/card';
import type {
  AuthStatus,
  CardField,
  ChatEvent,
  ConversationView,
  CurrentNode,
  DoneNode,
  LockedNode,
  ModelList,
  Note,
  Result,
  Roadmap as RoadmapData,
  Subject,
} from '../shared/ipc';
import type { Point } from './canvas';
import { CardView } from './CardView';
import { ChatPanel, type Banner } from './ChatPanel';
import {
  REFUSALS,
  carriesNote,
  draggedPick,
  readDrop,
  type Pick,
} from './collect';
import { NewSubjectDialog, RegenerateDialog } from './Dialog';
import { dayLabel } from './format';
import { Gate } from './Gate';
import { Page } from './icons';
import { ModelSelect } from './ModelSelect';
import { NotePage, consultDraft, type PageInfo } from './NotePage';
import {
  DEFAULT_VIEW,
  activePlace,
  canBack,
  canForward,
  closeTab,
  keepOnly,
  loadSaved,
  samePlace,
  startPages,
  step,
  storeSaved,
  visit,
  type Pages,
  type Saved,
  type View,
} from './pages';
import { Pane, useLayout } from './Panes';
import { LockedBubble, Roadmap } from './Roadmap';
import { Sidebar } from './Sidebar';
import { TabBar, type TabInfo } from './Tabs';
import { withToolEvent, type LiveToolLine } from './ToolLines';

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
  tools: LiveToolLine[];
};

type Making = {
  conversationId: string;
  subjectId: string;
  title: string;
  fields: Partial<Record<CardField, string>>;
};

type DialogState =
  | { kind: 'subject' }
  | { kind: 'regenerate'; conversationId: string };

type Toast = {
  key: number;
  text: string;
  action?: { label: string; run(): void };
};

type PathNode = DoneNode | CurrentNode;

const NOTE_ERRORS: Record<string, string> = {
  not_saved: '첫 답을 받은 뒤 필기할 수 있어요',
  invalid_source: '저장된 GPT 답에서만 필기할 수 있어요',
};

const ROADMAP = { kind: 'roadmap' } as const;

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
  const [models, setModels] = useState<ModelList | null>(null);
  const [pages, setPagesState] = useState<Pages>(() => startPages());
  const [saved, setSaved] = useState<Saved>(loadSaved);
  const [notes, setNotes] = useState<Record<string, Note[]>>({});
  const [pendingPick, setPendingPick] = useState<
    (Pick & { key: number }) | null
  >(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [freshPin, setFreshPin] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [reveal, setReveal] = useState<{ id: string; key: number } | null>(
    null,
  );
  const [roadDrop, setRoadDrop] = useState<Point | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const streamRef = useRef<Stream | null>(null);
  streamRef.current = stream;
  // Card generation outlives clicks, so its result checks where the user is now, not where they started.
  const convRef = useRef<ConversationView | null>(null);
  convRef.current = conv;
  const subjectRef = useRef<string | null>(null);
  subjectRef.current = subjectId;
  const cardRef = useRef<StoredCard | null>(null);
  cardRef.current = card;
  const pagesRef = useRef(pages);
  const savedRef = useRef(saved);
  savedRef.current = saved;
  const notesRef = useRef(notes);
  notesRef.current = notes;
  const pickSeq = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const roadEl = useRef<HTMLDivElement>(null);
  const roadScroll = useRef(0);
  const { layout, setOpen } = useLayout(
    auth?.state === 'signed_in' && !gate.planRequired,
  );

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

  const setPages = useCallback((next: Pages) => {
    pagesRef.current = next;
    setPagesState(next);
  }, []);

  const showToast = useCallback((text: string, action?: Toast['action']) => {
    clearTimeout(toastTimer.current);
    setToast({ key: Date.now(), text, action });
    toastTimer.current = setTimeout(() => setToast(null), action ? 8000 : 3200);
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

  // The chat always shows the page in the middle, so a new conversation sends the middle back to the roadmap.
  const newConversation = useCallback(
    async (sid: string, recommendedNodeId?: string) => {
      stopStream();
      if (activePlace(pagesRef.current).kind === 'page')
        setPages(visit(pagesRef.current, ROADMAP));
      showConversation(
        await call(api.openConversation(sid, recommendedNodeId)),
      );
    },
    [stopStream, showConversation, setPages],
  );

  const showCard = useCallback(async (cardId: string) => {
    setCard(await call(api.getCard(cardId)));
    setOpenLockedId(null);
  }, []);

  const loadNotes = useCallback(async (id: string) => {
    const r = await api.listNotes(id);
    if (r.ok) setNotes((m) => ({ ...m, [id]: r.data }));
  }, []);

  // Moving between places keeps the chat on the page in front; the roadmap leaves the chat as it is.
  const go = useCallback(
    (next: Pages) => {
      const place = activePlace(next);
      const before = activePlace(pagesRef.current);
      setPages(next);
      if (!samePlace(place, before)) {
        setCard(null);
        setOpenLockedId(null);
        setReveal(null);
      }
      if (place.kind !== 'page') return;
      if (convRef.current?.id !== place.id) void openConversation(place.id);
      if (!notesRef.current[place.id]) void loadNotes(place.id);
    },
    [setPages, openConversation, loadNotes],
  );

  const openPage = useCallback(
    (id: string) => go(visit(pagesRef.current, { kind: 'page', id })),
    [go],
  );

  // Past conversations reopen only from the path or a card; entering a subject, at launch too, always starts a new one.
  const selectSubject = useCallback(
    async (id: string) => {
      stopStream();
      setSubjectId(id);
      setPages(startPages(savedRef.current.tabs[id]));
      setPendingPick(null);
      setCard(null);
      setOpenLockedId(null);
      await loadRoadmap(id);
      await newConversation(id);
    },
    [loadRoadmap, newConversation, stopStream, setPages],
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
    setPages(startPages());
    setPendingPick(null);
  }, [stopStream, setPages]);

  const send = useCallback(
    async (override?: string) => {
      const text = (override ?? input).trim();
      if (!conv || !text || streamRef.current) return;
      const id = crypto.randomUUID();
      // A banner's resend runs a send from before the failed question was taken back, so append to the latest state.
      setConv((c) =>
        c && c.id === conv.id
          ? { ...c, messages: [...c.messages, { role: 'user', text }] }
          : c,
      );
      const next = {
        id,
        conversationId: conv.id,
        text: '',
        sent: text,
        tools: [],
      };
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

  const pickModel = async (model: string) => {
    const target = convRef.current;
    if (!target || streamRef.current || target.model === model) return;
    const set = (value: string | null) =>
      setConv((c) => (c && c.id === target.id ? { ...c, model: value } : c));
    set(model);
    const r = await api.setConversationModel(target.id, model);
    if (!r.ok) set(target.model);
    else setModels((l) => l && { ...l, current: model });
  };

  const focusInput = () => {
    setOpen('chat', true);
    inputRef.current?.focus();
  };

  // The sign-in screen shows the waiting state and its cancel button; the banner alone could not.
  const relogin = () => {
    setAuth({ state: 'signed_out' });
    void signIn();
  };

  const reloginBanner = (body: string): Banner => ({
    tone: 'err',
    title: '다시 로그인해 주세요',
    body,
    actions: [{ label: '다시 로그인', primary: true, run: relogin }],
  });

  const usageBanner = (body: string): Banner => ({
    tone: 'err',
    title: '사용량 한도에 걸렸어요',
    body,
    actions: [
      { label: 'Manage usage', primary: true, run: () => void api.openUsage() },
    ],
  });

  const newConversationAction = (primary: boolean) => ({
    label: '새 대화',
    primary,
    run: () => {
      if (subjectRef.current) void newConversation(subjectRef.current);
    },
  });

  const bannerFor = (code: string, sent: string): Banner => {
    const kept = '보낸 메시지는 입력창에 그대로 있어요.';
    const target = convRef.current;
    const resend = {
      label: '다시 보내기',
      primary: true,
      run: () => void send(sent),
    };
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
                    primary: true,
                    run: () => void makeCard(target.id),
                  },
                ]
              : []),
            newConversationAction(!target?.saved),
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
      case 'unsupported':
        return {
          tone: 'err',
          title: '이 계정이 받지 않는 기능이 있었어요',
          body: `로그인한 ChatGPT 계정이 이번 요청에 쓴 기능 하나를 받지 않았어요. ${kept}`,
          actions: [resend],
        };
      case 'tool_limit':
        return {
          tone: 'err',
          title: '도구를 너무 여러 번 불렀어요',
          body: `GPT가 답을 쓰면서 도구를 계속 불러서 중간에 멈췄어요. ${kept}`,
          actions: [resend],
        };
      default:
        return {
          tone: 'err',
          title: '답을 받지 못했어요',
          body: `네트워크가 끊겼거나 응답이 중간에 멈췄어요. ${kept}`,
          actions: [resend],
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
          primary: true,
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
              primary: true,
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
          actions: [newConversationAction(true)],
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
      fields: {},
    });
    const r = await api.generateCard(conversationId);
    const cardId = r.ok && r.data.kind === 'card' ? r.data.cardId : null;
    // The tile keeps the fields it streamed until the reloaded path has the card, so it never flashes back.
    if (cardId && subjectRef.current === sid)
      await loadRoadmap(sid).catch(() => null);
    setMaking(null);
    if (subjectRef.current !== sid) return;
    if (cardId) {
      // A card that lands while an answer streams waits on the path, so the reader keeps their place.
      // Otherwise its page comes to the front with the summary and the rating in view.
      if (!streamRef.current) {
        openPage(conversationId);
        setFreshPin(conversationId);
        setTimeout(
          () => setFreshPin((f) => (f === conversationId ? null : f)),
          2000,
        );
      }
      if (cardRef.current?.conversationId === conversationId)
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

  // The rating is the same from the pinned summary and from the whole card.
  const rate = async (cardId: string, useful: boolean) => {
    if (!subjectId) return;
    await call(api.rateCard(cardId, useful));
    if (cardRef.current?.id === cardId)
      setCard(await call(api.getCard(cardId)));
    await loadRoadmap(subjectId);
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

  const refreshPath = () => {
    if (subjectRef.current) void loadRoadmap(subjectRef.current);
  };

  const putNote = (note: Note) =>
    setNotes((m) => {
      const list = m[note.conversationId] ?? [];
      const next = list.some((n) => n.id === note.id)
        ? list.map((n) => (n.id === note.id ? note : n))
        : [...list, note];
      return { ...m, [note.conversationId]: next };
    });

  const dropNote = (note: Note) =>
    setNotes((m) => ({
      ...m,
      [note.conversationId]: (m[note.conversationId] ?? []).filter(
        (n) => n.id !== note.id,
      ),
    }));

  const flashNote = (id: string) => {
    setFlash(id);
    setTimeout(() => setFlash((f) => (f === id ? null : f)), 1700);
  };

  // A note the user just made, or the one the same words already made, is brought into view.
  const showNote = (id: string) => {
    flashNote(id);
    setReveal({ id, key: ++pickSeq.current });
  };

  const placeNote = async (pick: Pick, at: Point) => {
    setPendingPick(null);
    const r = await api.createNote({
      conversationId: pick.conversationId,
      text: pick.text,
      sourceSeq: pick.seq,
      questionNo: pick.q,
      x: at.x,
      y: at.y,
    });
    if (!r.ok) {
      showToast(NOTE_ERRORS[r.code] ?? '필기를 저장하지 못했어요');
      return;
    }
    const { note, duplicate } = r.data;
    showNote(note.id);
    if (duplicate) {
      showToast('이미 필기한 부분이에요');
      return;
    }
    putNote(note);
    showToast(`Q${note.questionNo} 답에서 필기를 남겼어요`);
    refreshPath();
  };

  // Words kept without a spot to land on (the button, or a drop on the roadmap) go to the page, which finds them room.
  const collect = (pick: Pick) => {
    if (pick.conversationId !== convRef.current?.id) return;
    openPage(pick.conversationId);
    setPendingPick({ ...pick, key: ++pickSeq.current });
  };

  const moveNote = async (note: Note, at: Point) => {
    putNote({ ...note, ...at, updatedAt: Date.now() });
    const r = await api.updateNote(note.id, at);
    if (r.ok) putNote(r.data);
    else {
      putNote(note);
      showToast('필기를 옮기지 못했어요');
    }
  };

  const restoreNote = async (old: Note) => {
    const r = await api.createNote({
      conversationId: old.conversationId,
      text: old.text,
      kind: old.kind,
      sourceSeq: old.sourceSeq ?? undefined,
      x: old.x,
      y: old.y,
    });
    if (!r.ok) {
      showToast('되돌리지 못했어요');
      return;
    }
    putNote(r.data.note);
    flashNote(r.data.note.id);
    refreshPath();
  };

  const deleteNote = async (note: Note) => {
    dropNote(note);
    const r = await api.deleteNote(note.id);
    if (!r.ok) {
      putNote(note);
      showToast('필기를 지우지 못했어요');
      return;
    }
    refreshPath();
    showToast(note.kind === 'memo' ? '메모를 지웠어요' : '필기를 지웠어요', {
      label: '되돌리기',
      run: () => void restoreNote(r.data),
    });
  };

  // The answer a note came from, brought into view in the chat beside it.
  const showSource = (note: Note) => {
    const answer = document.querySelector<HTMLElement>(
      `.messages .msg-ai[data-seq="${note.sourceSeq}"]`,
    );
    if (!answer) return;
    setOpen('chat', true);
    answer.scrollIntoView({ block: 'center', behavior: 'smooth' });
    answer.animate(
      [{ backgroundColor: '#e8ecf1' }, { backgroundColor: 'transparent' }],
      { duration: 1400, easing: 'ease-out' },
    );
  };

  const consult = (conversationId: string, locked: LockedNode[]) => {
    const draft = consultDraft(locked, notesRef.current[conversationId] ?? []);
    setInput((cur) => (cur.trim() ? `${cur.trimEnd()}\n\n${draft}` : draft));
    focusInput();
  };

  const onRoadDrag = (e: DragEvent<HTMLDivElement>) => {
    if (!carriesNote(e.dataTransfer)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    const r = e.currentTarget.getBoundingClientRect();
    setRoadDrop({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  const onRoadDrop = (e: DragEvent<HTMLDivElement>) => {
    if (!carriesNote(e.dataTransfer)) return;
    e.preventDefault();
    setRoadDrop(null);
    const pick = readDrop(e.dataTransfer);
    if (pick) collect(pick);
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
    const offTool = api.onToolEvent((ev) =>
      setStream((cur) =>
        cur?.id === ev.streamId
          ? { ...cur, tools: withToolEvent(cur.tools, ev) }
          : cur,
      ),
    );
    const offCard = api.onCardEvent((ev) =>
      setMaking((m) =>
        m?.conversationId === ev.conversationId
          ? { ...m, fields: { ...m.fields, [ev.field]: ev.text } }
          : m,
      ),
    );
    const offAuth = api.onAuthChanged(() => {
      void call(api.authStatus()).then(setAuth);
    });
    void call(api.authStatus()).then(async (status) => {
      setAuth(status);
      if (status.state === 'signed_in') await enterApp();
    });
    return () => {
      offChat();
      offTool();
      offCard();
      offAuth();
    };
  }, [enterApp]);

  // Main keeps the list once the server sends it, so asking per conversation is cheap and recovers from a failure.
  const convId = conv?.id;
  useEffect(() => {
    if (!convId) return;
    let live = true;
    void api.listModels().then((r) => {
      if (live) setModels(r.ok ? r.data : null);
    });
    return () => {
      live = false;
    };
  }, [convId]);

  useEffect(() => storeSaved(saved), [saved]);

  // The chat marks what its conversation already has as notes, wherever the middle is.
  const chatSaved = conv?.saved ? conv.id : null;
  useEffect(() => {
    if (chatSaved && !notesRef.current[chatSaved]) void loadNotes(chatSaved);
  }, [chatSaved, loadNotes]);

  // The open tabs are kept per subject, as they are now.
  useEffect(() => {
    if (!subjectId) return;
    setSaved((s) =>
      (s.tabs[subjectId] ?? []).join() === pages.tabs.join()
        ? s
        : { ...s, tabs: { ...s.tabs, [subjectId]: pages.tabs } },
    );
  }, [pages.tabs, subjectId]);

  // Tabs kept from an earlier launch whose conversation is no longer on the path close.
  useEffect(() => {
    if (!roadmap || roadmap.subject.id !== subjectRef.current) return;
    const alive = new Set(
      roadmap.nodes.flatMap((n) =>
        n.kind === 'locked' ? [] : [n.conversationId],
      ),
    );
    if (convRef.current?.saved) alive.add(convRef.current.id);
    const next = keepOnly(pagesRef.current, alive);
    if (next !== pagesRef.current) setPages(next);
  }, [roadmap, setPages]);

  // Alt+← and Alt+→, or the mouse's side buttons, go back and forward between places, as a browser does.
  const stepRef = useRef<(by: -1 | 1) => void>(() => {});
  stepRef.current = (by) => go(step(pagesRef.current, by));
  const signedIn = auth?.state === 'signed_in';
  useEffect(() => {
    if (!signedIn) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.isComposing || e.keyCode === 229) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      stepRef.current(e.key === 'ArrowLeft' ? -1 : 1);
    };
    const onMouse = (e: MouseEvent) => {
      if (e.button !== 3 && e.button !== 4) return;
      e.preventDefault();
      stepRef.current(e.button === 3 ? -1 : 1);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mouseup', onMouse);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mouseup', onMouse);
    };
  }, [signedIn]);

  const place = activePlace(pages);
  const placeKey = place.kind === 'page' ? place.id : 'roadmap';
  useLayoutEffect(() => {
    if (placeKey === 'roadmap' && roadEl.current)
      roadEl.current.scrollTop = roadScroll.current;
  }, [placeKey]);

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
  const path = (roadmap?.nodes.filter((n) => n.kind !== 'locked') ??
    []) as PathNode[];
  const locked = (roadmap?.nodes.filter((n) => n.kind === 'locked') ??
    []) as LockedNode[];
  // Recommendations come only from the card of the subject's latest conversation (db.ts upsertCard).
  const latestDone =
    path.reduce<PathNode | null>(
      (a, n) => (!a || n.createdAt >= a.createdAt ? n : a),
      null,
    )?.kind === 'done';

  // A page just saved may be in the chat before the path has reloaded with it.
  const pageInfo = (id: string): PageInfo | null => {
    const i = path.findIndex((n) => n.conversationId === id);
    const node = path[i];
    const chat = conv?.id === id && conv.saved ? conv : null;
    if (!subject || (!node && !chat)) return null;
    return {
      conversationId: id,
      title: node?.title ?? chat!.title,
      subjectTitle: subject.title,
      order: (i < 0 ? path.length : i) + 1,
      turns:
        node?.turns ?? chat!.messages.filter((m) => m.role === 'user').length,
      card: node?.kind === 'done' ? node : null,
    };
  };

  const tabs: TabInfo[] = pages.tabs.flatMap((id) => {
    const info = pageInfo(id);
    if (!info) return [];
    const node = path.find((n) => n.conversationId === id);
    return [
      {
        id,
        title: info.title,
        notes: notes[id]?.length ?? node?.notes ?? 0,
        done: !!info.card,
        state: info.card ? dayLabel(info.card.createdAt) : '진행 중',
      },
    ];
  });

  const page = place.kind === 'page' ? pageInfo(place.id) : null;
  const pageId = page?.conversationId ?? null;
  const pageCard = page?.card ?? null;
  const fullCard =
    page && card?.conversationId === page.conversationId && subject ? (
      <CardView
        card={card}
        subjectTitle={subject.title}
        regenerating={making?.conversationId === card.conversationId}
        onRate={(useful) => void rate(card.id, useful)}
        onAsk={focusInput}
        onRegenerate={() => void regenerate(card)}
        onClose={() => setCard(null)}
      />
    ) : null;
  const dropping = roadDrop && draggedPick();

  const headAction = conv?.saved ? (
    making?.conversationId === conv.id ? (
      <>
        <button className="btn small amber" disabled aria-busy="true">
          <i className="spin" aria-hidden />
          카드 만드는 중…
        </button>
        <button
          className="btn small"
          onClick={() => void api.cancelCard(conv.id)}
        >
          취소
        </button>
      </>
    ) : (
      <button
        className="btn small amber"
        disabled={!!stream || !!making}
        onClick={() => void makeCard(conv.id)}
      >
        경험으로 남기기
      </button>
    )
  ) : null;

  return (
    <div
      className="app"
      data-sidebar={layout.sidebar ? 'open' : 'folded'}
      data-chat={layout.chat ? 'open' : 'folded'}
    >
      <Pane
        panel="sidebar"
        open={layout.sidebar}
        onOpen={() => setOpen('sidebar', true)}
      >
        <Sidebar
          subjects={subjects}
          subjectId={subjectId}
          experiences={[...done].reverse()}
          making={makingHere}
          openCardId={pageCard?.cardId ?? null}
          account="ChatGPT Plus"
          onSelect={(id) => void selectSubject(id)}
          onNewSubject={() => setDialog({ kind: 'subject' })}
          onOpenCard={(n) => openPage(n.conversationId)}
          onSignOut={() => void signOut()}
          onFold={() => setOpen('sidebar', false)}
        />
      </Pane>
      <main className="middle">
        {roadmap && subject ? (
          <>
            <TabBar
              subjectTitle={subject.title}
              tabs={tabs}
              active={pageId}
              canBack={canBack(pages)}
              canForward={canForward(pages)}
              onBack={() => stepRef.current(-1)}
              onForward={() => stepRef.current(1)}
              onRoadmap={() => go(visit(pagesRef.current, ROADMAP))}
              onOpen={openPage}
              onClose={(id) => go(closeTab(pagesRef.current, id))}
              onNew={() =>
                void newConversation(subject.id).then(() => focusInput())
              }
            />
            <div className="view">
              {page ? (
                <NotePage
                  key={page.conversationId}
                  page={page}
                  notes={notes[page.conversationId] ?? null}
                  view={saved.views[page.conversationId] ?? DEFAULT_VIEW}
                  making={
                    makingHere?.conversationId === page.conversationId
                      ? makingHere.fields
                      : null
                  }
                  fullCard={fullCard}
                  fresh={freshPin === page.conversationId}
                  flash={flash}
                  reveal={reveal}
                  pick={pendingPick}
                  locked={locked}
                  nothingNext={
                    latestDone
                      ? '추천한 공부를 모두 시작했어요.'
                      : '이 과목의 가장 최근 대화를 경험으로 남기면 다음 공부 추천이 생겨요.'
                  }
                  onView={(v: View) =>
                    setSaved((s) => ({
                      ...s,
                      views: {
                        ...Object.fromEntries(
                          Object.entries(s.views).filter(
                            ([id]) => id !== page.conversationId,
                          ),
                        ),
                        [page.conversationId]: v,
                      },
                    }))
                  }
                  onPlace={(pick, at) => void placeNote(pick, at)}
                  onElsewhere={collect}
                  onMove={(note, at) => void moveNote(note, at)}
                  onDelete={(note) => void deleteNote(note)}
                  onSource={showSource}
                  onRate={(useful) =>
                    pageCard && void rate(pageCard.cardId, useful)
                  }
                  onExpand={() => pageCard && void showCard(pageCard.cardId)}
                  onStart={(node) => void startRecommended(node)}
                  onConsult={() => consult(page.conversationId, locked)}
                />
              ) : (
                <div
                  className="roadmap-view"
                  ref={roadEl}
                  onScroll={(e) =>
                    (roadScroll.current = e.currentTarget.scrollTop)
                  }
                  onDragEnter={onRoadDrag}
                  onDragOver={onRoadDrag}
                  onDragLeave={(e) => {
                    const to = e.relatedTarget as Node | null;
                    if (!to || !e.currentTarget.contains(to)) setRoadDrop(null);
                  }}
                  onDrop={onRoadDrop}
                >
                  <Roadmap
                    roadmap={roadmap}
                    activeConversationId={conv?.id ?? null}
                    makingConversationId={makingHere?.conversationId ?? null}
                    makingFields={makingHere?.fields ?? null}
                    openLockedId={lockedNode?.id ?? null}
                    lockedBubble={
                      lockedNode && (
                        <LockedBubble
                          node={lockedNode}
                          onStart={() => void startRecommended(lockedNode)}
                        />
                      )
                    }
                    onOpenPage={openPage}
                    onOpenLocked={toggleLocked}
                  />
                </div>
              )}
              {roadDrop && !page && (
                <>
                  <div className="dropzone" aria-hidden />
                  <p
                    className="droptag"
                    style={{ left: roadDrop.x + 16, top: roadDrop.y + 16 }}
                    aria-hidden
                  >
                    <Page />
                    <b>놓으면 필기 페이지가 열려요</b>
                    {dropping && conv?.id === dropping.conversationId && (
                      <span>{conv.title}</span>
                    )}
                  </p>
                </>
              )}
              {toast && (
                <div className="toast" role="status" key={toast.key}>
                  <span>{toast.text}</span>
                  {toast.action && (
                    <button
                      className="btn small"
                      onClick={() => {
                        setToast(null);
                        toast.action?.run();
                      }}
                    >
                      {toast.action.label}
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="path-empty">
            <h2>과목을 만들면 여기에 길이 생겨요</h2>
            <p>공부한 대화가 경험 카드가 되어 이 길에 하나씩 쌓여요.</p>
            <button
              className="btn primary"
              onClick={() => setDialog({ kind: 'subject' })}
            >
              첫 과목 만들기
            </button>
          </div>
        )}
      </main>
      <Pane
        panel="chat"
        open={layout.chat}
        onOpen={() => setOpen('chat', true)}
      >
        <ChatPanel
          subjectTitle={subject?.title ?? null}
          conversation={conv}
          streamingText={
            stream && stream.conversationId === conv?.id ? stream.text : null
          }
          streamingTools={
            stream && stream.conversationId === conv?.id ? stream.tools : []
          }
          banner={banner}
          input={input}
          inputRef={inputRef}
          headAction={headAction}
          modelPicker={
            conv && (
              <ModelSelect
                list={models}
                model={conv.model}
                busy={!!stream}
                onPick={(model) => void pickModel(model)}
              />
            )
          }
          onInput={setInput}
          onSend={() => void send()}
          onStop={stopStream}
          onNewConversation={() => subjectId && void newConversation(subjectId)}
          onOpenUsage={() => void api.openUsage()}
          onFold={() => setOpen('chat', false)}
          onAddNote={collect}
          onNoteRefused={(why) => showToast(REFUSALS[why])}
          noted={conv ? notes[conv.id] : undefined}
        />
      </Pane>
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
