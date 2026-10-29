import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import type { Channel } from '../shared/ipc';
import { DuplicateSubjectError, type Store } from './db';
import { IpcError, guard, type Handler } from './ipc';

export type Deps = {
  store: Store;
  isTrusted: (event: IpcMainInvokeEvent) => boolean;
};

export function registerHandlers({ store, isTrusted }: Deps) {
  const on = <C extends Channel>(channel: C, handler: Handler<C>) =>
    ipcMain.handle(channel, guard(channel, isTrusted, handler));

  on('subjects:list', () => store.listSubjects());
  on('subjects:create', ({ title }) => {
    try {
      return store.createSubject(title);
    } catch (err) {
      if (err instanceof DuplicateSubjectError)
        throw new IpcError('duplicate', '이미 있는 과목이에요');
      throw err;
    }
  });
  on('roadmap:get', ({ subjectId }) => {
    const roadmap = store.roadmap(subjectId);
    if (!roadmap) throw new IpcError('not_found');
    return roadmap;
  });
}
