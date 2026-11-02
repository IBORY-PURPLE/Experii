import { heroBoard } from '@/content/loop';
import { AppReplica } from './AppReplica';
import { BoardDemoPlayer } from './BoardDemoPlayer';

export function BoardDemo({ note }: { note: string }) {
  return (
    <div className="bd-stage">
      <BoardDemoPlayer copy={heroBoard}>
        <AppReplica />
      </BoardDemoPlayer>
      <p className="hero-demo-note">{note}</p>
    </div>
  );
}
