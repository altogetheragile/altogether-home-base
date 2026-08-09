import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
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

/** A slim game-only top bar, in place of the tall marketing site nav, so the game runs close
 *  to full-screen (built to fit a tablet without page scrolling) while still keeping the two
 *  things the game needs from the nav: a way back to the site, and sign-in (needed to save). */
function GameTopBar() {
  const { user } = useAuth();
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-border bg-background px-3 py-1">
      <Link to="/" aria-label="Back to Altogether Agile"
        className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" />
        <span>Altogether <span className="text-primary">Agile</span></span>
      </Link>
      <div className="flex items-center gap-2 text-xs">
        {user
          ? <span className="max-w-[40vw] truncate text-muted-foreground" title={user.email}>{user.email}</span>
          : <Link to="/auth" className="rounded-md border border-border px-2.5 py-1 font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40">Sign in</Link>}
      </div>
    </div>
  );
}

/** Build A Zoo: the Scrum loop skinned as building a zoo, with a real customer at
 *  the Review (the visitor simulation). intro -> planning -> sprint -> review ->
 *  retro -> next Sprint. Games can be saved and resumed (signed-in players). */
export default function ZooGame() {
  const { state, start, setPhase, setGoal, setSprintGoal, setDod, takeSignal, plan, estimate, setTasks, toggleTask, startItem, toggleGoalCritical, setSprintDays, setLearnMode, setDailyScrumAt, setEnclosureSize, setItemPos, splitEpic, createPbi, refinePbi, reorder, moveZoneOrder, moveBefore, setUserStories, pull, build, editBuild, addAnotherPbi, improve, open, deletePbi, duplicatePbi, assignDev, renameMember, closeDay, holdDailyScrum, skipDailyScrum, beginDay, nextSprint, loadGame, poRefine, setPathStyle, setPathRoute, addPath, deletePath, clearPaths, reset } = useZooGame();
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
  // The Work/Park tab lives here so the "place & open" event can switch to the Park view.
  const [parkTab, setParkTab] = useState<'work' | 'park'>('work');
  const placeAndOpen = (id: string) => { open(id); setParkTab('park'); };
  // Raising an improvement adds a new PBI to the Product Backlog - take the player back to the work
  // view so they can refine, estimate and pull it like any other item.
  const raiseImprovement = (id: string) => {
    const target = state.backlog.find((it) => it.id === id);
    improve(id);
    setParkTab('work');
    toast.success(target ? `Raised "Improve ${target.name.replace(/^Improve /, '')}" - refine and estimate it in the Backlog` : 'Improvement raised in the Backlog');
  };

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

  const shellProps = { parkTab, onSetTab: setParkTab, onPlaceItem: setItemPos, onSetPathStyle: setPathStyle, onSetPathRoute: setPathRoute, onAddPath: addPath, onDeletePath: deletePath, onClearPaths: clearPaths, onImprove: raiseImprovement, onEndDay: closeDay, onSetDod: setDod, onSetProductGoal: setGoal, onSave: requestSave, onOpenSaves: () => setSavesOpen(true), onPoRefine: handlePoRefine, poRefining: isRefining, poNote, onDismissPoNote: () => setPoNote(null) };

  const render = () => {
    switch (state.phase) {
      case 'intro':
        return <ZooIntro productGoal={state.productGoal} onSetGoal={setGoal} onStart={start} onOpenSaves={user ? () => setSavesOpen(true) : undefined} />;
      case 'refine':
        return <ZooShell state={state} {...shellProps}><RefineBacklog state={state} onEstimate={estimate} onAddPbi={createPbi} onRefinePbi={refinePbi} onReorder={reorder} onMoveZone={moveZoneOrder} onMoveBefore={moveBefore} onSetUseStories={setUserStories} onSplitEpic={splitEpic} onDeletePbi={deletePbi} onDuplicatePbi={duplicatePbi} onPlan={() => setPhase('planning')} /></ZooShell>;
      case 'planning':
        return <ZooShell state={state} {...shellProps}><SprintPlanning state={state} onPlan={plan} onEstimate={estimate} onSetTasks={setTasks} onToggleGoalCritical={toggleGoalCritical} onSetSprintDays={setSprintDays} onAddPbi={createPbi} onRefinePbi={refinePbi} onReorder={reorder} onMoveZone={moveZoneOrder} onMoveBefore={moveBefore} onSetUseStories={setUserStories} onSetSprintGoal={setSprintGoal} onTakeSignal={takeSignal} onSplitEpic={splitEpic} onDeletePbi={deletePbi} onDuplicatePbi={duplicatePbi} onNavigateStep={() => setPoNote(null)} /></ZooShell>;
      case 'sprint':
        return <ZooShell state={state} {...shellProps}><SprintBoard state={state} onBuild={build} onEditBuild={editBuild} onAddAnother={addAnotherPbi} onAddPbi={createPbi} onRefinePbi={refinePbi} onEstimate={estimate} onSetUseStories={setUserStories} onToggleTask={toggleTask} onStartItem={startItem} onSetEnclosure={setEnclosureSize} onSetLearnMode={setLearnMode} onSetScrumAt={setDailyScrumAt} onPull={pull} onOpen={placeAndOpen} onEndDay={closeDay} onHoldDailyScrum={holdDailyScrum} onSkipDailyScrum={skipDailyScrum} onStartDay={beginDay} onSplitEpic={splitEpic} onDeletePbi={deletePbi} onDuplicatePbi={duplicatePbi} onAssignDev={assignDev} onRenameMember={renameMember} /></ZooShell>;
      case 'review':
        return <ZooShell state={state} {...shellProps}><SprintReview state={state} onTakeSignal={takeSignal} onContinue={() => setPhase('retro')} /></ZooShell>;
      case 'retro':
        return <ZooShell state={state} {...shellProps}><SprintRetro state={state} onNextSprint={nextSprint} onSetDod={setDod} onWrapUp={() => setPhase('final')} /></ZooShell>;
      case 'final':
        return <ZooFinal state={state} onReset={reset} />;
      default:
        return <ZooShell state={state} {...shellProps}><SprintPlanning state={state} onPlan={plan} onEstimate={estimate} onSetTasks={setTasks} onToggleGoalCritical={toggleGoalCritical} onSetSprintDays={setSprintDays} onAddPbi={createPbi} onRefinePbi={refinePbi} onReorder={reorder} onMoveZone={moveZoneOrder} onMoveBefore={moveBefore} onSetUseStories={setUserStories} onSetSprintGoal={setSprintGoal} onTakeSignal={takeSignal} onSplitEpic={splitEpic} onDeletePbi={deletePbi} onDuplicatePbi={duplicatePbi} onNavigateStep={() => setPoNote(null)} /></ZooShell>;
    }
  };

  return (
    // Fixed viewport height so the game frame never scrolls - the shell scrolls internally.
    // The marketing footer is omitted here to reclaim the full screen for the game.
    <div className="flex h-dvh flex-col overflow-hidden">
      <GameTopBar />
      <main className="min-h-0 flex-1 overflow-hidden">{render()}</main>
      <SaveGameDialog open={saveOpen} onOpenChange={setSaveOpen} defaultName={saveName} isUpdate={!!saveId} saving={isSaving} onSave={handleSave} />
      <ZooSavedGamesDialog open={savesOpen} onOpenChange={setSavesOpen} onResume={handleResume} />
    </div>
  );
}
