import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, Maximize2, Minimize2, 
  Play, Info, X, Presentation, List,
  Activity, BarChart3, TrendingDown, FileText, CheckCircle2
} from 'lucide-react';
import { COURSE_SLIDES } from './CourseDataVCAT2';

let savedSlideIndex = 0;

// Inner component for Quiz to handle state
const QuizComponent = ({ quizData }: { quizData: any }) => {
  const defaultQuestions = quizData?.questions || [];
  const [questions, setQuestions] = useState<any[]>(defaultQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(quizData?.timeLimitSeconds || null);
  const [isFinished, setIsFinished] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form for new question
  const [newQText, setNewQText] = useState("");
  const [newOpt1, setNewOpt1] = useState("");
  const [newOpt2, setNewOpt2] = useState("");
  const [newOpt3, setNewOpt3] = useState("");
  const [correctIndex, setCorrectIndex] = useState(0);
  const [newExplanation, setNewExplanation] = useState("");

  useEffect(() => {
    // Reset state when quizData changes (slide change)
    setQuestions(quizData?.questions || []);
    setCurrentIndex(0);
    setAnswers({});
    setTimeLeft(quizData?.timeLimitSeconds || null);
    setIsFinished(false);
    setIsEditMode(false);
  }, [quizData]);

  useEffect(() => {
    if (timeLeft === null || isFinished) return;
    if (timeLeft <= 0) {
      setIsFinished(true);
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => (t ? t - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isFinished]);

  if (!quizData || questions.length === 0) return (
    <div className="w-full h-full flex flex-col p-6 items-center justify-center">
       <p className="text-slate-500">Aucune question dans ce quiz.</p>
       <button onClick={() => setIsEditMode(true)} className="mt-4 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg">Ajouter une question</button>
       
       {isEditMode && (
          <div className="mt-4 w-full bg-white p-4 rounded-xl shadow border">
            <h4 className="font-bold mb-2">Nouvelle question</h4>
            <input className="w-full mb-2 p-2 border rounded" placeholder="Texte de la question" value={newQText} onChange={e => setNewQText(e.target.value)}/>
            <div className="flex gap-2 mb-2"><input type="radio" checked={correctIndex===0} onChange={()=>setCorrectIndex(0)}/><input className="flex-1 p-2 border rounded" placeholder="Option 1" value={newOpt1} onChange={e=>setNewOpt1(e.target.value)}/></div>
            <div className="flex gap-2 mb-2"><input type="radio" checked={correctIndex===1} onChange={()=>setCorrectIndex(1)}/><input className="flex-1 p-2 border rounded" placeholder="Option 2" value={newOpt2} onChange={e=>setNewOpt2(e.target.value)}/></div>
            <div className="flex gap-2 mb-2"><input type="radio" checked={correctIndex===2} onChange={()=>setCorrectIndex(2)}/><input className="flex-1 p-2 border rounded" placeholder="Option 3" value={newOpt3} onChange={e=>setNewOpt3(e.target.value)}/></div>
            <input className="w-full mb-2 p-2 border rounded" placeholder="Explication" value={newExplanation} onChange={e => setNewExplanation(e.target.value)}/>
            <div className="flex justify-end gap-2">
               <button onClick={()=>setIsEditMode(false)} className="px-4 py-2 bg-slate-100 rounded">Annuler</button>
               <button onClick={() => {
                 setQuestions([...questions, { id: 'q'+Date.now(), question: newQText, options: [
                   { id: 'o1', text: newOpt1, isCorrect: correctIndex===0, explanation: newExplanation },
                   { id: 'o2', text: newOpt2, isCorrect: correctIndex===1, explanation: newExplanation },
                   { id: 'o3', text: newOpt3, isCorrect: correctIndex===2, explanation: newExplanation },
                 ]}]);
                 setIsEditMode(false);
               }} className="px-4 py-2 bg-indigo-600 text-white rounded">Ajouter</button>
            </div>
          </div>
       )}
    </div>
  );

  const currentQ = questions[currentIndex];
  const selectedOptionId = answers[currentQ.id] || null;

  const score = Object.keys(answers).reduce((acc, qId) => {
    const q = questions.find(q => q.id === qId);
    if (!q) return acc;
    const opt = q.options.find((o: any) => o.id === answers[qId]);
    return acc + (opt?.isCorrect ? 1 : 0);
  }, 0);

  if (isFinished) {
    return (
      <div className="w-full h-full flex flex-col p-8 items-center justify-center animate-in fade-in duration-500 text-center">
         <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center mb-6">
            <span className="text-4xl font-black text-indigo-600">{score}/{questions.length}</span>
         </div>
         <h2 className="text-2xl font-bold text-slate-800 mb-2">Quiz Terminé !</h2>
         <p className="text-slate-600 mb-8">Vous avez répondu à toutes les questions ou le temps est écoulé.</p>
         <button onClick={() => { setAnswers({}); setIsFinished(false); setTimeLeft(quizData?.timeLimitSeconds || null); setCurrentIndex(0); }} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
            Recommencer
         </button>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full flex flex-col p-6 animate-in fade-in duration-500 relative">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4 shrink-0">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
               <span className="text-indigo-600 font-bold text-sm">{currentIndex + 1}/{questions.length}</span>
            </div>
            <h3 className="font-bold text-slate-800 text-lg hidden sm:block">Testez vos connaissances</h3>
         </div>
         <div className="flex items-center gap-4">
            {timeLeft !== null && (
              <div className={`px-4 py-2 rounded-full font-mono font-bold text-lg flex items-center gap-2 ${timeLeft < 30 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
                <Activity className="w-4 h-4" />
                {formatTime(timeLeft)}
              </div>
            )}
            <button onClick={() => setIsEditMode(!isEditMode)} className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200">
               Mode Formateur
            </button>
         </div>
      </div>
      
      {isEditMode ? (
         <div className="flex-1 overflow-y-auto">
            <div className="w-full bg-white p-6 rounded-xl shadow border border-indigo-100 mb-4">
              <h4 className="font-bold text-indigo-900 mb-4">Ajouter une question personnalisée</h4>
              <input className="w-full mb-3 p-3 border border-slate-200 rounded-lg text-sm" placeholder="Texte de la question" value={newQText} onChange={e => setNewQText(e.target.value)}/>
              <div className="flex gap-3 mb-3 items-center"><input type="radio" className="w-5 h-5 accent-indigo-600" checked={correctIndex===0} onChange={()=>setCorrectIndex(0)}/><input className="flex-1 p-3 border border-slate-200 rounded-lg text-sm" placeholder="Option 1" value={newOpt1} onChange={e=>setNewOpt1(e.target.value)}/></div>
              <div className="flex gap-3 mb-3 items-center"><input type="radio" className="w-5 h-5 accent-indigo-600" checked={correctIndex===1} onChange={()=>setCorrectIndex(1)}/><input className="flex-1 p-3 border border-slate-200 rounded-lg text-sm" placeholder="Option 2" value={newOpt2} onChange={e=>setNewOpt2(e.target.value)}/></div>
              <div className="flex gap-3 mb-3 items-center"><input type="radio" className="w-5 h-5 accent-indigo-600" checked={correctIndex===2} onChange={()=>setCorrectIndex(2)}/><input className="flex-1 p-3 border border-slate-200 rounded-lg text-sm" placeholder="Option 3" value={newOpt3} onChange={e=>setNewOpt3(e.target.value)}/></div>
              <input className="w-full mb-4 p-3 border border-slate-200 rounded-lg text-sm" placeholder="Explication (affichée après réponse)" value={newExplanation} onChange={e => setNewExplanation(e.target.value)}/>
              <div className="flex justify-end gap-3">
                 <button onClick={()=>setIsEditMode(false)} className="px-5 py-2.5 font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">Annuler</button>
                 <button onClick={() => {
                   if(newQText) {
                     setQuestions([...questions, { id: 'q'+Date.now(), question: newQText, options: [
                       { id: 'o1', text: newOpt1, isCorrect: correctIndex===0, explanation: newExplanation },
                       { id: 'o2', text: newOpt2, isCorrect: correctIndex===1, explanation: newExplanation },
                       { id: 'o3', text: newOpt3, isCorrect: correctIndex===2, explanation: newExplanation },
                     ]}]);
                   }
                   setNewQText(""); setNewOpt1(""); setNewOpt2(""); setNewOpt3(""); setNewExplanation("");
                   setIsEditMode(false);
                 }} className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">Enregistrer l'exercice</button>
              </div>
            </div>
         </div>
      ) : (
         <>
            {/* Question Body */}
            <p className="text-slate-700 font-medium mb-8 text-lg">{currentQ.question}</p>
            
            <div className="space-y-3 flex-1 overflow-y-auto pr-2 pb-20">
              {currentQ.options.map((opt: any) => {
                const isSelected = selectedOptionId === opt.id;
                // Only show correctness if ANY option has been selected for this question
                const hasAnswered = selectedOptionId !== null;
                const showSuccess = hasAnswered && opt.isCorrect;
                const showError = isSelected && !opt.isCorrect;
                
                return (
                  <div key={opt.id} className="flex flex-col">
                    <button
                      onClick={() => !hasAnswered && setAnswers({...answers, [currentQ.id]: opt.id})}
                      disabled={hasAnswered}
                      className={`
                        text-left p-4 rounded-xl border-2 transition-all duration-300 relative
                        ${!hasAnswered ? 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30' : ''}
                        ${showSuccess ? 'border-emerald-500 bg-emerald-50' : ''}
                        ${showError ? 'border-red-500 bg-red-50' : ''}
                        ${hasAnswered && !isSelected && !showSuccess ? 'border-slate-100 opacity-40' : ''}
                      `}
                    >
                      <div className="flex items-center gap-3">
                         <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0
                           ${!hasAnswered ? 'border-slate-300' : ''}
                           ${showSuccess ? 'border-emerald-500 bg-emerald-500' : ''}
                           ${showError ? 'border-red-500 bg-red-500' : ''}
                           ${hasAnswered && !isSelected && !showSuccess ? 'border-slate-200' : ''}
                         `}>
                            {showSuccess && <CheckCircle2 className="w-4 h-4 text-white" />}
                            {showError && <X className="w-4 h-4 text-white" />}
                         </div>
                         <span className={`font-medium ${showSuccess ? 'text-emerald-800' : showError ? 'text-red-800' : 'text-slate-700'}`}>
                           {opt.text}
                         </span>
                      </div>
                    </button>
                    
                    {isSelected && (
                      <div className={`mt-3 p-4 rounded-xl animate-in slide-in-from-top-2 duration-300 ${opt.isCorrect ? 'bg-emerald-100/50 text-emerald-800' : 'bg-red-100/50 text-red-800'}`}>
                        <div className="flex gap-2">
                          <Info className="w-5 h-5 shrink-0 mt-0.5" />
                          <span className="text-sm">{opt.explanation}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer Navigation */}
            {selectedOptionId !== null && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur border-t border-slate-100 flex justify-end animate-in slide-in-from-bottom-4">
                 {currentIndex < questions.length - 1 ? (
                   <button onClick={() => setCurrentIndex(currentIndex + 1)} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-colors">
                     Question Suivante <ChevronRight className="w-5 h-5" />
                   </button>
                 ) : (
                   <button onClick={() => setIsFinished(true)} className="px-6 py-2.5 bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-emerald-600 transition-colors">
                     Terminer <CheckCircle2 className="w-5 h-5" />
                   </button>
                 )}
              </div>
            )}
         </>
      )}
    </div>
  );
};
export default function VibrationCourse2({ onExit }: { onExit?: () => void }) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(savedSlideIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  
  // Save state on change
  useEffect(() => {
    savedSlideIndex = currentSlideIndex;
  }, [currentSlideIndex]);

  const currentSlide = COURSE_SLIDES[currentSlideIndex];
  
  // Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      if (e.key === 'ArrowRight' || e.key === ' ') {
        setCurrentSlideIndex(prev => Math.min(prev + 1, COURSE_SLIDES.length - 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlideIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'f') {
        toggleFullscreen();
      } else if (e.key === 'n') {
        setShowNotes(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Renderer for specific visual demos
  const renderVisualDemo = (type: string | undefined) => {
    if (!type || type === 'none') return null;
    
    let visualContent = null;
    
    switch (type) {
      case 'pf-curve':
        visualContent = (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
             <h3 className="font-bold text-slate-700 mb-6 uppercase tracking-widest text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
                Courbe P-F
             </h3>
             <svg viewBox="0 0 400 220" className="w-full max-w-sm h-auto drop-shadow-sm">
               {/* Axes */}
               <line x1="40" y1="180" x2="380" y2="180" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrow)" />
               <line x1="40" y1="180" x2="40" y2="20" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrow)" />
               <text x="350" y="200" className="text-[11px] font-bold fill-slate-500">Temps</text>
               <text x="-140" y="25" className="text-[11px] font-bold fill-slate-500" transform="rotate(-90)">État de santé</text>
               
               {/* Curve */}
               <path d="M 40,40 L 150,40 Q 280,40 340,170" fill="none" stroke="#ef4444" strokeWidth="4" />
               
               {/* Points */}
               <circle cx="210" cy="50" r="6" fill="#3b82f6" className="animate-pulse" />
               <text x="200" y="35" className="text-[12px] font-black fill-blue-600">P</text>
               <text x="215" y="35" className="text-[10px] font-semibold fill-blue-500">(Détection)</text>
               
               <circle cx="340" cy="170" r="6" fill="#ef4444" />
               <text x="350" y="165" className="text-[12px] font-black fill-red-600">F</text>
               <text x="350" y="175" className="text-[10px] font-semibold fill-red-500">(Panne)</text>
               
               {/* Interval */}
               <line x1="210" y1="50" x2="210" y2="180" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4" />
               <line x1="340" y1="170" x2="340" y2="180" stroke="#ef4444" strokeWidth="1" strokeDasharray="4" />
               
               <path d="M 210,150 Q 275,165 340,150" fill="none" stroke="#10b981" strokeWidth="2" />
               <text x="235" y="145" className="text-[11px] font-bold fill-emerald-600">Intervalle P-F</text>
             </svg>
          </div>
        );
        break;
      case 'waveform':
        visualContent = (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
             <h3 className="font-bold text-slate-700 mb-6 uppercase tracking-widest text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Signal Temporel (Onde)
             </h3>
             <svg viewBox="0 0 400 150" className="w-full max-w-sm h-auto drop-shadow-sm">
               <line x1="20" y1="75" x2="380" y2="75" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4" />
               <line x1="40" y1="140" x2="40" y2="10" stroke="#94a3b8" strokeWidth="2" />
               <line x1="20" y1="130" x2="380" y2="130" stroke="#94a3b8" strokeWidth="2" />
               
               <path d="M 40,75 Q 75,10 110,75 T 180,75 T 250,75 T 320,75" fill="none" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" />
               
               <text x="350" y="145" className="text-[10px] font-semibold fill-slate-500">Temps (s)</text>
               <text x="10" y="20" className="text-[10px] font-semibold fill-slate-500">Amp</text>
               
               <circle cx="110" cy="75" r="4" fill="#3b82f6" />
               <circle cx="180" cy="75" r="4" fill="#3b82f6" />
               <path d="M 110,105 L 180,105" stroke="#ef4444" strokeWidth="2" />
               <line x1="110" y1="75" x2="110" y2="110" stroke="#ef4444" strokeWidth="1" strokeDasharray="2" />
               <line x1="180" y1="75" x2="180" y2="110" stroke="#ef4444" strokeWidth="1" strokeDasharray="2" />
               <text x="125" y="120" className="text-[10px] font-bold fill-red-500">Période (T)</text>
             </svg>
          </div>
        );
        break;
      case 'spectrum':
        visualContent = (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
             <h3 className="font-bold text-slate-700 mb-6 uppercase tracking-widest text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Spectre (FFT)
             </h3>
             <svg viewBox="0 0 400 150" className="w-full max-w-sm h-auto drop-shadow-sm">
               <line x1="30" y1="130" x2="380" y2="130" stroke="#94a3b8" strokeWidth="2" />
               <line x1="30" y1="130" x2="30" y2="20" stroke="#94a3b8" strokeWidth="2" />
               
               <line x1="100" y1="130" x2="100" y2="40" stroke="#4f46e5" strokeWidth="6" strokeLinecap="round" />
               <text x="92" y="30" className="text-[12px] fill-indigo-600 font-black">1X</text>
               
               <line x1="170" y1="130" x2="170" y2="100" stroke="#6366f1" strokeWidth="6" strokeLinecap="round" />
               <text x="162" y="90" className="text-[12px] fill-indigo-400 font-bold">2X</text>
               
               <line x1="240" y1="130" x2="240" y2="115" stroke="#818cf8" strokeWidth="6" strokeLinecap="round" />
               <text x="232" y="105" className="text-[12px] fill-indigo-300 font-bold">3X</text>
               
               <text x="340" y="145" className="text-[10px] font-semibold fill-slate-500">Fréquence</text>
               <text x="5" y="30" className="text-[10px] font-semibold fill-slate-500">Amp</text>
             </svg>
          </div>
        );
        break;
      case 'iso-table':
        visualContent = (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
             <h3 className="font-bold text-slate-700 mb-4 uppercase tracking-widest text-sm">Aperçu ISO</h3>
             <div className="w-full max-w-xs bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm text-center">
                <div className="grid grid-cols-2 bg-slate-100 text-xs font-bold text-slate-500 p-2 border-b border-slate-200">
                   <div>Vitesse</div><div>État</div>
                </div>
                <div className="grid grid-cols-2 text-xs p-2 border-b border-slate-100 items-center">
                   <div className="font-mono text-slate-600">{"<"} 0.71 mm/s</div>
                   <div className="bg-emerald-400 text-white font-bold py-1 px-2 rounded">A (Bon)</div>
                </div>
                <div className="grid grid-cols-2 text-xs p-2 border-b border-slate-100 items-center">
                   <div className="font-mono text-slate-600">{"<"} 2.80 mm/s</div>
                   <div className="bg-emerald-400 text-white font-bold py-1 px-2 rounded">B (Acceptable)</div>
                </div>
                <div className="grid grid-cols-2 text-xs p-2 border-b border-slate-100 items-center">
                   <div className="font-mono text-slate-600">{"<"} 7.10 mm/s</div>
                   <div className="bg-amber-400 text-white font-bold py-1 px-2 rounded">C (Alerte)</div>
                </div>
                <div className="grid grid-cols-2 text-xs p-2 items-center">
                   <div className="font-mono text-slate-600">{">"} 7.10 mm/s</div>
                   <div className="bg-red-500 text-white font-bold py-1 px-2 rounded">D (Danger)</div>
                </div>
             </div>
          </div>
        );
        break;
      case 'sensor-mounting':
        visualContent = (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
             <h3 className="font-bold text-slate-700 mb-6 uppercase tracking-widest text-sm flex items-center gap-2">Montage Capteur</h3>
             <svg viewBox="0 0 400 200" className="w-full max-w-sm h-auto drop-shadow-sm">
               {/* Surface */}
               <rect x="50" y="150" width="300" height="40" fill="#cbd5e1" rx="4" />
               <text x="200" y="175" textAnchor="middle" className="text-xs font-bold fill-slate-500">CARTER MACHINE</text>
               
               {/* Stud Mounted */}
               <g transform="translate(80, 50)">
                 <rect x="0" y="0" width="40" height="60" fill="#3b82f6" rx="4" />
                 <rect x="15" y="60" width="10" height="40" fill="#94a3b8" />
                 <text x="20" y="-10" textAnchor="middle" className="text-[10px] font-bold fill-slate-600">Goujon</text>
                 <text x="20" y="80" textAnchor="middle" className="text-[9px] font-bold fill-emerald-600">Fmax: 20 kHz</text>
               </g>

               {/* Magnet Mounted */}
               <g transform="translate(180, 50)">
                 <rect x="0" y="0" width="40" height="60" fill="#3b82f6" rx="4" />
                 <rect x="0" y="60" width="40" height="40" fill="#475569" rx="2" />
                 <text x="20" y="-10" textAnchor="middle" className="text-[10px] font-bold fill-slate-600">Aimant</text>
                 <text x="20" y="80" textAnchor="middle" className="text-[9px] font-bold fill-amber-600">Fmax: 5 kHz</text>
               </g>

               {/* Probe Mounted */}
               <g transform="translate(280, 50)">
                 <rect x="0" y="0" width="40" height="60" fill="#3b82f6" rx="4" />
                 <polygon points="15,60 25,60 20,100" fill="#ef4444" />
                 <text x="20" y="-10" textAnchor="middle" className="text-[10px] font-bold fill-slate-600">Pointe</text>
                 <text x="20" y="80" textAnchor="middle" className="text-[9px] font-bold fill-red-600">Fmax: 1 kHz</text>
               </g>
             </svg>
          </div>
        );
        break;
      case 'bearing-defects':
        visualContent = (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
             <h3 className="font-bold text-slate-700 mb-6 uppercase tracking-widest text-sm flex items-center gap-2">Fréquences Roulement</h3>
             <svg viewBox="0 0 300 300" className="w-full max-w-sm h-auto drop-shadow-sm">
                <circle cx="150" cy="150" r="120" fill="none" stroke="#94a3b8" strokeWidth="20" />
                <circle cx="150" cy="150" r="70" fill="none" stroke="#475569" strokeWidth="20" />
                
                {/* Balls */}
                <circle cx="150" cy="55" r="15" fill="#3b82f6" />
                <circle cx="232" cy="102" r="15" fill="#3b82f6" />
                <circle cx="232" cy="198" r="15" fill="#3b82f6" />
                <circle cx="150" cy="245" r="15" fill="#3b82f6" />
                <circle cx="68" cy="198" r="15" fill="#3b82f6" />
                <circle cx="68" cy="102" r="15" fill="#3b82f6" />
                
                {/* Annotations */}
                <line x1="150" y1="20" x2="150" y2="40" stroke="#ef4444" strokeWidth="3" markerStart="url(#arrow)" />
                <text x="150" y="10" textAnchor="middle" className="text-xs font-bold fill-red-500">BPFO (Externe)</text>
                
                <line x1="150" y1="80" x2="150" y2="100" stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrow)" />
                <text x="150" y="115" textAnchor="middle" className="text-xs font-bold fill-red-500">BPFI (Interne)</text>

                <line x1="40" y1="198" x2="60" y2="198" stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrow)" />
                <text x="35" y="202" textAnchor="end" className="text-xs font-bold fill-red-500">BSF (Bille)</text>
             </svg>
          </div>
        );
        break;
      case 'laser-alignment':
        visualContent = (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
             <h3 className="font-bold text-slate-700 mb-6 uppercase tracking-widest text-sm flex items-center gap-2">Alignement Laser</h3>
             <svg viewBox="0 0 400 200" className="w-full max-w-sm h-auto drop-shadow-sm">
                <rect x="20" y="100" width="160" height="20" fill="#94a3b8" />
                <rect x="220" y="100" width="160" height="20" fill="#94a3b8" />
                <rect x="180" y="90" width="40" height="40" fill="#475569" />
                
                <rect x="140" y="40" width="30" height="60" fill="#3b82f6" rx="4" />
                <rect x="230" y="40" width="30" height="60" fill="#3b82f6" rx="4" />
                
                <line x1="170" y1="50" x2="230" y2="70" stroke="#ef4444" strokeWidth="2" strokeDasharray="4" />
                <circle cx="170" cy="50" r="3" fill="#ef4444" />
                
                <line x1="20" y1="110" x2="380" y2="110" stroke="#334155" strokeWidth="1" strokeDasharray="10 5" />
             </svg>
          </div>
        );
        break;
      case 'image':
        visualContent = currentSlide.imageUrl ? (
          <div className="w-full h-full p-2 flex flex-col items-center justify-center">
            <img src={currentSlide.imageUrl} alt={currentSlide.title} className="w-full h-full object-cover rounded-xl shadow-sm border border-slate-200" />
          </div>
        ) : null;
        break;
      case 'quiz':
        visualContent = <QuizComponent quizData={currentSlide.quizData} />;
        break;
      default:
        visualContent = (
           <div className="text-slate-400 font-mono border border-slate-300 p-4 border-dashed rounded opacity-50 flex items-center gap-2">
               <Play className="w-4 h-4"/> 
               Render: {type.toUpperCase()} Component
           </div>
        );
    }
    
    return (
      <div className="w-full h-full bg-slate-50/80 rounded-2xl border-2 border-slate-100 flex flex-col items-center justify-center relative shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] min-h-[400px]">
         <div className="absolute top-3 right-3 flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200 z-10">
            <span className="animate-pulse w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Démo Active</span>
         </div>
         {visualContent}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* HEADER */}
      <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button onClick={onExit} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors" title="Quitter et retourner au simulateur">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-600 font-bold font-serif shadow-sm">
               2
             </div>
             <div>
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{currentSlide.part}</div>
                <div className="text-sm font-bold text-slate-800">Analyse Vibratoire Niveau 2</div>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded px-2 py-1">
            <List className="w-4 h-4 text-slate-500" />
            <select 
              value={currentSlideIndex}
              onChange={(e) => setCurrentSlideIndex(Number(e.target.value))}
              className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer max-w-[200px]"
              title="Naviguer vers un slide précis"
            >
              {COURSE_SLIDES.map((s, i) => (
                <option key={s.id} value={i}>{i + 1}. {s.title.substring(0, 40)}{s.title.length > 40 ? '...' : ''}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={() => setShowNotes(!showNotes)}
            className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${showNotes ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <Presentation className="w-4 h-4" />
            Notes
          </button>
          <button onClick={toggleFullscreen} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* PROGRESS BAR */}
      <div className="h-1 bg-slate-200 w-full shrink-0">
        <div 
          className="h-full bg-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${((currentSlideIndex + 1) / COURSE_SLIDES.length) * 100}%` }}
        />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* SLIDE CONTENT */}
        <div className={`flex-1 flex flex-col p-8 lg:p-12 overflow-y-auto transition-colors duration-500 ${currentSlide.isCover ? 'bg-[#10416B] text-white justify-center items-center' : 'bg-white text-slate-900'}`}>
           <div className={`max-w-6xl w-full mx-auto flex flex-col ${currentSlide.isCover ? 'items-center text-center' : 'h-full'}`}>
              
              {/* Slide Header */}
              {!currentSlide.isCover && currentSlide.part !== 'Introduction' && (
                <div className="mb-8 shrink-0 border-b border-slate-100 pb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-widest uppercase mb-4">
                    {currentSlide.part}
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-800 tracking-tight">
                    {currentSlide.title}
                  </h2>
                  {currentSlide.subtitle && (
                    <p className="text-xl text-slate-500 mt-2">{currentSlide.subtitle}</p>
                  )}
                </div>
              )}

              {/* Slide Body */}
              {currentSlide.isCover ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="text-emerald-400 font-bold tracking-[0.2em] uppercase text-sm mb-4">
                    {currentSlide.part}
                  </div>
                  <h1 className="text-5xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight">
                    {currentSlide.title}
                  </h1>
                  <div className="w-24 h-1 bg-emerald-500 rounded-full my-8"></div>
                  <div className="text-xl text-blue-100 max-w-3xl leading-relaxed opacity-90">
                    {/* Extract the text from the content to avoid slate-700 classes */}
                    {React.isValidElement(currentSlide.content) 
                      ? currentSlide.content 
                      : <div dangerouslySetInnerHTML={{ __html: String(currentSlide.content).replace(/text-slate-700/g, 'text-blue-100') }} />}
                  </div>
                </div>
              ) : (
                <div className={`flex-1 flex ${currentSlide.visualType && currentSlide.visualType !== 'none' ? 'flex-col lg:flex-row gap-8' : ''}`}>
                   <div className={`flex-1 max-w-none prose prose-slate prose-lg ${currentSlide.visualType && currentSlide.visualType !== 'none' ? 'lg:w-1/2' : ''}`}>
                      {currentSlide.content}
                   </div>
                   
                   {currentSlide.visualType && currentSlide.visualType !== 'none' && (
                     <div className="lg:w-1/2 shrink-0 flex items-center justify-center bg-slate-50 rounded-xl p-4 border border-slate-100">
                       {renderVisualDemo(currentSlide.visualType)}
                     </div>
                   )}
                </div>
              )}
           </div>
        </div>

        {/* PRESENTER NOTES PANEL */}
        {showNotes && (
          <div className="w-80 bg-slate-50 border-l border-slate-200 flex flex-col shrink-0 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
            <div className="p-4 border-b border-slate-200 bg-white flex items-center gap-2 text-amber-600 font-bold">
              <Info className="w-5 h-5" />
              Notes Formateur
            </div>
            <div className="p-6 overflow-y-auto text-sm text-slate-700 leading-relaxed font-serif bg-amber-50/30 h-full">
              {currentSlide.notes || (
                <span className="text-slate-400 italic">Aucune note pour cette diapositive.</span>
              )}
            </div>
          </div>
        )}

      </div>

      {/* FOOTER NAVIGATION */}
      <footer className="h-16 border-t border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 z-10">
         <div className="flex items-center gap-2 text-slate-400 text-xs font-mono font-medium">
            <span>OCP MS — Niveau 2</span>
         </div>
         <div className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentSlideIndex(prev => Math.max(prev - 1, 0))}
              disabled={currentSlideIndex === 0}
              className="p-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-slate-100 rounded-full transition-colors text-slate-700"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setCurrentSlideIndex(prev => Math.min(prev + 1, COURSE_SLIDES.length - 1))}
              disabled={currentSlideIndex === COURSE_SLIDES.length - 1}
              className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:hover:bg-blue-600 rounded-full transition-colors shadow-md text-white"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
         </div>
      </footer>
    </div>
  );
}
