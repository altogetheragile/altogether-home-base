import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useZooGame } from '@/components/zooGame/useZooGame';
import { useZooGameSaves } from '@/components/zooGame/useZooGameSaves';
import { useZooProductOwner } from '@/components/zooGame/useZooProductOwner';
import { useAuth } from '@/contexts/AuthContext';
import { ZooIntro } from '@/components/zooGame/ZooIntro';
import { RefineBacklog } from '@/components/zooGame/RefineBacklog';
import { SprintPlanning } from '@/components/zooGame/SprintPlanning';
import { SprintBoard } from '@/components/zooGame/SprintBoard';
import { SprintReview } from '@/components/zooGame/SprintReview';
import { SprintRetro } from '@/components/zooGame/SprintRetro';
import { ZooFinal } from '@/components/zooGame/ZooFinal';
import { ZooShell } from '@/components/zooGame/ZooShell';
import { ZooSavedGamesDialog } from '@/components/zooGame/ZooSavedGamesDialog';
import { SaveGameDialog } from '@/components/flowGame/SaveGameDialog';
import type { ZooGameState } from '@/components/zooGame/types';
import Navigation from '@/components/Navigation';

/** Build A Zoo: the Scrum loop skinned as building a zoo, with a real customer at
 *  the Review (the visitor simulation). intro -> planning -> sprint -> review ->
 *  retro -> next Sprint. Games can be saved and resumed (signed-in players). */
