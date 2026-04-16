/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Heart, 
  Settings as SettingsIcon, 
  Home, 
  ChevronRight,
  BookMarked,
  Brain,
  CheckCircle2,
  Clock,
  Volume2,
  Languages
} from 'lucide-react';
import { cn } from './lib/utils';
import { JLPTLevel, UserSettings, DailyContent, FavoriteItem, Word, GrammarPoint, Exercise } from './types';
import { storage } from './services/storage';
import { generateDailyContent, textToSpeech } from './services/geminiService';

// --- Components ---

const NavItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-4 py-2 transition-all border-b-2",
      active ? "border-ink text-ink font-bold" : "border-transparent text-muted hover:text-ink"
    )}
  >
    <Icon size={18} />
    <span className="text-xs uppercase tracking-widest">{label}</span>
  </button>
);

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-card border border-border p-6 rounded-sm", className)}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'outline' }) => (
  <span className={cn(
    "px-3 py-1 text-[11px] font-black uppercase tracking-tighter",
    variant === 'default' ? "bg-ink text-white" : "border border-ink text-ink"
  )}>
    {children}
  </span>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'favorites' | 'settings'>('home');
  const [settings, setSettings] = useState<UserSettings>(storage.getSettings());
  const [dailyContent, setDailyContent] = useState<DailyContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteItem[]>(storage.getFavorites());
  const [showLevelSelect, setShowLevelSelect] = useState(!localStorage.getItem('jlpt_settings'));

  useEffect(() => {
    if (!showLevelSelect) {
      loadDailyContent();
    }
  }, [settings.jlptLevel, showLevelSelect]);

  const loadDailyContent = async () => {
    const today = new Date().toISOString().split('T')[0];
    const cached = storage.getDailyCache(today, settings.jlptLevel);
    
    if (cached) {
      setDailyContent(cached);
    } else {
      setLoading(true);
      try {
        const content = await generateDailyContent(settings.jlptLevel, settings.preferredExerciseTypes);
        setDailyContent(content);
        storage.setDailyCache(content);
      } catch (error) {
        console.error("Failed to load content", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleFavorite = (type: 'word' | 'grammar' | 'exercise', item: any) => {
    const isFav = favorites.some(f => f.id === item.id);
    if (isFav) {
      storage.removeFavorite(item.id);
      setFavorites(prev => prev.filter(f => f.id !== item.id));
    } else {
      const newFav: FavoriteItem = {
        id: item.id,
        type,
        content: item,
        savedAt: Date.now()
      };
      storage.addFavorite(newFav);
      setFavorites(prev => [...prev, newFav]);
    }
  };

  if (showLevelSelect) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-100">
            <Languages className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">欢迎来到 JLPT Daily</h1>
          <p className="text-gray-500 mb-10">选择您的目标级别，我们将为您量身定制每日学习内容。</p>
          
          <div className="grid grid-cols-1 gap-4 mb-10">
            {(['N1', 'N2', 'N3', 'N4', 'N5'] as JLPTLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => {
                  const newSettings = { ...settings, jlptLevel: level };
                  setSettings(newSettings);
                  storage.saveSettings(newSettings);
                  setShowLevelSelect(false);
                }}
                className="flex items-center justify-between p-5 bg-white border-2 border-gray-100 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-xl font-black text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                    {level}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900">{level} 级别</div>
                    <div className="text-xs text-gray-400">
                      {level === 'N1' ? '高级 - 能够理解各种场景下的日语' : 
                       level === 'N2' ? '中高级 - 能够理解日常生活及更广泛场景' :
                       level === 'N3' ? '中级 - 能够一定程度上理解日常生活场景' :
                       level === 'N4' ? '初中级 - 能够理解基本的日语' :
                       '初级 - 能够理解一些基本的日语'}
                    </div>
                  </div>
                </div>
                <ChevronRight className="text-gray-300 group-hover:text-indigo-500" />
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <nav className="px-10 py-8 border-b border-border flex items-center justify-between bg-bg">
        <div className="logo text-2xl font-black tracking-tighter uppercase">結 KIZUNA</div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Goal</span>
            <Badge>JLPT {settings.jlptLevel}</Badge>
          </div>
          <div className="hidden md:flex items-center gap-2 border-l border-border pl-6">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-6 h-6 rounded-full border border-bg bg-border overflow-hidden">
                  <img src={`https://picsum.photos/seed/user${i}/100/100`} alt="user" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">1.2k Active</span>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Main Content */}
        <main className="flex-1 px-10 py-12 md:border-r border-border max-w-5xl">
          <div className="flex gap-8 mb-12 border-b border-border pb-8">
            <button onClick={() => setActiveTab('home')} className={cn("text-xs font-black uppercase tracking-widest pb-2 border-b-2 transition-all", activeTab === 'home' ? "border-ink text-ink" : "border-transparent text-muted")}>Daily Hub</button>
            <button onClick={() => setActiveTab('favorites')} className={cn("text-xs font-black uppercase tracking-widest pb-2 border-b-2 transition-all", activeTab === 'favorites' ? "border-ink text-ink" : "border-transparent text-muted")}>Favorites</button>
            <button onClick={() => setActiveTab('settings')} className={cn("text-xs font-black uppercase tracking-widest pb-2 border-b-2 transition-all", activeTab === 'settings' ? "border-ink text-ink" : "border-transparent text-muted")}>Settings</button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div 
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-16"
              >
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-8 h-8 border-2 border-border border-t-ink rounded-full animate-spin" />
                    <p className="text-muted text-xs font-bold uppercase tracking-widest">Generating content...</p>
                  </div>
                ) : dailyContent ? (
                  <>
                    {/* Vocabulary Section */}
                    <section>
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Word of the Day</h3>
                        <button 
                          onClick={() => {
                            storage.setDailyCache({ ...dailyContent!, date: '' });
                            loadDailyContent();
                          }}
                          className="text-[10px] font-bold text-muted hover:text-ink uppercase tracking-widest flex items-center gap-1"
                        >
                          <Clock size={12} /> Refresh
                        </button>
                      </div>
                      <div className="space-y-12">
                        {dailyContent.words.map((word) => (
                          <div key={word.id} className="flex flex-col md:flex-row md:items-baseline gap-6 group">
                            <div className="text-8xl md:text-[120px] font-black tracking-tighter leading-none text-ink">
                              {word.kanji}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-2">
                                <h2 className="text-xl font-bold">{word.reading} ({word.meaning})</h2>
                                <button 
                                  onClick={() => toggleFavorite('word', word)}
                                  className={cn(
                                    "transition-colors",
                                    favorites.some(f => f.id === word.id) ? "text-accent" : "text-border hover:text-muted"
                                  )}
                                >
                                  <Heart size={20} fill={favorites.some(f => f.id === word.id) ? "currentColor" : "none"} />
                                </button>
                              </div>
                              <p className="font-serif italic text-muted text-lg leading-relaxed max-w-xl">
                                {word.example}<br/>
                                <span className="text-sm not-italic opacity-60">— {word.exampleMeaning}</span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Grammar Section */}
                    <section className="bg-ink text-white p-10 rounded-sm">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50 mb-6">Grammar Focus</h4>
                      {dailyContent.grammar.map((g) => (
                        <div key={g.id}>
                          <div className="flex justify-between items-start mb-6">
                            <h2 className="text-4xl font-light tracking-tight">{g.title}</h2>
                            <button 
                              onClick={() => toggleFavorite('grammar', g)}
                              className={cn(
                                "transition-colors",
                                favorites.some(f => f.id === g.id) ? "text-accent" : "text-white/20 hover:text-white/40"
                              )}
                            >
                              <Heart size={24} fill={favorites.some(f => f.id === g.id) ? "currentColor" : "none"} />
                            </button>
                          </div>
                          <p className="font-serif italic text-white/70 text-xl mb-8 leading-relaxed">{g.explanation}</p>
                          <div className="border-t border-white/10 pt-6">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Example</div>
                            <div className="text-lg mb-1">{g.example}</div>
                            <div className="text-sm text-white/30">{g.exampleMeaning}</div>
                          </div>
                        </div>
                      ))}
                    </section>

                    {/* Exercises Section */}
                    <section>
                      <h3 className="text-xs font-bold text-muted uppercase tracking-[0.2em] mb-8">Practice Grid</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dailyContent.exercises.map((ex, idx) => (
                          <ExerciseCard 
                            key={ex.id} 
                            index={idx + 1}
                            exercise={ex} 
                            onFavorite={() => toggleFavorite('exercise', ex)}
                            isFavorite={favorites.some(f => f.id === ex.id)}
                          />
                        ))}
                      </div>
                    </section>
                  </>
                ) : (
                  <div className="text-center py-20">
                    <p className="text-muted uppercase text-xs tracking-widest">Failed to load content</p>
                    <button onClick={loadDailyContent} className="mt-4 px-8 py-3 border border-ink text-xs font-black uppercase tracking-widest hover:bg-ink hover:text-white transition-all">Retry</button>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'favorites' && (
              <motion.div 
                key="favorites"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-12"
              >
                <h3 className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Saved Items</h3>
                {favorites.length === 0 ? (
                  <div className="py-20 border border-dashed border-border flex flex-col items-center justify-center text-muted">
                    <Heart size={32} className="mb-4 opacity-20" />
                    <p className="text-xs uppercase tracking-widest font-bold">No favorites yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-1">
                    {favorites.sort((a, b) => b.savedAt - a.savedAt).map((fav) => (
                      <div key={fav.id} className="group flex items-center justify-between py-4 border-b border-border hover:bg-sidebar px-4 transition-colors">
                        <div className="flex items-center gap-6">
                          <span className="text-[10px] font-bold text-muted w-12 uppercase tracking-tighter">{fav.type}</span>
                          <div>
                            {fav.type === 'word' && <span className="text-xl font-bold">{(fav.content as Word).kanji}</span>}
                            {fav.type === 'grammar' && <span className="text-lg font-bold">{(fav.content as GrammarPoint).title}</span>}
                            {fav.type === 'exercise' && <span className="text-sm font-bold">{(fav.content as Exercise).question}</span>}
                          </div>
                        </div>
                        <button onClick={() => toggleFavorite(fav.type, fav.content)} className="text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                          <Heart size={16} fill="currentColor" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-16"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  <div className="space-y-8">
                    <section>
                      <h4 className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-6">JLPT Target</h4>
                      <div className="flex flex-wrap gap-2">
                        {(['N1', 'N2', 'N3', 'N4', 'N5'] as JLPTLevel[]).map(level => (
                          <button
                            key={level}
                            onClick={() => {
                              const newSettings = { ...settings, jlptLevel: level };
                              setSettings(newSettings);
                              storage.saveSettings(newSettings);
                            }}
                            className={cn(
                              "w-12 h-12 flex items-center justify-center text-sm font-black transition-all border",
                              settings.jlptLevel === level ? "bg-ink text-white border-ink" : "bg-white text-muted border-border hover:border-muted"
                            )}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h4 className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-6">Daily Reminder</h4>
                      <div className="text-6xl font-serif italic tracking-tighter mb-4">{settings.reminderTime}</div>
                      <input 
                        type="time" 
                        value={settings.reminderTime}
                        onChange={(e) => {
                          const newSettings = { ...settings, reminderTime: e.target.value };
                          setSettings(newSettings);
                          storage.saveSettings(newSettings);
                        }}
                        className="text-xs font-bold uppercase tracking-widest text-muted hover:text-ink cursor-pointer bg-transparent border-none focus:outline-none"
                      />
                    </section>
                  </div>

                  <section>
                    <h4 className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-6">Practice Mix</h4>
                    <div className="space-y-4">
                      {(['vocabulary', 'grammar', 'reading', 'listening'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => {
                            const types = settings.preferredExerciseTypes.includes(type)
                              ? settings.preferredExerciseTypes.filter(t => t !== type)
                              : [...settings.preferredExerciseTypes, type];
                            if (types.length === 0) return;
                            const newSettings = { ...settings, preferredExerciseTypes: types };
                            setSettings(newSettings);
                            storage.saveSettings(newSettings);
                          }}
                          className="flex items-center gap-4 group"
                        >
                          <div className={cn(
                            "w-4 h-4 rounded-full border transition-all",
                            settings.preferredExerciseTypes.includes(type) ? "bg-accent border-accent" : "border-ink"
                          )} />
                          <span className={cn(
                            "text-sm uppercase tracking-widest transition-colors",
                            settings.preferredExerciseTypes.includes(type) ? "font-black text-ink" : "text-muted group-hover:text-ink"
                          )}>{type}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="pt-12 border-t border-border">
                  <button 
                    onClick={() => {
                      if (confirm("Reset all data?")) {
                        localStorage.clear();
                        window.location.reload();
                      }
                    }}
                    className="text-[10px] font-bold text-muted hover:text-accent uppercase tracking-[0.2em] transition-colors"
                  >
                    Reset System Data
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Sidebar */}
        <aside className="hidden lg:flex w-[320px] bg-sidebar p-10 flex-col gap-12 border-l border-border">
          <section>
            <h4 className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-6">Quick Stats</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-baseline border-b border-border pb-2">
                <span className="text-xs font-bold text-muted uppercase">Streak</span>
                <span className="text-2xl font-serif italic">12 Days</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-border pb-2">
                <span className="text-xs font-bold text-muted uppercase">Mastery</span>
                <span className="text-2xl font-serif italic">64%</span>
              </div>
            </div>
          </section>

          <section>
            <h4 className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-6">Recent Favorites</h4>
            <div className="space-y-2">
              {favorites.slice(0, 4).map(fav => (
                <div key={fav.id} className="text-sm py-2 border-b border-ink/5 flex justify-between items-center">
                  <span className="font-bold">
                    {fav.type === 'word' && (fav.content as Word).kanji}
                    {fav.type === 'grammar' && (fav.content as GrammarPoint).title}
                    {fav.type === 'exercise' && 'Practice Item'}
                  </span>
                  <span className="text-[10px] text-muted uppercase">{fav.type}</span>
                </div>
              ))}
              {favorites.length === 0 && <p className="text-[10px] text-muted italic">No favorites yet</p>}
            </div>
          </section>

          <div className="mt-auto pt-12 text-[10px] font-bold text-muted uppercase tracking-widest">
            System Active • Ver 2.4.0
          </div>
        </aside>
      </div>
    </div>
  );
}

// --- Sub-components ---

function ExerciseCard({ exercise, onFavorite, isFavorite, index }: { exercise: Exercise, onFavorite: () => void, isFavorite: boolean, index: number, key?: React.Key }) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const isCorrect = selectedOption === exercise.answer;

  const playAudio = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      const base64 = await textToSpeech(exercise.question);
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = audioContext.createBuffer(1, bytes.length / 2, 24000);
      const nowBuffering = audioBuffer.getChannelData(0);
      
      // Convert raw PCM 16-bit to float
      const dataview = new DataView(bytes.buffer);
      for (let i = 0; i < audioBuffer.length; i++) {
        nowBuffering[i] = dataview.getInt16(i * 2, true) / 32768;
      }

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
    } catch (error) {
      console.error("Playback failed", error);
      setIsPlaying(false);
    }
  };

  return (
    <div className="bg-card border border-border p-8 rounded-sm hover:border-ink transition-all group cursor-pointer">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest">Practice {index.toString().padStart(2, '0')}</h3>
        <div className="flex items-center gap-3">
          {exercise.type === 'listening' && (
            <button 
              onClick={(e) => { e.stopPropagation(); playAudio(); }}
              className={cn(
                "p-2 rounded-full transition-all",
                isPlaying ? "bg-ink text-white animate-pulse" : "bg-border text-ink hover:bg-ink hover:text-white"
              )}
            >
              <Volume2 size={14} />
            </button>
          )}
          <Badge variant="outline">{exercise.type}</Badge>
          <button 
            onClick={(e) => { e.stopPropagation(); onFavorite(); }}
            className={cn(
              "transition-colors",
              isFavorite ? "text-accent" : "text-border hover:text-muted"
            )}
          >
            <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      <div className="text-2xl font-medium mb-8 leading-tight">
        {exercise.type === 'listening' && !showExplanation ? (
          <div className="flex items-center gap-4 text-muted italic text-lg">
            <Languages size={24} className="opacity-20" />
            Click the speaker icon to listen...
          </div>
        ) : (
          exercise.question
        )}
      </div>

      {exercise.options && (
        <div className="space-y-2 mb-8">
          {exercise.options.map((option, idx) => (
            <button
              key={idx}
              disabled={showExplanation}
              onClick={() => setSelectedOption(option)}
              className={cn(
                "w-full text-left p-4 border transition-all flex items-center justify-between",
                selectedOption === option 
                  ? (showExplanation 
                      ? (option === exercise.answer ? "border-green-500 bg-green-50" : "border-accent bg-accent/5")
                      : "border-ink bg-bg")
                  : (showExplanation && option === exercise.answer ? "border-green-500 bg-green-50" : "border-border hover:border-muted")
              )}
            >
              <span className="text-sm font-bold uppercase tracking-widest">{option}</span>
              {showExplanation && option === exercise.answer && <CheckCircle2 size={16} className="text-green-500" />}
            </button>
          ))}
        </div>
      )}

      {!showExplanation ? (
        <button
          disabled={!selectedOption}
          onClick={() => setShowExplanation(true)}
          className={cn(
            "w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] border transition-all",
            selectedOption 
              ? "bg-ink text-white border-ink" 
              : "bg-transparent text-muted border-border cursor-not-allowed"
          )}
        >
          Verify Answer
        </button>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-6 border-t border-border"
        >
          <div className={cn(
            "text-[10px] font-black uppercase tracking-widest mb-2",
            isCorrect ? "text-green-600" : "text-accent"
          )}>
            {isCorrect ? "Correct" : `Incorrect. Answer: ${exercise.answer}`}
          </div>
          <p className="font-serif italic text-muted text-sm leading-relaxed">
            {exercise.explanation}
          </p>
          <button 
            onClick={() => {
              setSelectedOption(null);
              setShowExplanation(false);
            }}
            className="mt-4 text-[10px] font-black text-ink uppercase tracking-widest hover:underline"
          >
            Retry
          </button>
        </motion.div>
      )}
    </div>
  );
}
