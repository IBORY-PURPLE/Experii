import type { Note, NoteCreated, Payload } from '../shared/ipc';
import type { Store } from './db';
import { IpcError } from './ipc';

const clean = (text: string) => text.replace(/\r\n?/g, '\n').trim();
const sameWords = (a: string, b: string) =>
  a.replace(/\s+/g, ' ') === b.replace(/\s+/g, ' ');

// A note page belongs to a saved conversation. An excerpt keeps an answer's words as they were and which answer they came from.
export class NoteService {
  constructor(
    private store: Store,
    private isPending: (conversationId: string) => boolean,
  ) {}

  list(conversationId: string): Note[] {
    this.ensureSaved(conversationId);
    return this.store.listNotes(conversationId);
  }

  create(p: Payload<'notes:create'>): NoteCreated {
    this.ensureSaved(p.conversationId);
    const text = clean(p.text);
    const at = { conversationId: p.conversationId, x: p.x, y: p.y };
    if (p.kind === 'memo') {
      const note = this.store.insertNote({
        ...at,
        kind: 'memo',
        format: 'plain',
        text,
        sourceSeq: null,
        questionNo: null,
      });
      return { note, duplicate: false };
    }
    // The question number the screen sends is not trusted; the answer's place among the saved items decides it.
    const questionNo =
      p.sourceSeq === undefined
        ? null
        : this.store.questionNo(p.conversationId, p.sourceSeq);
    if (p.sourceSeq === undefined || questionNo === null)
      throw new IpcError('invalid_source');
    const same = this.store
      .listNotes(p.conversationId)
      .find(
        (n) =>
          n.kind === 'excerpt' &&
          n.sourceSeq === p.sourceSeq &&
          sameWords(n.text, text),
      );
    if (same) return { note: same, duplicate: true };
    const note = this.store.insertNote({
      ...at,
      kind: 'excerpt',
      format: 'plain',
      text,
      sourceSeq: p.sourceSeq,
      questionNo,
    });
    return { note, duplicate: false };
  }

  update({ id, text, ...place }: Payload<'notes:update'>): Note {
    const note = this.store.getNote(id);
    if (!note) throw new IpcError('not_found');
    if (text !== undefined && note.kind !== 'memo')
      throw new IpcError('not_editable');
    return this.store.updateNote(id, {
      ...place,
      text: text === undefined ? undefined : clean(text),
    })!;
  }

  delete(id: string): Note {
    const note = this.store.deleteNote(id);
    if (!note) throw new IpcError('not_found');
    return note;
  }

  private ensureSaved(conversationId: string) {
    if (this.store.getConversationRow(conversationId)) return;
    if (this.isPending(conversationId))
      throw new IpcError('not_saved', '첫 답을 받은 뒤 필기할 수 있어요');
    throw new IpcError('not_found');
  }
}
