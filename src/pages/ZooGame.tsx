import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useZooGame } from '@/components/zooGame/useZooGame';
import type { ZooGameApi } from '@/components/zooGame/zooActions';
import type { SeatName } from '@/components/zooGame/useZooSessions';
import { standingOnPark, parkPositions, restingPlace, groundSize } from '@/components/zooGame/parkModel';
import { copyOffset, inHandItem } from '@/components/zooGame/engine';
import { insidePark } from '@/components/zooGame/parkLayout';
import { useZooGameSaves } from '@/components/zooGame/useZooGameSaves';
import { useZooProductOwner } from '@/components/zooGame/useZooProductOwner';
import { useAuth } from '@/contexts/AuthContext';
import { ZooIntro } from '@/components/zooGame/ZooIntro';
import { RefineBacklog } from '@/components/zooGame/RefineBacklog';
import { BacklogWizard } from '@/components/zooGame/BacklogWizard';
import { SprintPlanning } from '@/components/zooGame/SprintPlanning';
import { SprintBoard } from '@/components/zooGame/SprintBoard';
import { SprintReview } from '@/components/zooGame/SprintReview';
import { SprintRetro } from '@/components/zooGame/SprintRetro';
import { ZooFinal } from '@/components/zooGame/ZooFinal';
import { ZooShell, type ArtifactTab } from '@/components/zooGame/ZooShell';
import { BacklogTab } from '@/components/zooGame/BacklogBench';
import { GameLinks } from '@/components/zooGame/GameLinks';
import { ZooSavedGamesDialog } from '@/components/zooGame/ZooSavedGamesDialog';
import { Celebration } from '@/components/zooGame/Celebration';
import { SaveGameDialog } from '@/components/flowGame/SaveGameDialog';
import type { ZooGameState, PbiDraft } from '@/components/zooGame/types';
import { pathWidthPx, isDeployAcceptance, presetFor, type ItemDesign } from '@/components/zooGame/design';
import { ScrumOnePager } from '@/components/zooGame/ScrumTeaching';
import { CARDS_BY_PHASE } from '@/components/zooGame/scrumContent';
import { useZooCopy } from '@/components/zooGame/useZooCopy';

/** Build A Zoo: the Scrum loop skinned as building a zoo, with a real customer at
 *  the Review (the visitor simulation). intro -> planning -> sprint -> review ->
 *  retro -> next Sprint. Games can be saved and resumed (signed-in players). */
/** The zoo, drawn. It takes the game it is playing rather than reaching for a hook, so the
 *  same screens serve a game played alone and a game played by a team - the only difference
 *  being which carrier the actions were built around. `saves` is off in a shared session,
 *  where the session itself is the save and a private copy would be a fork of it. */
