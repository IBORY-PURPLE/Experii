import ReactMarkdown, { type Components, type Options } from 'react-markdown';
import remarkGfm from 'remark-gfm';

// O9: raw HTML stays text, links and images never become live elements.
const components: Components = {
  a: ({ children }) => <span className="link-text">{children}</span>,
  img: ({ alt }) => <span>{alt ? `[이미지: ${alt}]` : '[이미지]'}</span>,
  // A wide result set scrolls inside its own box so the chat column keeps its width.
  table: ({ children }) => (
    <div className="md-table" role="region" aria-label="표" tabIndex={0}>
      <table>{children}</table>
    </div>
  ),
  td: ({ node, style, children }) => {
    const only = node?.children.length === 1 ? node.children[0] : undefined;
    const isNull = only?.type === 'text' && only.value === 'NULL';
    return (
      <td style={style} className={isNull ? 'null' : undefined}>
        {children}
      </td>
    );
  },
  pre: ({ node, children }) => {
    const code = node?.children[0];
    const classes = code?.type === 'element' ? code.properties.className : null;
    const lang = Array.isArray(classes)
      ? classes
          .map(String)
          .find((c) => c.startsWith('language-'))
          ?.slice('language-'.length)
      : undefined;
    return (
      <div className="md-code">
        {lang && <div className="md-code-lang">{lang}</div>}
        <pre>{children}</pre>
      </div>
    );
  },
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
// Korean writes ranges with one tilde (3~5초), so only `~~` strikes through.
const remarkPlugins: Options['remarkPlugins'] = [
  [remarkGfm, { singleTilde: false }],
  () => stripMark,
];

export function Markdown({ text }: { text: string }) {
  return (
    <div className="md">
      <ReactMarkdown components={components} remarkPlugins={remarkPlugins}>
        {unstick(text)}
      </ReactMarkdown>
    </div>
  );
}
