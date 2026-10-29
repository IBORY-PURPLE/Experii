import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  AuthStatus,
  ChatEvent,
  ConversationView,
  DoneNode,
  Result,
  Roadmap as RoadmapData,
  Subject,
} from '../shared/ipc';
import { ChatPanel, type Banner } from './ChatPanel';
import { NewSubjectDialog } from './Dialog';
import { Gate } from './Gate';
import { Roadmap } from './Roadmap';
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
  const [dialog, setDialog] = useState<'subject' | null>(null);
  const streamRef = useRef<Stream | null>(null);
  streamRef.current = stream;

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

  const selectSubject = useCallback(
    async (id: string) => {
      stopStream();
      setSubjectId(id);
      const map = await loadRoadmap(id);
      const current = [...map.nodes]
        .reverse()
        .find((n) => n.kind === 'current');
      if (current?.kind === 'current')
        await openConversation(current.conversationId);
      else await newConversation(id);
    },
    [loadRoadmap, openConversation, newConversation, stopStream],
  );

  const enterApp = useCallback(async () => {
    const list = await call(api.listSubjects());
    setSubjects(list);
    if (list.length) await selectSubject(list[0].id);
  }, [selectSubject]);

  const signIn = useCallback(async () => {
    setGate((g) => ({ ...g, waiting: true, error: null }));
    const r = await api.signIn();
    if (r.ok) {
      setGate({ waiting: false, error: null, planRequired: false });
      setAuth(r.data);
      setBanner(null);
      await enterApp();
    } else if (r.code === 'not_eligible_plan') {
      setGate({ waiting: false, error: null, planRequired: true });
    } else {
      setGate((g) => ({
        ...g,
        waiting: false,
        error: r.code === 'cancelled' ? null : r.code,
      }));
    }
  }, [enterApp]);

  const signOut = useCallback(async () => {
    stopStream();
    await api.signOut();
    setAuth({ state: 'signed_out' });
    setSubjects([]);
    setSubjectId(null);
    setRoadmap(null);
    setConv(null);
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
      setStream({ id, conversationId: conv.id, text: '', sent: text });
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

  const bannerFor = (code: string, sent: string): Banner | null => {
    const kept = '보낸 메시지는 입력창에 그대로 있어요.';
    switch (code) {
      case 'unauthorized':
        return {
          tone: 'err',
          title: '다시 로그인해 주세요',
          body: `로그인이 만료됐어요. ${kept}`,
          actions: [
            { label: '다시 로그인', primary: true, run: () => void signIn() },
          ],
        };
      case 'context_too_long':
        return {
          tone: 'err',
          title: '대화가 너무 길어요',
          body: 'GPT가 한 번에 읽을 수 있는 길이를 넘었어요. 새 대화로 이어 가 주세요.',
          actions: [
            {
              label: '새 대화',
              primary: true,
              run: () => subjectId && void newConversation(subjectId),
            },
          ],
        };
      case 'rate_limited':
        return {
          tone: 'err',
          title: '사용량 한도에 걸렸어요',
          body: `잠시 뒤 다시 보내 주세요. ${kept}`,
          actions: [{ label: 'Manage usage', run: () => void api.openUsage() }],
        };
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
          actions: [
            { label: '다시 보내기', primary: true, run: () => void send(sent) },
          ],
        };
    }
  };

  function onStreamError(ev: ChatEvent, sent: string) {
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
      setStream({ ...s, text: s.text + (ev.text ?? '') });
    } else if (ev.type === 'done') {
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
        onSignIn={() => void signIn()}
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

  return (
    <div className="app">
      <Sidebar
        subjects={subjects}
        subjectId={subjectId}
        experiences={[...done].reverse()}
        openCardId={null}
        account="ChatGPT Plus"
        onSelect={(id) => void selectSubject(id)}
        onNewSubject={() => setDialog('subject')}
        onOpenCard={(n) => void openConversation(n.conversationId)}
        onSignOut={() => void signOut()}
      />
      <main className="middle">
        {roadmap && subject ? (
          <Roadmap
            roadmap={roadmap}
            activeConversationId={conv?.id ?? null}
            openCardId={null}
            openLockedId={null}
            cardView={null}
            lockedBubble={null}
            onOpenConversation={(id) => void openConversation(id)}
            onOpenCard={(n) => void openConversation(n.conversationId)}
            onOpenLocked={() => {}}
          />
        ) : (
          <div className="path-empty">
            <h2>과목을 만들면 여기에 길이 생겨요</h2>
            <p>공부한 대화가 경험 카드가 되어 이 길에 하나씩 쌓여요.</p>
            <button
              className="btn primary"
              onClick={() => setDialog('subject')}
            >
              첫 과목 만들기
            </button>
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
        headAction={null}
        onInput={setInput}
        onSend={() => void send()}
        onStop={stopStream}
        onNewConversation={() => subjectId && void newConversation(subjectId)}
        onOpenUsage={() => void api.openUsage()}
      />
      {dialog === 'subject' && (
        <NewSubjectDialog
          onCreate={createSubject}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
