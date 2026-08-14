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
import { Celebration } from '@/components/zooGame/Celebration';
import { SaveGameDialog } from '@/components/flowGame/SaveGameDialog';
import type { ZooGameState } from '@/components/zooGame/types';
import { pathWidthPx, isDeployAcceptance } from '@/components/zooGame/design';
import { nextNudge } from '@/components/zooGame/engine';

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
  const { state, start, setPhase, setGoal, setSprintGoal, setDod, setDor, takeSignal, plan, estimate, setTasks, toggleTask, confirmAc, saveDraftDesign, placeOnPark, startItem, toggleGoalCritical, setSprintDays, setLearnMode, setDailyScrumAt, setEnclosureSize, setItemPos, setItemSpot, setItemSize, setItemRot, nestItem, unnestItem, renameItem, splitEpic, createPbi, refinePbi, reorder, reorderSprint, reorderForecast, moveZoneOrder, moveBefore, setUserStories, pull, build, editBuild, addAnotherPbi, improve, open, deletePbi, duplicatePbi, assignDev, renameMember, closeDay, holdDailyScrum, skipDailyScrum, beginDay, nextSprint, loadGame, poRefine, setPathStyle, addConnector, updateConnector, deleteConnector, reset } = useZooGame();
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
  // Bumped on each delivery (Deploy Complete) to fire a confetti burst - a celebration of the
  // shippable increment reaching visitors.
  const [celebrate, setCelebrate] = useState(0);
  // The coach's nudges: one at a time, and any the player waves away stays away for the session.
  const [hushed, setHushed] = useState<Set<string>>(new Set());
  // The id of the just-delivered feature, so the park can pop it in. Cleared shortly after.
  const [justOpened, setJustOpened] = useState<string | null>(null);
  // Viewport point the delivery confetti bursts from - the card as it lands in Done.
  const [celebrateOrigin, setCelebrateOrigin] = useState<{ x: number; y: number } | null>(null);
  // The Work/Park tab lives here so the "place & open" event can switch to the Park view.
  const [parkTab, setParkTab] = useState<'work' | 'park'>('work');
  // Deploying an item: placing it AND laying the paths that link it in. Holds the item name for the
  // banner; while set, the park's Connect tool is available. Cleared by "Finish deploying".
  const [deploying, setDeploying] = useState<string | null>(null);
  // The id of the item being deployed, so its deploy-time acceptance criteria (sizing/placement) can
  // be shown and confirmed on the park while you place & size it.
  const [deployId, setDeployId] = useState<string | null>(null);
  // When deploying a Pathway, the Connect tool lays connectors at the width and colour designed for it.
  const [deployStyle, setDeployStyle] = useState<{ thickness: number; color: string } | null>(null);
  // Ending a day (clock ran out or "End Day") moves to the Daily Scrum or the Sprint Review, which
  // live in the work pane - so focus it, or the transition is invisible when you're on the Park tab.
  const endDay = () => { closeDay(); setParkTab('work'); };
  const enterDeploy = (id: string) => {
    const it = state.backlog.find((x) => x.id === id);
    // An improvement re-delivers its target; deploy against the target's name.
    const shownId = it?.enhancesId ?? id;
    const shown = state.backlog.find((x) => x.id === shownId);
    setParkTab('park');
    setDeploying(shown?.name ?? it?.name ?? 'this item');
    setDeployId(id);
    setDeployStyle(it?.category === 'path' ? { thickness: pathWidthPx(it.design?.parts.thickness), color: it.design?.colors.path ?? '#c9a86a' } : null);
  };
  const clearDeploy = () => { setDeploying(null); setDeployId(null); setDeployStyle(null); };
  // "Place on the park" (items with placement acceptance): put it on the park to position, size and
  // confirm its criteria - it stays in Deploy until "Deploy complete".
  const placeOnParkAndEnter = (id: string) => { placeOnPark(id); enterDeploy(id); };
  // "Deploy complete": release the item to visitors (moves the card to Done). It was already placed
  // & sized on the park, so just release it and stay on the board where the card lands in Done.
  const deployComplete = (id: string) => {
    const it = state.backlog.find((x) => x.id === id);
    const shownId = it?.enhancesId ?? id;
    const name = state.backlog.find((x) => x.id === shownId)?.name ?? it?.name ?? 'It';
    open(id);
    clearDeploy();
    setParkTab('work');
    // Celebrate the delivery: this increment is now live to visitors. Burst the confetti from the
    // card once it has landed in the Done column (measured after the re-render).
    setJustOpened(shownId);
    window.setTimeout(() => setJustOpened((cur) => (cur === shownId ? null : cur)), 900);
    toast.success(`🎉 ${name} is live to visitors!`);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = document.querySelector(`[data-done-card="${shownId}"]`);
      const r = el?.getBoundingClientRect();
      setCelebrateOrigin(r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null);
      setCelebrate((c) => c + 1);
    }));
  };
  // Raising an improvement adds a new PBI to the Product Backlog - take the player back to the work
  // view so they can refine, estimate and pull it like any other item. If one is already queued, say so.
  const raiseImprovement = (id: string) => {
    const target = state.backlog.find((it) => it.id === id);
    setParkTab('work');
    if (state.backlog.some((it) => it.enhancesId === id && it.status !== 'open')) {
      toast.info(`An improvement for "${target?.name ?? 'this item'}" is already in the Backlog`);
      return;
    }
    improve(id);
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

  // The deploy-time acceptance criteria (sizing/placement) of the item being deployed, with their
  // confirmed state - shown on the park so you accept placement once it is actually placed & sized.
  const deployItem = deployId ? state.backlog.find((x) => x.id === deployId) : undefined;
  const deployAcs = deployItem
    ? deployItem.acceptance.map((label, index) => ({ index, label, confirmed: !!deployItem.acConfirmed?.[index] })).filter((a) => isDeployAcceptance(a.label))
    : [];

  const shellProps = { parkTab, onSetTab: setParkTab, onPlaceItem: setItemPos, onSetPathStyle: setPathStyle, onAddConnector: addConnector, onUpdateConnector: updateConnector, onDeleteConnector: deleteConnector, deployMode: deploying, deployStyle, deployAcs, onConfirmDeployAc: (index: number, value: boolean) => { if (deployId) confirmAc(deployId, index, value); }, onFinishDeploy: () => { setParkTab('work'); clearDeploy(); }, justOpened, onImprove: raiseImprovement, onSetSpot: setItemSpot, onSetSize: setItemSize, onSetRot: setItemRot, onNest: nestItem, onUnnest: unnestItem, onRename: renameItem, onEndDay: endDay, onSetDod: setDod, onSetDor: setDor, onSetProductGoal: setGoal, onSave: requestSave, onOpenSaves: () => setSavesOpen(true), onPoRefine: handlePoRefine, poRefining: isRefining, poNote, onDismissPoNote: () => setPoNote(null),
    nudge: nextNudge(state, hushed), onDismissNudge: (id: string) => setHushed((h) => new Set(h).add(id)) };

  const render = () => {
    switch (state.phase) {
      case 'intro':
        return <ZooIntro productGoal={state.productGoal} onSetGoal={setGoal} onStart={start} onOpenSaves={user ? () => setSavesOpen(true) : undefined} />;
      case 'refine':
        return <ZooShell state={state} {...shellProps}><RefineBacklog state={state} onEstimate={estimate} onAddPbi={createPbi} onRefinePbi={refinePbi} onReorder={reorder} onMoveZone={moveZoneOrder} onMoveBefore={moveBefore} onSetUseStories={setUserStories} onSplitEpic={splitEpic} onDeletePbi={deletePbi} onDuplicatePbi={duplicatePbi} onPlan={() => setPhase('planning')} /></ZooShell>;
      case 'planning':
        return <ZooShell state={state} {...shellProps}><SprintPlanning state={state} onPlan={plan} onEstimate={estimate} onSetTasks={setTasks} onToggleGoalCritical={toggleGoalCritical} onSetSprintDays={setSprintDays} onAddPbi={createPbi} onRefinePbi={refinePbi} onReorder={reorder} onReorderForecast={reorderForecast} onRefine={() => setPhase('refine')} onMoveZone={moveZoneOrder} onMoveBefore={moveBefore} onSetUseStories={setUserStories} onSetSprintGoal={setSprintGoal} onTakeSignal={takeSignal} onSplitEpic={splitEpic} onDeletePbi={deletePbi} onDuplicatePbi={duplicatePbi} onNavigateStep={() => setPoNote(null)} /></ZooShell>;
      case 'sprint':
        return <ZooShell state={state} {...shellProps}><SprintBoard state={state} onBuild={build} onDraftChange={saveDraftDesign} onEditBuild={editBuild} onAddAnother={addAnotherPbi} onAddPbi={createPbi} onRefinePbi={refinePbi} onEstimate={estimate} onSetUseStories={setUserStories} onToggleTask={toggleTask} onStartItem={startItem} onReorderSprint={reorderSprint} onSetEnclosure={setEnclosureSize} onSetLearnMode={setLearnMode} onSetScrumAt={setDailyScrumAt} onPull={pull} onOpen={deployComplete} onPlaceOnPark={placeOnParkAndEnter} onEndDay={endDay} onHoldDailyScrum={holdDailyScrum} onSkipDailyScrum={skipDailyScrum} onStartDay={beginDay} onSplitEpic={splitEpic} onDeletePbi={deletePbi} onDuplicatePbi={duplicatePbi} onAssignDev={assignDev} onRenameMember={renameMember} /></ZooShell>;
      case 'review':
        return <ZooShell state={state} {...shellProps}><SprintReview state={state} onTakeSignal={takeSignal} onContinue={() => setPhase('retro')} onWrapUp={() => setPhase('final')} /></ZooShell>;
      case 'retro':
        return <ZooShell state={state} {...shellProps}><SprintRetro state={state} onNextSprint={nextSprint} onSetDod={setDod} /></ZooShell>;
      case 'final':
        return <ZooFinal state={state} onReset={reset} />;
      default:
        return <ZooShell state={state} {...shellProps}><SprintPlanning state={state} onPlan={plan} onEstimate={estimate} onSetTasks={setTasks} onToggleGoalCritical={toggleGoalCritical} onSetSprintDays={setSprintDays} onAddPbi={createPbi} onRefinePbi={refinePbi} onReorder={reorder} onReorderForecast={reorderForecast} onRefine={() => setPhase('refine')} onMoveZone={moveZoneOrder} onMoveBefore={moveBefore} onSetUseStories={setUserStories} onSetSprintGoal={setSprintGoal} onTakeSignal={takeSignal} onSplitEpic={splitEpic} onDeletePbi={deletePbi} onDuplicatePbi={duplicatePbi} onNavigateStep={() => setPoNote(null)} /></ZooShell>;
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
      <Celebration trigger={celebrate} origin={celebrateOrigin} />
    </div>
  );
}
