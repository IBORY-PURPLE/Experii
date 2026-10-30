export type SseMessage = { event: string; data: string };

// One decoder per stream with stream:true, so a Hangul character split across chunks is not corrupted.
export class SseParser {
  private decoder = new TextDecoder('utf-8');
  private buffer = '';
  private event = '';
  private data: string[] = [];

  push(chunk: Uint8Array): SseMessage[] {
    this.buffer += this.decoder.decode(chunk, { stream: true });
    return this.drain();
  }

  end(): SseMessage[] {
    this.buffer += this.decoder.decode();
    const out = this.drain();
    if (this.buffer.length) {
      this.line(this.buffer, out);
      this.buffer = '';
    }
    this.dispatch(out);
    return out;
  }

  private drain(): SseMessage[] {
    const out: SseMessage[] = [];
    let nl: number;
    while ((nl = this.buffer.search(/\r\n|\r|\n/)) >= 0) {
      const line = this.buffer.slice(0, nl);
      const width = this.buffer.startsWith('\r\n', nl) ? 2 : 1;
      if (
        this.buffer[nl] === '\r' &&
        width === 1 &&
        nl === this.buffer.length - 1
      )
        break;
      this.buffer = this.buffer.slice(nl + width);
      this.line(line, out);
    }
    return out;
  }

  private line(line: string, out: SseMessage[]) {
    if (line === '') return this.dispatch(out);
    if (line.startsWith(':')) return;
    const colon = line.indexOf(':');
    const field = colon < 0 ? line : line.slice(0, colon);
    let value = colon < 0 ? '' : line.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);
    if (field === 'event') this.event = value;
    else if (field === 'data') this.data.push(value);
  }

  private dispatch(out: SseMessage[]) {
    if (this.data.length)
      out.push({ event: this.event || 'message', data: this.data.join('\n') });
    this.event = '';
    this.data = [];
  }
}

export async function* parseSse(
  body: AsyncIterable<Uint8Array>,
): AsyncGenerator<SseMessage> {
  const parser = new SseParser();
  for await (const chunk of body) yield* parser.push(chunk);
  yield* parser.end();
}
