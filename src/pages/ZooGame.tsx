import { useEffect } from 'react';
import { useZooGame } from '@/components/zooGame/useZooGame';
import { ZooIntro } from '@/components/zooGame/ZooIntro';
import { RefineBacklog } from '@/components/zooGame/RefineBacklog';
import { SprintPlanning } from '@/components/zooGame/SprintPlanning';
import { SprintBoard } from '@/components/zooGame/SprintBoard';
import { SprintReview } from '@/components/zooGame/SprintReview';
import { SprintRetro } from '@/components/zooGame/SprintRetro';
import { ZooFinal } from '@/components/zooGame/ZooFinal';
import { ZooShell } from '@/components/zooGame/ZooShell';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

/** Build A Zoo: the Scrum loop skinned as building a zoo, with a real customer at
 *  the Review (the visitor simulation). intro -> planning -> sprint -> review ->
 *  retro -> next Sprint. */
export default function ZooGame() {
  const { state, start, setPhase, setGoal, setSprintGoal, setDod, takeSignal, plan, estimate, setTasks, toggleTask, startItem, toggleGoalCritical, setSprintDays, setLearnMode, setEnclosureSize, createPbi, refinePbi, reorder, moveBefore, setUserStories, pull, build, editBuild, addAnotherPbi, open, closeDay, holdDailyScrum, skipDailyScrum, beginDay, nextSprint, reset } = useZooGame();

  // Each phase is its own screen; start it at the top.
  useEffect(() => { window.scrollTo(0, 0); }, [state.phase]);

  const render = () => {
    switch (state.phase) {
      case 'intro':
        return <ZooIntro productGoal={state.productGoal} onSetGoal={setGoal} onStart={start} />;
      case 'refine':
        return <ZooShell state={state}><RefineBacklog state={state} onEstimate={estimate} onAddPbi={createPbi} onRefinePbi={refinePbi} onReorder={reorder} onMoveBefore={moveBefore} onSetUseStories={setUserStories} onPlan={() => setPhase('planning')} /></ZooShell>;
      case 'planning':
        return <ZooShell state={state}><SprintPlanning state={state} onPlan={plan} onEstimate={estimate} onSetTasks={setTasks} onToggleGoalCritical={toggleGoalCritical} onSetSprintDays={setSprintDays} onAddPbi={createPbi} onRefinePbi={refinePbi} onReorder={reorder} onMoveBefore={moveBefore} onSetUseStories={setUserStories} onSetSprintGoal={setSprintGoal} onTakeSignal={takeSignal} /></ZooShell>;
      case 'sprint':
        return <ZooShell state={state}><SprintBoard state={state} onBuild={build} onEditBuild={editBuild} onAddAnother={addAnotherPbi} onAddPbi={createPbi} onRefinePbi={refinePbi} onSetUseStories={setUserStories} onToggleTask={toggleTask} onStartItem={startItem} onSetEnclosure={setEnclosureSize} onSetLearnMode={setLearnMode} onPull={pull} onOpen={open} onEndDay={closeDay} onHoldDailyScrum={holdDailyScrum} onSkipDailyScrum={skipDailyScrum} onStartDay={beginDay} /></ZooShell>;
      case 'review':
        return <ZooShell state={state}><SprintReview state={state} onTakeSignal={takeSignal} onContinue={() => setPhase('retro')} /></ZooShell>;
      case 'retro':
        return <ZooShell state={state}><SprintRetro state={state} onNextSprint={nextSprint} onSetDod={setDod} onWrapUp={() => setPhase('final')} /></ZooShell>;
      case 'final':
        return <ZooFinal state={state} onReset={reset} />;
      default:
        return <ZooShell state={state}><SprintPlanning state={state} onPlan={plan} onEstimate={estimate} onSetTasks={setTasks} onToggleGoalCritical={toggleGoalCritical} onSetSprintDays={setSprintDays} onAddPbi={createPbi} onRefinePbi={refinePbi} onReorder={reorder} onMoveBefore={moveBefore} onSetUseStories={setUserStories} onSetSprintGoal={setSprintGoal} onTakeSignal={takeSignal} /></ZooShell>;
    }
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <Navigation />
      <main className="flex-1">{render()}</main>
      <Footer />
    </div>
  );
}
