import React, { useState, useMemo } from 'react';
import { 
  GraduationCap, 
  ChevronLeft, 
  CheckCircle2, 
  Play, 
  Award, 
  Lightbulb, 
  HelpCircle, 
  Sparkles, 
  Clock, 
  BookOpen, 
  Code2, 
  RotateCcw, 
  Trophy, 
  Target, 
  Zap, 
  Check, 
  TrendingUp,
  Flame,
  ArrowRight
} from 'lucide-react';
import { Track, Lesson, UserProgress } from '../types';
import { LEARNING_TRACKS } from '../data/curriculum';
import { soundManager } from '../utils/audioSynth';

interface AcademyViewProps {
  progress: UserProgress;
  onBack: () => void;
  onCompleteLesson: (lessonId: string, xpEarned: number) => void;
  onChallengeSolved?: (lessonId: string, updatedMastery: number) => void;
  onQuizPassed?: (lessonId: string, updatedMastery: number) => void;
  onExploreConcept?: (lessonId: string, updatedMastery: number) => void;
  onAskAI?: (topic: string) => void;
}

export const AcademyView: React.FC<AcademyViewProps> = ({
  progress,
  onBack,
  onCompleteLesson,
  onChallengeSolved,
  onQuizPassed,
  onExploreConcept,
  onAskAI
}) => {
  const [selectedTrack, setSelectedTrack] = useState<Track>(LEARNING_TRACKS[0]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(LEARNING_TRACKS[0].lessons[0]);
  const [exerciseCode, setExerciseCode] = useState<string>(LEARNING_TRACKS[0].lessons[0].interactiveChallenge.starterCode);
  const [exercisePassed, setExercisePassed] = useState<boolean>(
    progress.completedChallengeLessonIds?.includes(LEARNING_TRACKS[0].lessons[0].id) ||
    progress.completedLessonIds.includes(LEARNING_TRACKS[0].lessons[0].id) ||
    false
  );
  const [exerciseOutput, setExerciseOutput] = useState<string>('');
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(
    progress.passedQuizIds?.includes(LEARNING_TRACKS[0].lessons[0].id) 
      ? LEARNING_TRACKS[0].lessons[0].quiz.correctIndex 
      : null
  );
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(
    progress.passedQuizIds?.includes(LEARNING_TRACKS[0].lessons[0].id) || false
  );
  const [showHint, setShowHint] = useState<boolean>(false);
  const [celebrationBanner, setCelebrationBanner] = useState<{ show: boolean; text: string; subtext: string } | null>(null);

  // Local session sets so real-time interactions across lessons are immediately remembered
  const [sessionCompletedChallenges, setSessionCompletedChallenges] = useState<Set<string>>(
    () => new Set(progress.completedChallengeLessonIds || [])
  );
  const [sessionPassedQuizzes, setSessionPassedQuizzes] = useState<Set<string>>(
    () => new Set(progress.passedQuizIds || [])
  );
  const [sessionExploredConcepts, setSessionExploredConcepts] = useState<Set<string>>(
    () => new Set(progress.exploredConceptLessonIds || [LEARNING_TRACKS[0].lessons[0].id])
  );

  // Real-time syntax check on student's typed code
  const syntaxCheck = useMemo(() => {
    if (!exerciseCode.trim()) return { valid: false, message: 'Code editor is empty' };
    try {
      // Safe dry-run parse without executing
      new Function('console', exerciseCode);
      return { valid: true, message: 'Syntax valid — ready to execute' };
    } catch (err: any) {
      return { valid: false, message: err.message };
    }
  }, [exerciseCode]);

  // Comprehensive calculation of lesson mastery (0 - 100%)
  const getLessonMastery = (lessonId: string): number => {
    if (progress.completedLessonIds.includes(lessonId)) {
      return 100;
    }

    const isChallengeDone = 
      (selectedLesson.id === lessonId && exercisePassed) ||
      sessionCompletedChallenges.has(lessonId) ||
      (progress.completedChallengeLessonIds && progress.completedChallengeLessonIds.includes(lessonId));

    const isQuizDone = 
      (selectedLesson.id === lessonId && quizSubmitted && selectedQuizAnswer === selectedLesson.quiz.correctIndex) ||
      sessionPassedQuizzes.has(lessonId) ||
      progress.passedQuizIds.includes(lessonId);

    const isConceptExplored = 
      (selectedLesson.id === lessonId) ||
      sessionExploredConcepts.has(lessonId) ||
      (progress.exploredConceptLessonIds && progress.exploredConceptLessonIds.includes(lessonId));

    let score = 0;
    if (isConceptExplored) score += 20; // 20% for theory & reading
    if (isChallengeDone) score += 55;   // 55% for solving the integrated code challenge (core!)
    if (isQuizDone) score += 25;        // 25% for answering the mastery quiz

    const storedMastery = progress.lessonMastery?.[lessonId] || 0;
    return Math.min(100, Math.max(score, storedMastery));
  };

  const currentMastery = getLessonMastery(selectedLesson.id);
  const isLessonCompleted = progress.completedLessonIds.includes(selectedLesson.id);

  // Milestone statuses for the active lesson
  const milestoneConceptDone = sessionExploredConcepts.has(selectedLesson.id) || (progress.exploredConceptLessonIds?.includes(selectedLesson.id) ?? true);
  const milestoneChallengeDone = exercisePassed || sessionCompletedChallenges.has(selectedLesson.id) || (progress.completedChallengeLessonIds?.includes(selectedLesson.id) ?? false);
  const milestoneQuizDone = (quizSubmitted && selectedQuizAnswer === selectedLesson.quiz.correctIndex) || sessionPassedQuizzes.has(selectedLesson.id) || progress.passedQuizIds.includes(selectedLesson.id);

  const handleSelectLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setExerciseCode(lesson.interactiveChallenge.starterCode);
    
    const challengeDone = 
      sessionCompletedChallenges.has(lesson.id) ||
      (progress.completedChallengeLessonIds && progress.completedChallengeLessonIds.includes(lesson.id)) ||
      progress.completedLessonIds.includes(lesson.id);
      
    const quizDone = 
      sessionPassedQuizzes.has(lesson.id) ||
      progress.passedQuizIds.includes(lesson.id) ||
      progress.completedLessonIds.includes(lesson.id);

    setExercisePassed(challengeDone);
    setExerciseOutput('');
    setSelectedQuizAnswer(quizDone ? lesson.quiz.correctIndex : null);
    setQuizSubmitted(quizDone);
    setShowHint(false);

    // Auto-mark concept explored
    setSessionExploredConcepts(prev => {
      const next = new Set(prev).add(lesson.id);
      return next;
    });

    if (onExploreConcept) {
      const baseMastery = challengeDone && quizDone ? 100 : challengeDone ? 75 : quizDone ? 45 : 20;
      onExploreConcept(lesson.id, baseMastery);
    }
  };

  // Run the code challenge and provide instantaneous real-time mastery feedback
  const handleRunExercise = () => {
    try {
      const logs: string[] = [];
      const customConsole = {
        log: (...args: any[]) => logs.push(args.map(a => String(a)).join(' ')),
        info: (...args: any[]) => logs.push(args.map(a => String(a)).join(' ')),
        warn: (...args: any[]) => logs.push(args.map(a => String(a)).join(' ')),
        error: (...args: any[]) => logs.push(args.map(a => String(a)).join(' '))
      };

      let runnableJs = exerciseCode;

      // If the code uses Java constructs, transpile it for execution
      if (
        exerciseCode.includes('System.out') || 
        /\b(int|double|float|boolean|String)\s+[a-zA-Z_]/.test(exerciseCode)
      ) {
        // Replace System.out.println with console.log
        runnableJs = runnableJs.replace(/System\.out\.println\s*\(/g, 'console.log(');
        runnableJs = runnableJs.replace(/System\.out\.print\s*\(/g, 'console.log(');
        // Replace Java types
        runnableJs = runnableJs.replace(/\b(int|double|float|boolean|String)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g, 'let $2 =');
      }

      // Safely evaluate the student's code
      const runner = new Function('console', runnableJs);
      runner(customConsole);

      const outputStr = logs.join('\n');
      setExerciseOutput(outputStr || 'Code executed with return status: OK (No console.log messages).');

      const targetKeyword = selectedLesson.interactiveChallenge.solutionKeyword.toLowerCase().trim();
      const codeMatches = exerciseCode.toLowerCase().includes(targetKeyword);
      const outputMatches = outputStr.toLowerCase().includes(targetKeyword);

      if (codeMatches || outputMatches) {
        setExercisePassed(true);
        setSessionCompletedChallenges(prev => new Set(prev).add(selectedLesson.id));
        soundManager.playCoin();

        // Calculate surging mastery percentage
        const updatedMastery = milestoneQuizDone ? 100 : 75;

        // Visual celebration banner
        setCelebrationBanner({
          show: true,
          text: 'Challenge Solved! Mastery Boosted to ' + updatedMastery + '%',
          subtext: milestoneQuizDone 
            ? 'Outstanding! You have attained 100% full mastery on this topic.' 
            : 'Excellent work! Answer the quick quiz below to claim 100% full mastery.'
        });
        setTimeout(() => setCelebrationBanner(null), 5000);

        if (onChallengeSolved) {
          onChallengeSolved(selectedLesson.id, updatedMastery);
        }
      } else {
        setExercisePassed(false);
        soundManager.playHit();
        setExerciseOutput(prev => 
          `${prev}\n\n[Feedback]: Requirement not met yet. Look for "${selectedLesson.interactiveChallenge.solutionKeyword}" or review the hint.`
        );
      }
    } catch (err: any) {
      setExerciseOutput(`Syntax/Runtime Error: ${err.message}`);
      setExercisePassed(false);
      soundManager.playHit();
    }
  };

  const handleResetStarterCode = () => {
    setExerciseCode(selectedLesson.interactiveChallenge.starterCode);
    setExerciseOutput('Reset to starter code template.');
    setExercisePassed(false);
  };

  const handleSubmitQuiz = () => {
    if (selectedQuizAnswer === null) return;
    setQuizSubmitted(true);
    
    if (selectedQuizAnswer === selectedLesson.quiz.correctIndex) {
      soundManager.playCoin();
      setSessionPassedQuizzes(prev => new Set(prev).add(selectedLesson.id));
      
      const updatedMastery = milestoneChallengeDone ? 100 : 45;
      if (onQuizPassed) {
        onQuizPassed(selectedLesson.id, updatedMastery);
      }

      setCelebrationBanner({
        show: true,
        text: 'Quiz Mastered! +' + (milestoneChallengeDone ? '25%' : '25%') + ' Mastery Earned',
        subtext: milestoneChallengeDone 
          ? '100% Complete! You have mastered both the theory and hands-on coding.' 
          : 'Great theory check! Complete the code challenge above to surge to 100%!'
      });
      setTimeout(() => setCelebrationBanner(null), 4000);
    } else {
      soundManager.playHit();
    }
  };

  const handleFinishLesson = () => {
    soundManager.playWin();
    onCompleteLesson(selectedLesson.id, selectedLesson.xp);
  };

  // Track-level mastery computation
  const trackAverageMastery = useMemo(() => {
    if (!selectedTrack.lessons.length) return 0;
    const total = selectedTrack.lessons.reduce((acc, l) => acc + getLessonMastery(l.id), 0);
    return Math.round(total / selectedTrack.lessons.length);
  }, [selectedTrack, exercisePassed, quizSubmitted, sessionCompletedChallenges, sessionPassedQuizzes, progress]);

  return (
    <div id="academy-root" className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            id="btn-academy-back"
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Back to Dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-400" />
              <span>Beginner GameDev Academy</span>
            </h2>
            <p className="text-xs text-slate-400">Master video game programming with interactive code challenges and live mastery tracking</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Track Mastery:</span>
            <span className="font-mono font-bold text-white">{trackAverageMastery}%</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{progress.completedLessonIds.length} Lessons Finished</span>
          </div>
        </div>
      </div>

      {/* Floating Real-Time Celebration Alert */}
      {celebrationBanner && (
        <div className="w-full p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/90 via-teal-950/90 to-slate-900 border border-emerald-500/40 shadow-xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-300 flex items-center gap-1.5">
                <span>{celebrationBanner.text}</span>
              </div>
              <p className="text-xs text-slate-300">{celebrationBanner.subtext}</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[11px] font-bold text-emerald-300 font-mono">
            LIVE UPDATE
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Tracks & Lessons list */}
        <div className="lg:col-span-4 space-y-4">
          {/* Tracks Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-400" />
              <span>Curriculum Tracks</span>
            </span>
            <div className="space-y-1.5">
              {LEARNING_TRACKS.map((track) => {
                const completedInTrack = track.lessons.filter(l => progress.completedLessonIds.includes(l.id)).length;
                const isCurrent = track.id === selectedTrack.id;
                
                // Track avg mastery
                const trackMastery = Math.round(
                  track.lessons.reduce((acc, l) => acc + getLessonMastery(l.id), 0) / track.lessons.length
                );

                return (
                  <button
                    key={track.id}
                    onClick={() => {
                      setSelectedTrack(track);
                      handleSelectLesson(track.lessons[0]);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer group ${
                      isCurrent 
                        ? 'bg-indigo-950/50 border-indigo-500/60 shadow-md shadow-indigo-950/40 text-white' 
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold group-hover:text-indigo-300 transition-colors">{track.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {completedInTrack}/{track.lessons.length}
                        </span>
                        <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                          trackMastery === 100 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : trackMastery >= 50 
                            ? 'bg-indigo-500/20 text-indigo-300' 
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {trackMastery}%
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">{track.description}</p>
                    
                    {/* Track Mastery Mini Bar */}
                    <div className="w-full bg-slate-950 rounded-full h-1 mt-2.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          trackMastery === 100 
                            ? 'bg-emerald-400' 
                            : trackMastery >= 50 
                            ? 'bg-indigo-400' 
                            : 'bg-amber-400'
                        }`}
                        style={{ width: `${trackMastery}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lessons in Selected Track with Individual Mastery Indicators */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>Lessons & Mastery</span>
              </span>
              <span className="text-[10px] text-indigo-400 font-medium">Real-time</span>
            </div>

            <div className="space-y-2">
              {selectedTrack.lessons.map((lesson, idx) => {
                const done = progress.completedLessonIds.includes(lesson.id);
                const active = lesson.id === selectedLesson.id;
                const mastery = getLessonMastery(lesson.id);
                const challengeDone = 
                  (selectedLesson.id === lesson.id && exercisePassed) ||
                  sessionCompletedChallenges.has(lesson.id) ||
                  (progress.completedChallengeLessonIds && progress.completedChallengeLessonIds.includes(lesson.id));

                return (
                  <button
                    key={lesson.id}
                    onClick={() => handleSelectLesson(lesson)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                      active 
                        ? 'bg-indigo-950/60 text-white border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30' 
                        : done
                        ? 'bg-slate-950/80 border-emerald-500/30 text-emerald-200 hover:border-emerald-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {mastery === 100 ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : challengeDone ? (
                          <div className="w-4 h-4 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center flex-shrink-0">
                            <Code2 className="w-2.5 h-2.5 text-indigo-400" />
                          </div>
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-slate-700 flex-shrink-0 text-[10px] flex items-center justify-center text-slate-400">
                            {idx + 1}
                          </span>
                        )}
                        <span className="font-semibold truncate">{lesson.title}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          mastery === 100
                            ? 'text-emerald-300 bg-emerald-950/60 border border-emerald-500/40'
                            : mastery >= 50
                            ? 'text-indigo-300 bg-indigo-950/60 border border-indigo-500/40'
                            : mastery > 0
                            ? 'text-amber-300 bg-amber-950/60 border border-amber-500/40'
                            : 'text-slate-500 bg-slate-900 border border-slate-800'
                        }`}>
                          {mastery}%
                        </span>
                      </div>
                    </div>

                    {/* Lesson Mastery Mini Progress Bar */}
                    <div className="mt-2 space-y-1">
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800/80">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ease-out ${
                            mastery === 100 
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                              : mastery >= 75
                              ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400'
                              : mastery >= 20
                              ? 'bg-gradient-to-r from-amber-500 to-amber-400' 
                              : 'bg-transparent'
                          }`}
                          style={{ width: `${mastery}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Area: Lesson Content & Interactive Playground */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
            
            {/* Lesson Title & Header Info */}
            <div className="space-y-2 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
                  {selectedTrack.title}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {selectedLesson.durationMinutes} min
                </span>
                <span className="text-xs text-amber-400 font-bold ml-auto flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> +{selectedLesson.xp} XP
                </span>
              </div>

              <h1 className="text-2xl font-bold text-white font-['Space_Grotesk'] tracking-tight">
                {selectedLesson.title}
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">{selectedLesson.overview}</p>
            </div>

            {/* ========================================================= */}
            {/* REAL-TIME LESSON MASTERY PROGRESS BAR (PRIMARY USER TASK) */}
            {/* ========================================================= */}
            <div 
              id="lesson-mastery-card"
              className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-indigo-500/30 shadow-lg space-y-3.5 relative overflow-hidden"
            >
              {/* Card Header & Dynamic Percentage */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    currentMastery === 100 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20' 
                      : currentMastery >= 75
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-sm shadow-indigo-500/20'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}>
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wider font-['Space_Grotesk']">
                        Lesson Mastery
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        currentMastery === 100 
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' 
                          : currentMastery >= 75 
                          ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300' 
                          : currentMastery >= 20 
                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300' 
                          : 'bg-slate-800 border border-slate-700 text-slate-400'
                      }`}>
                        {currentMastery === 100 
                          ? '★ Mastered' 
                          : currentMastery >= 75 
                          ? 'Challenge Solved' 
                          : currentMastery >= 20 
                          ? 'Concept Explored' 
                          : 'Starting'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {currentMastery === 100 
                        ? 'Full mastery achieved! You solved the code challenge and cleared the quiz.'
                        : currentMastery >= 75 
                        ? 'Challenge conquered! Answer the quiz below for 100% mastery.'
                        : 'Solve the hands-on code challenge below to surge mastery to 75%!'}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="flex items-baseline justify-end gap-1">
                    <span 
                      id="mastery-percentage-label" 
                      className={`text-2xl sm:text-3xl font-black font-mono tracking-tight transition-all duration-500 ${
                        currentMastery === 100 
                          ? 'text-emerald-400' 
                          : currentMastery >= 75 
                          ? 'text-cyan-400' 
                          : currentMastery >= 20 
                          ? 'text-amber-400' 
                          : 'text-slate-400'
                      }`}
                    >
                      {currentMastery}%
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {Math.round((currentMastery / 100) * selectedLesson.xp)} / {selectedLesson.xp} XP
                  </span>
                </div>
              </div>

              {/* High-Craft Animated Progress Bar */}
              <div className="space-y-1.5">
                <div 
                  id="mastery-progress-track"
                  className="w-full h-3.5 bg-slate-950 rounded-full border border-slate-700/80 p-0.5 relative overflow-hidden shadow-inner"
                >
                  <div 
                    id="mastery-progress-fill"
                    className={`h-full rounded-full transition-all duration-700 ease-out relative ${
                      currentMastery === 100 
                        ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-300 shadow-md shadow-emerald-500/30' 
                        : currentMastery >= 75 
                        ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 shadow-md shadow-indigo-500/30' 
                        : 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-sm'
                    }`}
                    style={{ width: `${currentMastery}%` }}
                  >
                    {/* Pulsing glow highlight */}
                    <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse opacity-40 pointer-events-none" />
                  </div>
                </div>

                {/* 3 Step Milestone Checkpoints */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {/* Step 1: Concept */}
                  <div className={`p-2 rounded-xl border text-[11px] flex items-center gap-1.5 transition-all ${
                    milestoneConceptDone 
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}>
                    {milestoneConceptDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <BookOpen className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    )}
                    <span className="truncate font-medium">1. Concept (20%)</span>
                  </div>

                  {/* Step 2: Code Challenge (Core real-time driver) */}
                  <div className={`p-2 rounded-xl border text-[11px] flex items-center gap-1.5 transition-all ${
                    milestoneChallengeDone 
                      ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200 ring-1 ring-indigo-500/30 font-semibold' 
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}>
                    {milestoneChallengeDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    ) : (
                      <Code2 className="w-3.5 h-3.5 text-amber-400 animate-pulse flex-shrink-0" />
                    )}
                    <span className="truncate">2. Challenge (+55%)</span>
                  </div>

                  {/* Step 3: Quiz Check */}
                  <div className={`p-2 rounded-xl border text-[11px] flex items-center gap-1.5 transition-all ${
                    milestoneQuizDone 
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}>
                    {milestoneQuizDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <HelpCircle className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    )}
                    <span className="truncate font-medium">3. Quiz (+25%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Metaphor & Concept Explanation */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>The Core Concept</span>
                </h3>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                  <Check className="w-3 h-3" /> 20% Mastery Baseline Active
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm whitespace-pre-line leading-relaxed">
                {selectedLesson.conceptExploration}
              </div>
            </div>

            {/* Code Snippet */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Example Code</h3>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto leading-5">
                {selectedLesson.codeSnippet}
              </pre>
            </div>

            {/* ========================================================= */}
            {/* INTEGRATED CODE CHALLENGE (UPDATES MASTERY IN REAL-TIME)  */}
            {/* ========================================================= */}
            <div 
              id="integrated-code-challenge" 
              className={`p-5 rounded-2xl border transition-all space-y-4 ${
                exercisePassed 
                  ? 'bg-emerald-950/15 border-emerald-500/40 shadow-md shadow-emerald-950/20' 
                  : 'bg-indigo-950/20 border-indigo-500/30'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    exercisePassed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'
                  }`}>
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span>Hands-On Code Challenge</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-[10px] text-indigo-300 font-semibold lowercase">
                        +55% mastery
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>{showHint ? 'Hide Hint' : 'Need a Hint?'}</span>
                  </button>
                  <button
                    onClick={handleResetStarterCode}
                    className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                    title="Reset to starter template"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                <strong>Objective:</strong> {selectedLesson.interactiveChallenge.description}
              </div>

              {showHint && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                  💡 <strong>Hint:</strong> {selectedLesson.interactiveChallenge.hint}
                </div>
              )}

              {/* Editable code snippet */}
              <div className="space-y-2.5">
                <div className="relative">
                  <textarea
                    id="challenge-code-editor"
                    value={exerciseCode}
                    onChange={(e) => setExerciseCode(e.target.value)}
                    onKeyDown={(e) => {
                      // Support Ctrl+Enter / Cmd+Enter to instantly run
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault();
                        handleRunExercise();
                      }
                    }}
                    spellCheck={false}
                    className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-700/80 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[110px] focus:ring-1 focus:ring-indigo-500/40"
                    placeholder="// Write your code challenge solution here..."
                  />
                  
                  {/* Real-time typing syntax badge */}
                  <div className="absolute bottom-2.5 right-3 text-[10px] font-mono flex items-center gap-1.5 pointer-events-none">
                    <span className={`w-2 h-2 rounded-full ${syntaxCheck.valid ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    <span className={syntaxCheck.valid ? 'text-slate-400' : 'text-rose-400'}>
                      {syntaxCheck.valid ? 'Syntax OK' : 'Syntax Check'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      id="btn-run-code-challenge"
                      onClick={handleRunExercise}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer active:scale-95 transition-transform"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Run Code & Check Mastery</span>
                    </button>
                    <span className="text-[10px] text-slate-500 hidden sm:inline font-mono">
                      (Shortcut: Ctrl+Enter)
                    </span>
                  </div>

                  {exercisePassed ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 font-bold animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Code Challenge Solved! (+55% Mastery Active)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Challenge Pending (+55% upon pass)</span>
                    </div>
                  )}
                </div>

                {exerciseOutput && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-[10px] select-none border-b border-slate-800/80 pb-1">
                      <span>CONSOLE OUTPUT & EXECUTION LOG</span>
                      <span className={exercisePassed ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                        {exercisePassed ? 'TEST PASSED' : 'CHECKING RESULTS'}
                      </span>
                    </div>
                    <div className="text-slate-200 mt-1.5 whitespace-pre-wrap">{exerciseOutput}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Quiz */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Quick Mastery Check</h3>
                </div>
                <span className="text-[10px] text-indigo-400 font-mono font-semibold">+25% Mastery</span>
              </div>

              <p className="text-sm font-semibold text-slate-200">{selectedLesson.quiz.question}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedLesson.quiz.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (!quizSubmitted) setSelectedQuizAnswer(i);
                    }}
                    className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      quizSubmitted && i === selectedLesson.quiz.correctIndex
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold ring-1 ring-emerald-500/40'
                        : quizSubmitted && selectedQuizAnswer === i && i !== selectedLesson.quiz.correctIndex
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : selectedQuizAnswer === i
                        ? 'bg-indigo-600/20 border-indigo-500 text-white font-medium ring-1 ring-indigo-500/40'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {!quizSubmitted ? (
                <button
                  id="btn-submit-quiz"
                  disabled={selectedQuizAnswer === null}
                  onClick={handleSubmitQuiz}
                  className="px-4 py-2 rounded-xl bg-indigo-600 disabled:opacity-40 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  Submit Answer & Update Mastery
                </button>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-indigo-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Explanation:</span>
                  </div>
                  <p className="leading-relaxed">{selectedLesson.quiz.explanation}</p>
                </div>
              )}
            </div>

            {/* Bottom Claim Button */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
              {onAskAI && (
                <button
                  onClick={() => onAskAI(selectedLesson.title)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ask Sparky AI to explain this differently</span>
                </button>
              )}

              <button
                id="btn-complete-lesson"
                onClick={handleFinishLesson}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all ml-auto cursor-pointer ${
                  isLessonCompleted 
                    ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-750' 
                    : currentMastery === 100
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 ring-2 ring-emerald-400/40 animate-pulse'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>
                  {isLessonCompleted 
                    ? 'Lesson Completed! (Claim Again)' 
                    : currentMastery === 100
                    ? `100% Mastered! Complete & Claim +${selectedLesson.xp} XP`
                    : `Complete & Claim +${selectedLesson.xp} XP`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
