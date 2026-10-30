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

export function Markdown({ text }: { text: string }) {
  return (
    <div className="md">
      <ReactMarkdown components={components} remarkPlugins={remarkPlugins}>
        {unstick(text)}
      </ReactMarkdown>
    </div>
  );
}