export default function ZooGame() {
  const { state, start, setPhase, setGoal, setSprintGoal, setDod, takeSignal, plan, estimate, setTasks, toggleTask, startItem, toggleGoalCritical, setSprintDays, setLearnMode, setDailyScrumAt, setEnclosureSize, setItemPos, splitEpic, createPbi, refinePbi, reorder, moveZoneOrder, moveBefore, setUserStories, pull, build, editBuild, addAnotherPbi, open, closeDay, holdDailyScrum, skipDailyScrum, beginDay, nextSprint, loadGame, poRefine, setPathStyle, setPathRoute, reset } = useZooGame();
  const { user } = useAuth();
  const { saveGame, isSaving } = useZooGameSaves();
  const { refine: poRefineCall, isRefining } = useZooProductOwner();

  // Save/resume orchestration. saveId tracks the row this game maps to, so a second
  // save updates rather than duplicates; saveName seeds the name field.
  const [saveId, setSaveId] = useState<string | null>(null);
  const [saveName, setSaveName] = useState('');
  const [saveOpen, setSaveOpen] = useState(false);
  const [savesOpen, setSavesOpen] = useState(false);
  const [poNote, setPoNote] = useState<string | null>(null);

  // Each phase is its own screen; start it at the top.
  useEffect(() => { window.scrollTo(0, 0); }, [state.phase]);

  const requestSave = () => {
    if (!user) { toast.error('Sign in to save your zoo.'); return; }
    setSaveOpen(true);
  };
  const handleSave = async (name: string) => {
    try {
      const id = await saveGame({ id: saveId, name, state });
      setSaveId(id);
      setSaveName(name);
      setSaveOpen(false);
      toast.success('Zoo saved');
    } catch {
      toast.error('Could not save. Please try again.');
    }
  };
  const handleResume = (id: string, loaded: ZooGameState, name: string) => {
    loadGame(loaded);
    setSaveId(id);
    setSaveName(name);
    toast.success(`Resumed "${name}"`);
  };
  const handlePoRefine = async () => {
    if (!user) { toast.error('Sign in to use the AI Product Owner.'); return; }
    try {
      const decisions = await poRefineCall(state);
      poRefine(decisions);
      setPoNote(decisions.rationale?.trim() || 'The Product Owner refined the Backlog.');
      toast.success('Product Owner refined the Backlog');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'The Product Owner could not refine the Backlog.');
    }
  };

  const shellProps = { onPlaceItem: setItemPos, onSetPathStyle: setPathStyle, onSetPathRoute: setPathRoute, onSetDod: setDod, onSetProductGoal: setGoal, onSave: requestSave, onOpenSaves: () => setSavesOpen(true), onPoRefine: handlePoRefine, poRefining: isRefining, poNote, onDismissPoNote: () => setPoNote(null) };

  const render = () => {
    switch (state.phase) {
      case 'intro':
        return <ZooIntro productGoal={state.productGoal} onSetGoal={setGoal} onStart={start} onOpenSaves={user ? () => setSavesOpen(true) : undefined} />;
      case 'refine':
        return <ZooShell state={state} {...shellProps}><RefineBacklog state={state} onEstimate={estimate} onAddPbi={createPbi} onRefinePbi={refinePbi} onReorder={reorder} onMoveZone={moveZoneOrder} onMoveBefore={moveBefore} onSetUseStories={setUserStories} onSplitEpic={splitEpic} onPlan={() => setPhase('planning')} /></ZooShell>;
      case 'planning':
        return <ZooShell state={state} {...shellProps}><SprintPlanning state={state} onPlan={plan} onEstimate={estimate} onSetTasks={setTasks} onToggleGoalCritical={toggleGoalCritical} onSetSprintDays={setSprintDays} onAddPbi={createPbi} onRefinePbi={refinePbi} onReorder={reorder} onMoveZone={moveZoneOrder} onMoveBefore={moveBefore} onSetUseStories={setUserStories} onSetSprintGoal={setSprintGoal} onTakeSignal={takeSignal} onSplitEpic={splitEpic} /></ZooShell>;
      case 'sprint':
        return <ZooShell state={state} {...shellProps}><SprintBoard state={state} onBuild={build} onEditBuild={editBuild} onAddAnother={addAnotherPbi} onAddPbi={createPbi} onRefinePbi={refinePbi} onEstimate={estimate} onSetUseStories={setUserStories} onToggleTask={toggleTask} onStartItem={startItem} onSetEnclosure={setEnclosureSize} onSetLearnMode={setLearnMode} onSetScrumAt={setDailyScrumAt} onPull={pull} onOpen={open} onEndDay={closeDay} onHoldDailyScrum={holdDailyScrum} onSkipDailyScrum={skipDailyScrum} onStartDay={beginDay} onSplitEpic={splitEpic} /></ZooShell>;
      case 'review':
        return <ZooShell state={state} {...shellProps}><SprintReview state={state} onTakeSignal={takeSignal} onContinue={() => setPhase('retro')} /></ZooShell>;
      case 'retro':
        return <ZooShell state={state} {...shellProps}><SprintRetro state={state} onNextSprint={nextSprint} onSetDod={setDod} onWrapUp={() => setPhase('final')} /></ZooShell>;
      case 'final':
        return <ZooFinal state={state} onReset={reset} />;
      default:
        return <ZooShell state={state} {...shellProps}><SprintPlanning state={state} onPlan={plan} onEstimate={estimate} onSetTasks={setTasks} onToggleGoalCritical={toggleGoalCritical} onSetSprintDays={setSprintDays} onAddPbi={createPbi} onRefinePbi={refinePbi} onReorder={reorder} onMoveZone={moveZoneOrder} onMoveBefore={moveBefore} onSetUseStories={setUserStories} onSetSprintGoal={setSprintGoal} onTakeSignal={takeSignal} onSplitEpic={splitEpic} /></ZooShell>;
    }
  };

  return (
    // Fixed viewport height so the game frame never scrolls - the shell scrolls internally.
    // The marketing footer is omitted here to reclaim the full screen for the game.
    <div className="flex h-dvh flex-col overflow-hidden">
      <Navigation />
      <main className="min-h-0 flex-1 overflow-hidden">{render()}</main>
      <SaveGameDialog open={saveOpen} onOpenChange={setSaveOpen} defaultName={saveName} isUpdate={!!saveId} saving={isSaving} onSave={handleSave} />
      <ZooSavedGamesDialog open={savesOpen} onOpenChange={setSavesOpen} onResume={handleResume} />
    </div>
  );
}