export function ZooGameScreens({ game, saves = true, seat = null, observer, covering, mustAgree = [], said, onDismissSaid, refused, onDismissRefused }:
  { game: ZooGameApi; saves?: boolean; seat?: SeatName | null; observer?: boolean; covering?: SeatName[]; mustAgree?: string[]; said?: { id: number; seat: string; says: string; also: number }[]; onDismissSaid?: (id: number) => void; refused?: string | null; onDismissRefused?: () => void }) {
  const { state, start, setPhase, setGoal, setSprintGoal, setPlanningTopic, answerPlacement, setSprintBet, setDod, setDor, takeSignal, plan, setForecast, agreeSprintGoal, holdRefinement, agreeDod, writeBacklog, setGoalShape, planShape, startHere, estimate, setTasks, toggleTask, confirmAc, saveDraftDesign, placeOnPark, startItem, toggleGoalCritical, setSprintDays, setLearnMode, setWipLimit, setTeaching, markTaught, setDailyScrumAt, setEnclosureSize, setItemPos, setItemSpot, setMemberSpot, setItemSize, setItemRot, addCopy, setCopyPiece, moveCopy, removeCopy, nestItem, unnestItem, renameItem, splitEpic, createPbi, declineProposal, refinePbi, reorder, reorderSprint, reorderForecast, moveZoneOrder, moveBefore, setUserStories, pull, dropFromSprint, build, editBuild, addAnotherPbi, improve, open, deletePbi, duplicatePbi, assignDev, renameMember, closeDay, cancelSprint, holdDailyScrum, skipDailyScrum, beginDay, nextSprint, loadGame, poRefine, setPathStyle, addConnector, updateConnector, deleteConnector, reset } = game;
  const { user } = useAuth();
  const { saveGame, isSaving } = useZooGameSaves();
  const { refine: poRefineCall, isRefining } = useZooProductOwner();

  // Save/resume orchestration. saveId tracks the row this game maps to, so a second
  // save updates rather than duplicates; saveName seeds the name field.
  const [saveId, setSaveId] = useState<string | null>(null);
  const [saveName, setSaveName] = useState('');
  const [saveOpen, setSaveOpen] = useState(false);
  const [savesOpen, setSavesOpen] = useState(false);
  // The PO's note describes the refinement they have just done, so it belongs to the phase you
  // asked them in. Remembering that phase means it stops showing when you move on, rather than
  // following you into Planning as though it were about the Sprint.
  const [poNote, setPoNote] = useState<{ phase: string; text: string } | null>(null);
  // Bumped on each delivery (Deploy Complete) to fire a confetti burst - a celebration of the
  // shippable increment reaching visitors.
  const [celebrate, setCelebrate] = useState(0);
  const [onePager, setOnePager] = useState(true); // shown once per visit, before the intro
  const [onePagerSeen, setOnePagerSeen] = useState(false); // ...and re-openable from the intro

  // The id of the just-delivered feature, so the park can pop it in. Cleared shortly after.
  // Viewport point the delivery confetti bursts from - the card as it lands in Done.
  const [celebrateOrigin, setCelebrateOrigin] = useState<{ x: number; y: number } | null>(null);
  // The Work/Park tab lives here so the "place & open" event can switch to the Park view.
  // Plan or Build for the Sprint Backlog tab. Here rather than inside the board, because the park
  // belongs in the Build state and the shell is what owns the park.
  const [buildMode, setBuildMode] = useState<'plan' | 'build'>('plan');
  const [parkTab, setParkTab] = useState<ArtifactTab>('sprint');
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
  const endDay = () => { closeDay(); setParkTab('sprint'); };

  // Nothing here closes the board. Doing it automatically meant pressing Start swept the board away
  // before you could see the card change column - and watching work move across the board is most of
  // what a board is for. It opens and closes when you say so.
  const selectOnPark = (id: string | null) => { setBuildingId(id); setDrawing(false); };

  // Designing in place. The toolbar above the selected item on the park hands every change straight
  // back here, so the park is not showing a copy of the design - it IS the design. A build in
  // progress saves as a draft (it survives the day ending); an already-built item is edited outright.
  const edit = {
    onRename: renameItem,
    onDesign: (id: string, design: ItemDesign) => {
      const it = state.backlog.find((x) => x.id === id);
      if (it?.status === 'committed') saveDraftDesign(id, design); else editBuild(id, design);
    },
    onSetEnclosure: setEnclosureSize,
    onToggleTask: toggleTask,
    onConfirmAc: confirmAc,
    // Moving a card to Done is the whole ending: it was built where it stands, so there is nothing
    // to place, and Done means open. The Developers make that move when the plan and the criteria
    // are ticked - it is not a button on the thing they are painting.
    onFinishBuild: (id: string) => {
      const it = state.backlog.find((x) => x.id === id);
      if (it?.status !== 'committed') return;
      build(id, it.draftDesign ?? presetFor(it));
      placeOnPark(id);
      deployComplete(id);
      setBuildingId(null);
    },
    onRelease: (id: string) => { deployComplete(id); setBuildingId(null); },
    // Inspect and adapt: pick the item out and turn the park to the Increment, so what is judged
    // against the acceptance criteria is the thing that was built rather than the drawing of it.
    onInspect: (id: string) => { setBuildingId(id); setParkTab('increment'); },
    // Something of the same kind you have already built, to start from rather than begin again.
    // Where the new plant goes. The studio has no park to point at, so it asks the one place that
    // knows where a thing stands - the same answer both views draw from - and stands the plant
    // beside it. From that moment it is its own tree at its own place: click Oak and get an oak,
    // click Pine and get a pine, and moving one moves only that one.
    onAddPlant: (id: string, piece?: string) => {
      const item = state.backlog.find((i) => i.id === id);
      if (!item) return;
      const standing = standingOnPark(state);
      const auto = parkPositions(standing);
      const here = restingPlace(item, groundSize(item), auto);
      const off = copyOffset((item.copies ?? []).length);
      addCopy(id, insidePark({ w: 24, h: 24 }, { x: here.x + off.dx, y: here.y + off.dy }), piece);
    },
    onSetPlantPiece: setCopyPiece,
    onRemovePlant: removeCopy,
    copySources: (item: { id: string; category: string }) => state.backlog
      .filter((x) => x.id !== item.id && x.category === item.category && x.design)
      .map((x) => ({ id: x.id, name: x.name, design: x.design! })),
  };
  const enterDeploy = (id: string) => {
    const it = state.backlog.find((x) => x.id === id);
    // An improvement re-delivers its target; deploy against the target's name.
    const shownId = it?.enhancesId ?? id;
    const shown = state.backlog.find((x) => x.id === shownId);
    setParkTab('increment');
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
    setParkTab('sprint');
    // Celebrate the delivery: this increment is now live to visitors. Burst the confetti from the
    // card once it has landed in the Done column (measured after the re-render).
    toast.success(`🎉 ${name} is live to visitors!`);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = document.querySelector(`[data-done-card="${shownId}"]`);
      const r = el?.getBoundingClientRect();
      // Burst from the card - but only if the card is somewhere you can see. The board scrolls
      // inside its own half now and the design bench covers the foot of it, so a delivered card can
      // easily be out of view or behind the bench: aiming the confetti at it then threw the whole
      // burst off-screen, and a celebration nobody sees is the same as no celebration.
      const m = 60;
      const onScreen = r && r.bottom > m && r.top < window.innerHeight - m && r.right > m && r.left < window.innerWidth - m;
      setCelebrateOrigin(onScreen ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null);
      setCelebrate((c) => c + 1);
    }));
  };
  // Raising an improvement adds a new PBI to the Product Backlog - take the player back to the work
  // view so they can refine, estimate and pull it like any other item. If one is already queued, say so.
  const raiseImprovement = (id: string) => {
    const target = state.backlog.find((it) => it.id === id);
    setParkTab('sprint');
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
  // The Product Owner's look-ahead, accepted. It goes into the Backlog unsized, like anything the
  // Product Owner writes - refining and sizing it is still the Scrum Team's, not a gift from the
  // suggestion. And it says so on screen, because a Backlog that grows quietly teaches nothing.
  const handleProposal = (draft: PbiDraft) => {
    createPbi(draft);
    toast.success(`Added "${draft.name}" to the Product Backlog - refine and size it when you are ready`);
  };

  const handlePoRefine = async () => {
    if (!user) { toast.error('Sign in to hold an AI refinement session.'); return; }
    try {
      const decisions = await poRefineCall(state);
      poRefine(decisions);
      setPoNote({ phase: state.phase, text: decisions.rationale?.trim() || 'The Scrum Team refined the Product Backlog.' });
      toast.success('The Scrum Team refined the Product Backlog');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'The refinement session could not run.');
    }
  };

  // The deploy-time acceptance criteria (sizing/placement) of the item being deployed, with their
  // confirmed state - shown on the park so you accept placement once it is actually placed & sized.
  const deployItem = deployId ? state.backlog.find((x) => x.id === deployId) : undefined;
  // ALL of the item's acceptance criteria, not just the placement one. Showing one criterion under
  // the heading "Acceptance criteria" read as though that was the whole set, and a lion has four.
  // The ones already accepted in the build come too, ticked and out of reach - the picture is only
  // honest if you can see what has been accepted as well as what is left.
  const deployAcs = deployItem
    ? deployItem.acceptance.map((label, index) => ({
      index, label, confirmed: !!deployItem.acConfirmed?.[index], placement: isDeployAcceptance(label),
    }))
    : [];

  // Sprint Planning shows its teaching inside the "?" beside the question rather than as a card on
  // the page, so the shell must not also render it - the whole point is that nothing is said twice.
  // Saved teaching copy, laid over the defaults before anything renders - no flash of old wording,
  // and no game at all until we know which words to use.
  // Which item's build is open. Shared between the board and the park: tapping a construction site
  // opens it, and the site shows as selected while it is.
  const [buildingId, setBuildingId] = useState<string | null>(null);
  // Which drawing the park is showing. Held here because Inspect, down on the bench, has to move it.
  // The park opens as the zoo a visitor would see, not as the drawing of it. The blueprint stays
  // reachable only because a route is still drawn on it by hand.
  // Which part of the selected thing is picked out - 'ground', 'fence', 'water', 'flora:2'. It has
  // to live up here now that the controls are in the bench and the thing is on the park: touching
  // the ground out there is what opens the ground's swatches over here, and neither half can own a
  // conversation between the two.
  const [partFocus, setPartFocus] = useState<{ id: string; key: string } | null>(null);
  // The pen, for laying a pathway's route. Up here because the button that picks it up is on the
  // design bench and the park is where it draws.
  const [drawing, setDrawing] = useState(false);

  const zooCopy = useZooCopy();
  // What has been edited in this session, laid over what was loaded - derived rather than mirrored
  // into state, so there is no effect chasing an effect.
  const [copyEdits, setCopyEdits] = useState<Record<string, string>>({});
  const copyProps = {
    overrides: (() => {
      const m = { ...zooCopy.overrides };
      for (const [k, v] of Object.entries(copyEdits)) { if (v) m[k] = v; else delete m[k]; }
      return m;
    })(),
    onChanged: (key: string, value: string) => setCopyEdits((e) => ({ ...e, [key]: value })),
  };

  const cardFor = (phase: string) => ((state.teaching ?? true)
    ? (CARDS_BY_PHASE[phase] ?? []).find((id) => !(state.taught ?? []).includes(id)) ?? null
    : null);

  // A pathway is laid out by drawing it, so while one is on the design bench the park hands you the
  // pen - at the width and colour it was designed at. It used to be drawn as a small building with
  // its name under it, sitting in a spot, which is not what a path is.
  const benchItem = state.backlog.find((i) => i.id === buildingId);
  const benchPath = benchItem?.category === 'path' && benchItem.status === 'committed' ? benchItem : undefined;
  const benchPathDesign = benchPath ? benchPath.design ?? benchPath.draftDesign ?? presetFor(benchPath) : undefined;
  const drawRoute = benchPath && benchPathDesign
    ? { id: benchPath.id, name: benchPath.name, style: { thickness: pathWidthPx(benchPathDesign.parts.thickness), color: benchPathDesign.colors.path ?? '#c9a86a' } }
    : null;

  // The Product Backlog tab is a bench, not a glance: refinement is ongoing work, so it has to be
  // possible while a Sprint runs - and cost the day's build time when it is. Refinement is the
  // screen on that tab before the first Sprint, so the bench takes over from there on.
  const backlogTab = (
    <BacklogTab state={state} onEstimate={estimate} onAddPbi={createPbi} onRefinePbi={refinePbi}
      onReorder={reorder} onMoveZone={moveZoneOrder} onMoveBefore={moveBefore} onSetUseStories={setUserStories}
      onSplitEpic={splitEpic} onDeletePbi={deletePbi} onDuplicatePbi={duplicatePbi}
      onPull={state.phase === 'sprint' ? pull : undefined} />
  );

  const shellProps = { backlogTab, seat, observer, covering, said, onDismissSaid, refused, onDismissRefused, copy: copyProps, buildMode, onSetBuildMode: setBuildMode, canBuild: !!inHandItem(state, buildingId), links: <GameLinks />, menuLinks: <GameLinks variant="menu" />, drawRoute, drawing, onDrawing: setDrawing, building: buildingId, onOpenBuild: selectOnPark, edit, onPart: setPartFocus, onStartHere: startHere, parkTab, onSetTab: setParkTab, onPlaceItem: setItemPos, onSetPathStyle: setPathStyle, onAddConnector: addConnector, onUpdateConnector: updateConnector, onDeleteConnector: deleteConnector, deployMode: deploying, deployStyle, deployAcs, onFinishDeploy: () => { setParkTab('sprint'); clearDeploy(); }, onImprove: raiseImprovement, onSetSpot: setItemSpot, onSetMemberSpot: setMemberSpot, onSetSize: setItemSize, onSetRot: setItemRot, onMoveCopy: moveCopy, onRemoveCopy: removeCopy, onNest: nestItem, onUnnest: unnestItem, onEndDay: endDay, onSetDod: setDod, onSetDor: setDor, onSetProductGoal: setGoal, onSave: saves ? requestSave : undefined, onOpenSaves: saves ? () => setSavesOpen(true) : undefined, onPoRefine: handlePoRefine, poRefining: isRefining, poNote: poNote?.phase === state.phase ? poNote.text : null, onDismissPoNote: () => setPoNote(null), onSetTeaching: setTeaching, onMarkTaught: markTaught, onBack: (phase: string) => setPhase(phase as typeof state.phase),
    // The Coach is gone. It floated advice over whatever you were doing - often about refinement,
    // often at the wrong moment, twice over the button you needed. Every lesson it carried belongs
    // in the flow, at the moment it applies, as part of the screen that applies it. What survives
    // of it lives on the screens themselves: the readiness figures at Refinement, the WIP note in
    // the Doing column, the arithmetic at the Daily Scrum, the evidence at the Done gate.
  };

  const render = () => {
    switch (state.phase) {
      case 'intro':
        // One page of Scrum before anything is built, unless the teaching is off (a learner who has
        // just had the taught session, or who has turned it off already).
        if (onePager && (state.teaching ?? true)) {
          return <ScrumOnePager onDone={() => setOnePager(false)} onSkipTeaching={() => { setTeaching(false); setOnePager(false); }}
            onBack={onePagerSeen ? () => setOnePager(false) : undefined} copy={copyProps} />;
        }
        return <ZooIntro productGoal={state.productGoal} goalShape={state.productGoalShape} goalMeasures={state.productGoalMeasures} onSetGoalShape={setGoalShape} onSetGoal={setGoal} onStart={start}
          teachCard={(state.teaching ?? true) ? (CARDS_BY_PHASE.intro ?? []).find((id) => !(state.taught ?? []).includes(id)) : null}
          onMarkTaught={markTaught}
          onBack={(state.teaching ?? true) ? () => { setOnePagerSeen(true); setOnePager(true); } : undefined}
          onOpenSaves={saves && user ? () => setSavesOpen(true) : undefined} copy={copyProps} />;
      case 'brief':
        // No shell: there is nothing to put in a header yet - no Sprint, no Backlog, no park.
        return <div className="h-full overflow-y-auto px-4 py-5"><BacklogWizard productGoal={state.productGoal} onBuild={writeBacklog} /></div>;
      case 'refine':
        return <ZooShell state={state} {...shellProps}><RefineBacklog state={state} onSetSprintDays={setSprintDays} onSetDod={setDod} onAgreeDod={agreeDod} onEstimate={estimate} onAddPbi={createPbi} onRefinePbi={refinePbi} onReorder={reorder} onMoveZone={moveZoneOrder} onMoveBefore={moveBefore} onSetUseStories={setUserStories} onSplitEpic={splitEpic} onDeletePbi={deletePbi} onDuplicatePbi={duplicatePbi} onPlan={() => setPhase('planning')} teachCard={cardFor('refine')} onMarkTaught={markTaught} /></ZooShell>;
      case 'planning':
        return <ZooShell state={state} {...shellProps}><SprintPlanning state={state} onPlan={plan} onSetForecast={setForecast} mustAgree={mustAgree} mySeat={seat} onAgreeSprintGoal={agreeSprintGoal} onEstimate={estimate} onSetTasks={setTasks} onPlanShape={planShape} onToggleGoalCritical={toggleGoalCritical} onReorderForecast={reorderForecast} onRefine={() => setPhase('refine')} onSetSprintGoal={setSprintGoal} onTakeSignal={takeSignal} onSplitEpic={splitEpic} onNavigateStep={() => setPoNote(null)} onSetTopic={setPlanningTopic} onSetBet={setSprintBet} teachCard={cardFor('planning')} onMarkTaught={markTaught} /></ZooShell>;
      case 'sprint':
        return <ZooShell state={state} {...shellProps}><SprintBoard state={state} onAddAnother={addAnotherPbi} onEstimate={estimate} onToggleTask={toggleTask} onConfirmAc={confirmAc} onFinishItem={edit.onFinishBuild} onStartItem={startItem} onCancelSprint={cancelSprint} onReorderSprint={reorderSprint} onSetLearnMode={setLearnMode} onSetWipLimit={setWipLimit} onSetScrumAt={setDailyScrumAt} onPull={pull} onDropFromSprint={dropFromSprint} mode={buildMode} onAnswerPlacement={answerPlacement} onOpen={deployComplete} onPlaceOnPark={placeOnParkAndEnter} onEndDay={endDay} onHoldDailyScrum={holdDailyScrum} onSkipDailyScrum={skipDailyScrum} onStartDay={beginDay} onHoldRefinement={holdRefinement} onSplitEpic={splitEpic} building={buildingId} edit={edit} part={partFocus} onPart={setPartFocus} drawing={drawing} onDrawing={setDrawing} onRemoveRun={deleteConnector} onAddPbi={createPbi} onSetUserStories={setUserStories} onAddProposal={handleProposal} onDeclineProposal={declineProposal} onAssignDev={assignDev} onRenameMember={renameMember} onBuilding={selectOnPark} teachCard={cardFor('sprint')} onMarkTaught={markTaught} /></ZooShell>;
      case 'review':
        return <ZooShell state={state} {...shellProps}><SprintReview state={state} onTakeSignal={takeSignal} onContinue={() => setPhase('retro')} onWrapUp={() => setPhase('final')} onOpen={open} onConfirmAc={confirmAc} onToggleTask={toggleTask} teachCard={cardFor('review')} onMarkTaught={markTaught} /></ZooShell>;
      case 'retro':
        return <ZooShell state={state} {...shellProps}><SprintRetro state={state} onNextSprint={nextSprint} onSetDod={setDod} onSetSprintDays={setSprintDays} teachCard={cardFor('retro')} onMarkTaught={markTaught} /></ZooShell>;
      case 'final':
        return <ZooFinal state={state} onReset={reset} />;
      default:
        return <ZooShell state={state} {...shellProps}><SprintPlanning state={state} onPlan={plan} onSetForecast={setForecast} mustAgree={mustAgree} mySeat={seat} onAgreeSprintGoal={agreeSprintGoal} onEstimate={estimate} onSetTasks={setTasks} onPlanShape={planShape} onToggleGoalCritical={toggleGoalCritical} onReorderForecast={reorderForecast} onRefine={() => setPhase('refine')} onSetSprintGoal={setSprintGoal} onTakeSignal={takeSignal} onSplitEpic={splitEpic} onNavigateStep={() => setPoNote(null)} onSetTopic={setPlanningTopic} onSetBet={setSprintBet} teachCard={cardFor('planning')} onMarkTaught={markTaught} /></ZooShell>;
    }
  };

  return (
    // Fixed viewport height so the game frame never scrolls - the shell scrolls internally.
    // The marketing footer is omitted here to reclaim the full screen for the game.
    <div className="flex h-dvh flex-col overflow-hidden">
      {/* Hold the game for the one query that decides which words it uses. A blank half-second
          beats a visible flash of superseded wording in front of a class. */}
      <main className="min-h-0 flex-1 overflow-hidden">{zooCopy.ready ? render() : null}</main>
      {saves && <SaveGameDialog open={saveOpen} onOpenChange={setSaveOpen} defaultName={saveName} isUpdate={!!saveId} saving={isSaving} onSave={handleSave} />}
      {saves && <ZooSavedGamesDialog open={savesOpen} onOpenChange={setSavesOpen} onResume={handleResume} />}
      <Celebration trigger={celebrate} origin={celebrateOrigin} />
    </div>
  );
}

/** Played alone: the same screens, with the reducer as the carrier. */
export default function ZooGame() {
  return <ZooGameScreens game={useZooGame()} />;
}
