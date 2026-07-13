import type { ChangeRequest } from './types';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface ChangeRequestPanelProps {
  productOwner: string;
  request: ChangeRequest;
  onAccept: () => void;
  onDecline: () => void;
  disabled?: boolean;
}

/** A live change request from the Product Owner. The team decides with the PO:
 *  pull it in (adapt to new information) or hold it for a later Sprint (protect
 *  the Sprint Goal). Either can be right - the point is it's a shared decision. */
export function ChangeRequestPanel({ productOwner, request, onAccept, onDecline, disabled }: ChangeRequestPanelProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-violet-300 bg-violet-50 px-4 py-3 dark:bg-violet-950/30">
      <div className="flex items-center gap-2 shrink-0">
        <Sparkles className="h-5 w-5 text-violet-600" />
        <div className="leading-tight">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-400">Change request</div>
          <div className="text-sm font-medium">{productOwner}</div>
        </div>
      </div>

      <div className="min-w-[12rem] flex-1">
        <div className="text-sm font-medium">
          {request.title}
          <span className="ml-2 font-mono text-xs text-muted-foreground">{request.points} pts · v{request.value}</span>
        </div>
        <p className="text-xs text-muted-foreground">{request.detail}</p>
      </div>

      <div className="flex shrink-0 gap-2">
        <Button size="sm" onClick={onAccept} disabled={disabled}>Pull it in</Button>
        <Button size="sm" variant="outline" onClick={onDecline} disabled={disabled}>Protect the Goal</Button>
      </div>
    </div>
  );
}
