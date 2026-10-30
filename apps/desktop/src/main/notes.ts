import type { Note, NoteCreated, Payload } from '../shared/ipc';
import type { Store } from './db';
import { IpcError } from './ipc';

const clean = (text: string) => text.replace(/\r\n?/g, '\n').trim();
const sameWords = (a: string, b: string) =>
  a.replace(/\s+/g, ' ') === b.replace(/\s+/g, ' ');

// A note page belongs to a saved conversation. A note keeps an answer's words as they were and which answer they came from.
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
    // The question number the screen sends is not trusted; the answer's place among the saved items decides it.
    const questionNo = this.store.questionNo(p.conversationId, p.sourceSeq);
    if (questionNo === null) throw new IpcError('invalid_source');
    const text = clean(p.text);
    const same = this.store
      .listNotes(p.conversationId)
      .find((n) => n.sourceSeq === p.sourceSeq && sameWords(n.text, text));
    if (same) return { note: same, duplicate: true };
    const note = this.store.insertNote({
      conversationId: p.conversationId,
      format: 'plain',
      text,
      sourceSeq: p.sourceSeq,
      questionNo,
      x: p.x,
      y: p.y,
    });
    return { note, duplicate: false };
  }

  update({ id, ...place }: Payload<'notes:update'>): Note {
    if (!this.store.getNote(id)) throw new IpcError('not_found');
    return this.store.updateNote(id, place)!;
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
