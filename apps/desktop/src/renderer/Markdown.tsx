import ReactMarkdown, { type Components } from 'react-markdown';

// O9: raw HTML stays text, links and images never become live elements.
const components: Components = {
  a: ({ children }) => <span className="link-text">{children}</span>,
  img: ({ alt }) => <span>{alt ? `[이미지: ${alt}]` : '[이미지]'}</span>,
};

const MARK = '​';
// CommonMark won't close `**` between punctuation and Korean (`**“…”**고`) or open it between Korean and punctuation.
// A zero-width space on the punctuation side makes the run flank the way remark-cjk-friendly would; stripMark removes it after parsing.
const STUCK =
  /(?<=(?![*\\])[\p{P}\p{S}])(\*+)(?=[\p{sc=Hangul}\p{sc=Han}\p{sc=Hiragana}\p{sc=Katakana}])|(?<=[\p{sc=Hangul}\p{sc=Han}\p{sc=Hiragana}\p{sc=Katakana}])(\*+)(?=(?!\*)[\p{P}\p{S}])/gu;

const unstick = (text: string) =>
  text.replace(STUCK, (_, markBefore?: string, markAfter?: string) =>
    markBefore ? MARK + markBefore : markAfter + MARK,
  );

type MdNode = { type: string; value?: unknown; children?: MdNode[] };
const stripMark = (node: MdNode): void => {
  if (typeof node.value === 'string')
    node.value = node.value.replaceAll(MARK, '');
  node.children?.forEach(stripMark);
};
const remarkPlugins = [() => stripMark];

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};
const BLOCKS = new Set([
  'p',
  'ul',
  'ol',
  'li',
  'blockquote',
  'pre',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
]);

// The streaming caret goes into the deepest last block, so it trails the last character instead of opening a line.
const appendCaret = (tree: HastNode): void => {
  let node = tree;
  for (;;) {
    const last = node.children?.findLast(
      (c) => c.type !== 'text' || c.value?.trim(),
    );
    if (last?.type !== 'element' || !BLOCKS.has(last.tagName ?? '')) break;
    node = last;
  }
  node.children = [
    ...(node.children ?? []),
    {
      type: 'element',
      tagName: 'span',
      properties: { className: ['cursor'], ariaHidden: 'true' },
      children: [],
    },
  ];
};
const caretPlugins = [() => appendCaret];

export function Markdown({ text, caret }: { text: string; caret?: boolean }) {
  return (
    <div className="md">
      <ReactMarkdown
        components={components}
        remarkPlugins={remarkPlugins}
        rehypePlugins={caret ? caretPlugins : undefined}
      >
        {unstick(text)}
      </ReactMarkdown>
    </div>
  );
}
