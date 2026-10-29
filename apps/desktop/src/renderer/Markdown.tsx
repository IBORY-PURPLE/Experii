import ReactMarkdown, { type Components } from 'react-markdown';

// O9: raw HTML stays text, links and images never become live elements.
const components: Components = {
  a: ({ children }) => <span className="link-text">{children}</span>,
  img: ({ alt }) => <span>{alt ? `[이미지: ${alt}]` : '[이미지]'}</span>,
};

export function Markdown({ text }: { text: string }) {
  return (
    <div className="md">
      <ReactMarkdown components={components}>{text}</ReactMarkdown>
    </div>
  );
}
