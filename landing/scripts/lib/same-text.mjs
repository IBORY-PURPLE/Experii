// The generated files are compared as text. A Windows checkout with core.autocrlf turns their LF into CRLF, which is the same file.
export const normalizeEol = (text) => text.replace(/\r\n/g, '\n');
export const sameText = (a, b) => normalizeEol(a) === normalizeEol(b);
