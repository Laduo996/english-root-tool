/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// import { GoogleGenAI } from "@google/genai";
import { 
  Plus, 
  Home,
  Search, 
  RotateCw, 
  Trash2, 
  BookOpen, 
  Image as ImageIcon, 
  Sparkles,
  ChevronRight,
  History,
  Info,
  Volume2,
  ExternalLink,
  Heart,
  Bookmark,
  Book,
  Globe,
  Link,
  Upload,
  Download,
  X,
  ChevronLeft,
  Calendar,
  CalendarCheck,
  Trophy,
  Target,
  CheckCircle2,
  XCircle,
  Library,
  Layers,
  Settings2,
  Shuffle,
  GitBranch,
  Dna
} from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "motion/react";
import { useState, useEffect, useRef, FormEvent, MouseEvent, ChangeEvent } from "react";
import { etymologyData, EtymItem } from "./etymologyData";

// --- Types ---

interface WordAnalysis {
  word: string;
  phoneticUK: string;
  phoneticUS: string;
  phonetic?: string; // Backward compatibility
  meaning: string;
  morphology: {
    prefix?: string;
    prefixMeaning?: string;
    root: string;
    rootMeaning: string;
    suffix?: string;
    suffixMeaning?: string;
  };
  synonyms: string[];
  antonyms: string[];
  familyWords: string[];
  rootApplications?: {
    word: string;
    translation: string;
  }[];
  prefixApplications?: {
    word: string;
    translation: string;
  }[];
  suffixApplications?: {
    word: string;
    translation: string;
  }[];
  collocations: {
    phrase: string;
    translation: string;
    example: string;
    exampleTranslation: string;
  }[];
  mnemonicPrompt: string;
}

interface FavoriteItem {
  type: 'word' | 'colloc' | 'root' | 'sentence';
  word: string;
  content: string;
  translation?: string;
  id: string;
}

interface Flashcard {
  id: string;
  analysis: WordAnalysis;
  imageUrl: string;
  createdAt: number;
  masteryStatus?: 'mastered' | 'learning';
}

// --- AI Service ---

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function analyzeWord(word: string): Promise<WordAnalysis> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the English word "${word}". Provide the following in JSON format:
    {
      "word": "${word}",
      "phoneticUK": "British IPA phonetic transcription (e.g., /hæp/)",
      "phoneticUS": "American IPA phonetic transcription (e.g., /hæp/)",
      "meaning": "Chinese meaning",
      "morphology": {
        "prefix": "The English prefix (e.g., 'un', 'pre'), leave empty if none. Ensure it's the exact string that combines with the root.",
        "prefixMeaning": "Chinese meaning of the prefix",
        "root": "The English core root or base word (e.g., 'struct', 'form'). This should be the main part of the word.",
        "rootMeaning": "Chinese meaning of the root",
        "suffix": "The English suffix (e.g., 'able', 'tion'), leave empty if none. Ensure it's the exact string that combines with the root.",
        "suffixMeaning": "Chinese meaning of the suffix"
      },
      "synonyms": ["3-4 English synonyms"],
      "antonyms": ["2-3 English antonyms"],
      "familyWords": ["3-4 English words sharing the same root"],
      "rootApplications": [
        {
          "word": "Another word using the same root (e.g., if root is 'struct', use 'construct')",
          "translation": "Chinese meaning of this word"
        },
        {
          "word": "Another word using the same root",
          "translation": "Chinese meaning"
        }
      ],
      "prefixApplications": [
        {
          "word": "Another word using the same prefix (e.g., if prefix is 'un', use 'unusual')",
          "translation": "Chinese meaning of this word"
        },
        {
          "word": "Another word using the same prefix",
          "translation": "Chinese meaning"
        }
      ],
      "suffixApplications": [
        {
          "word": "Another word using the same suffix (e.g., if suffix is 'able', use 'usable')",
          "translation": "Chinese meaning of this word"
        },
        {
          "word": "Another word using the same suffix",
          "translation": "Chinese meaning"
        }
      ],
      "collocations": [
        { 
          "phrase": "Common English collocation 1", 
          "translation": "Chinese translation",
          "example": "A simple English example sentence using this collocation",
          "exampleTranslation": "Chinese translation of the example"
        },
        { 
          "phrase": "Common English collocation 2", 
          "translation": "Chinese translation",
          "example": "A simple English example sentence using this collocation",
          "exampleTranslation": "Chinese translation of the example"
        },
        { 
          "phrase": "Common English collocation 3", 
          "translation": "Chinese translation",
          "example": "A simple English example sentence using this collocation",
          "exampleTranslation": "Chinese translation of the example"
        }
      ],
      "mnemonicPrompt": "A short, vivid visual description (English) to generate an image that helps remember this word's meaning. Focus on a single clear subject."
    }`,
    config: {
      responseMimeType: "application/json",
    },
  });

  return JSON.parse(response.text);
}

async function generateMnemonicImage(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: `A clean, high-quality 3D illustration or minimalist digital art of: ${prompt}. White background, vibrant colors, educational style.` },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Failed to generate image");
}

async function playPronunciation(text: string, accent: 'UK' | 'US' = 'US') {
  const voiceName = accent === 'UK' ? 'Fenrir' : 'Kore';
  const instruction = accent === 'UK' ? `Pronounce clearly in a British accent: ${text}` : `Pronounce clearly in an American accent: ${text}`;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: instruction }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioBuffer = audioContext.createBuffer(1, bytes.length / 2, 24000);
    const channelData = audioBuffer.getChannelData(0);
    
    const view = new DataView(bytes.buffer);
    for (let i = 0; i < channelData.length; i++) {
      channelData[i] = view.getInt16(i * 2, true) / 32768;
    }
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
  }
}

// --- Components ---

export default function App() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isFlipped, setIsFlipped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<'UK' | 'US' | null>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favFilter, setFavFilter] = useState<FavoriteItem['type'] | 'all'>('all');
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMonth, setViewMonth] = useState(new Date());
  const [showMastery, setShowMastery] = useState(false);
  const [masteryFilter, setMasteryFilter] = useState<'mastered' | 'learning'>('learning');
  const [view, setView] = useState<'dashboard' | 'home' | 'etymology' | 'dictionary'>('dashboard');
  const [discoveryRule, setDiscoveryRule] = useState<'history' | 'random' | 'root' | 'prefix' | 'suffix' | 'synonym'>('history');
  const [discoveryValue, setDiscoveryValue] = useState<string | null>(null);
  const [showDiscoverySettings, setShowDiscoverySettings] = useState(false);

  const DiscoverySettings = () => (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
          <Settings2 size={20} className="text-orange-500" />
          Discovery Rules
        </h3>
        <button 
          onClick={() => setShowDiscoverySettings(false)}
          className="p-2 hover:bg-gray-100 rounded-full transition-all"
        >
          <X size={20} className="text-gray-400" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-3">Next Card Strategy</span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'history', label: 'History', icon: <History size={14} />, desc: 'Sequential history' },
              { id: 'random', label: 'Random', icon: <Shuffle size={14} />, desc: 'AI random word' },
              { id: 'root', label: 'Same Root', icon: <GitBranch size={14} />, desc: 'Chain by root' },
              { id: 'prefix', label: 'Same Prefix', icon: <Layers size={14} />, desc: 'Chain by prefix' },
              { id: 'suffix', label: 'Same Suffix', icon: <Layers size={14} />, desc: 'Chain by suffix' },
              { id: 'synonym', label: 'Synonyms', icon: <Sparkles size={14} />, desc: 'Chain by meaning' },
            ].map((rule) => (
              <button
                key={rule.id}
                onClick={() => setDiscoveryRule(rule.id as any)}
                className={`p-3 rounded-2xl border-2 text-left transition-all ${
                  discoveryRule === rule.id 
                    ? 'border-orange-500 bg-orange-50/50 ring-4 ring-orange-500/10' 
                    : 'border-gray-50 bg-gray-50/50 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`${discoveryRule === rule.id ? 'text-orange-500' : 'text-gray-400'}`}>
                    {rule.icon}
                  </div>
                  <span className={`text-xs font-black ${discoveryRule === rule.id ? 'text-orange-600' : 'text-gray-600'}`}>
                    {rule.label}
                  </span>
                </div>
                <p className="text-[9px] text-gray-400 font-bold leading-tight">{rule.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {discoveryRule !== 'history' && discoveryRule !== 'random' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100"
          >
            <div className="flex items-center gap-2 mb-2">
              <Dna size={14} className="text-blue-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Active Chain</span>
            </div>
            <p className="text-xs font-bold text-blue-900 leading-relaxed">
              Swiping "Next" will now trigger the AI to find a word that shares the same 
              <span className="text-blue-600 mx-1 uppercase">{discoveryRule}</span> 
              as the current word.
            </p>
          </motion.div>
        )}
      </div>

      <button 
        onClick={() => setShowDiscoverySettings(false)}
        className="w-full py-3 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg"
      >
        Apply Rules
      </button>
    </div>
  );

  const FlashcardView = () => {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
    
    // Mastery feedback transforms
    const masteredOpacity = useTransform(x, [50, 150], [0, 1]);
    const learningOpacity = useTransform(x, [-150, -50], [1, 0]);

    const handleSwipe = (direction: 'left' | 'right') => {
      if (!currentCard) return;
      if (direction === 'right') {
        updateMastery(null, currentCard.id, 'mastered');
        handleNextCard();
      } else {
        updateMastery(null, currentCard.id, 'learning');
        handleNextCard();
      }
    };

    return (
      <div className="flex flex-col items-center gap-8">
        <div className="flex items-center justify-between w-full max-w-md mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 leading-none mb-1 uppercase tracking-tight">Smart Study</h2>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mode:</span>
                <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-1.5 py-0.5 rounded">
                  {discoveryRule}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowDiscoverySettings(!showDiscoverySettings)}
            className={`p-3 rounded-xl transition-all ${showDiscoverySettings ? 'bg-orange-500 text-white shadow-lg' : 'bg-white border border-gray-100 text-gray-400 hover:text-orange-500 hover:border-orange-100 shadow-sm'}`}
          >
            <Settings2 size={20} />
          </button>
        </div>

        {showDiscoverySettings ? (
          <div className="w-full max-w-md">
            <DiscoverySettings />
          </div>
        ) : (
          <>
            {error && (
              <div className="w-full max-w-md bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-center gap-2">
                <Info size={16} />
                {error}
              </div>
            )}

            {currentCard ? (
              <div className="w-full max-w-md perspective-1000 relative">
                {/* Swipe Indicators */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevCard();
                  }}
                  className="absolute -left-16 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 opacity-20 hover:opacity-100 transition-all hidden md:flex z-30 group"
                >
                  <ChevronLeft size={32} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                  <span className="text-[10px] font-bold text-gray-400 group-hover:text-orange-500 uppercase tracking-widest transition-colors">Back</span>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextCard();
                  }}
                  className="absolute -right-16 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 opacity-20 hover:opacity-100 transition-all hidden md:flex z-30 group"
                >
                  <ChevronRight size={32} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                  <span className="text-[10px] font-bold text-gray-400 group-hover:text-orange-500 uppercase tracking-widest transition-colors">Next</span>
                </button>

                {/* Swipe Feedback Labels */}
                <motion.div 
                  style={{ opacity: masteredOpacity }}
                  className="absolute top-1/2 left-full ml-8 -translate-y-1/2 z-40 pointer-events-none hidden lg:block"
                >
                  <div className="px-6 py-3 bg-green-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl rotate-12">
                    Mastered
                  </div>
                </motion.div>
                <motion.div 
                  style={{ opacity: learningOpacity }}
                  className="absolute top-1/2 right-full mr-8 -translate-y-1/2 z-40 pointer-events-none hidden lg:block"
                >
                  <div className="px-6 py-3 bg-orange-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl -rotate-12">
                    Learning
                  </div>
                </motion.div>

                <motion.div
                  className="relative w-full aspect-[3/4] cursor-pointer preserve-3d"
                  style={{ x, rotate, opacity, touchAction: 'none' }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.9}
                  onDragEnd={(_, info) => {
                    const threshold = 120;
                    if (info.offset.x > threshold) {
                      handleSwipe('right');
                    } else if (info.offset.x < -threshold) {
                      handleSwipe('left');
                    }
                  }}
                  animate={{ 
                    rotateY: isFlipped ? 180 : 0,
                  }}
                  whileDrag={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  {/* Front Side */}
                  <div className="absolute inset-0 backface-hidden bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 flex flex-col overflow-hidden">
                    {/* Mastery Buttons */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between z-20">
                      <button 
                        onClick={(e) => updateMastery(e, currentCard.id, 'mastered')}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${currentCard.masteryStatus === 'mastered' ? 'bg-green-500 text-white shadow-lg' : 'bg-white/80 backdrop-blur-sm text-gray-400 hover:text-green-500'}`}
                      >
                        已掌握
                      </button>
                      <button 
                        onClick={(e) => updateMastery(e, currentCard.id, 'learning')}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${currentCard.masteryStatus === 'learning' || !currentCard.masteryStatus ? 'bg-orange-500 text-white shadow-lg' : 'bg-white/80 backdrop-blur-sm text-gray-400 hover:text-orange-500'}`}
                      >
                        未掌握
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-8 pt-4">
                      {/* Image */}
                      <div className="w-full aspect-video rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center relative group">
                        <img 
                          src={currentCard.imageUrl} 
                          alt={currentCard.analysis.word}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      
                      {/* Word + Phonetics */}
                      <div className="text-center space-y-4">
                        <div className="flex items-center justify-center gap-3">
                          <h2 className="text-4xl font-black tracking-tight text-gray-900">
                            {currentCard.analysis.word}
                          </h2>
                          <button 
                            onClick={(e) => toggleFavorite(e, 'word', currentCard.analysis.word, currentCard.analysis.word)}
                            className="p-1.5 rounded-full transition-all hover:bg-red-50"
                          >
                            <Heart 
                              size={24} 
                              className={`transition-all ${isFavorited('word', currentCard.analysis.word, currentCard.analysis.word) ? 'fill-red-500 text-red-500 scale-110' : 'text-gray-300 hover:text-red-400'}`} 
                            />
                          </button>
                        </div>
                        <div className="flex items-center justify-center gap-4 text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-widest">UK</span>
                            <span className="text-sm font-medium text-gray-600">{currentCard.analysis.phoneticUK}</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); playPronunciation(currentCard.analysis.word, 'UK'); }}
                              className="p-1 hover:bg-gray-100 rounded-full transition-all"
                            >
                              <Volume2 size={16} className="text-orange-500 opacity-50 hover:opacity-100" />
                            </button>
                          </div>
                          <div className="h-3 w-[1px] bg-gray-200"></div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-widest">US</span>
                            <span className="text-sm font-medium text-gray-600">{currentCard.analysis.phoneticUS}</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); playPronunciation(currentCard.analysis.word, 'US'); }}
                              className="p-1 hover:bg-gray-100 rounded-full transition-all"
                            >
                              <Volume2 size={16} className="text-orange-500 opacity-50 hover:opacity-100" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Definition */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">Definition</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 leading-tight">
                          {currentCard.analysis.meaning}
                        </p>
                      </div>

                      {/* Structure Tree */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">Structure Tree</span>
                          <div className="h-[1px] flex-1 bg-orange-100/50"></div>
                        </div>
                        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                          <div className="flex flex-wrap items-center justify-center gap-3">
                            {currentCard.analysis.morphology.prefix && (
                              <>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDiscoveryRule('prefix');
                                    setDiscoveryValue(currentCard.analysis.morphology.prefix || null);
                                    handleNextCard();
                                  }}
                                  className="flex flex-col items-center group"
                                >
                                  <div className="px-4 py-2 bg-white border border-gray-100 rounded-xl shadow-sm group-hover:border-blue-200 group-hover:shadow-md transition-all">
                                    <div className="text-sm font-black text-blue-600">{currentCard.analysis.morphology.prefix}</div>
                                  </div>
                                  <div className="w-[1px] h-3 bg-gray-200 my-1"></div>
                                  <div className="px-2 py-1 bg-blue-50/50 rounded-lg text-[9px] font-bold text-blue-600/70 whitespace-nowrap">
                                    {currentCard.analysis.morphology.prefixMeaning}
                                  </div>
                                </button>
                                <span className="text-gray-300 font-light">+</span>
                              </>
                            )}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setDiscoveryRule('root');
                                setDiscoveryValue(currentCard.analysis.morphology.root);
                                handleNextCard();
                              }}
                              className="flex flex-col items-center group"
                            >
                              <div className="px-4 py-2 bg-white border border-gray-100 rounded-xl shadow-sm group-hover:border-orange-200 group-hover:shadow-md transition-all">
                                <div className="text-sm font-black text-orange-600">{currentCard.analysis.morphology.root}</div>
                              </div>
                              <div className="w-[1px] h-3 bg-gray-200 my-1"></div>
                              <div className="px-2 py-1 bg-orange-50/50 rounded-lg text-[9px] font-bold text-orange-600/70 whitespace-nowrap">
                                {currentCard.analysis.morphology.rootMeaning}
                              </div>
                            </button>
                            {currentCard.analysis.morphology.suffix && (
                              <>
                                <span className="text-gray-300 font-light">+</span>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDiscoveryRule('suffix');
                                    setDiscoveryValue(currentCard.analysis.morphology.suffix || null);
                                    handleNextCard();
                                  }}
                                  className="flex flex-col items-center group"
                                >
                                  <div className="px-4 py-2 bg-white border border-gray-100 rounded-xl shadow-sm group-hover:border-green-200 group-hover:shadow-md transition-all">
                                    <div className="text-sm font-black text-green-600">{currentCard.analysis.morphology.suffix}</div>
                                  </div>
                                  <div className="w-[1px] h-3 bg-gray-200 my-1"></div>
                                  <div className="px-2 py-1 bg-green-50/50 rounded-lg text-[9px] font-bold text-green-600/70 whitespace-nowrap">
                                    {currentCard.analysis.morphology.suffixMeaning}
                                  </div>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className="absolute inset-0 backface-hidden bg-white rounded-3xl shadow-xl border border-gray-100 p-6 flex flex-col rotate-y-180 overflow-hidden">
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-6">
                      {/* Section 1: Collocations */}
                      <section>
                        <div className="flex items-center gap-2 mb-3">
                          <Target size={18} className="text-orange-500" />
                          <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Common Collocations</h3>
                          <div className="h-[1px] flex-1 bg-orange-100/50 ml-2"></div>
                        </div>
                        <div className="space-y-2">
                          {currentCard.analysis.collocations.map((col, idx) => (
                            <div key={idx} className="group/col bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 hover:border-orange-100 hover:bg-orange-50/30 transition-all">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-black text-gray-900 group-hover/col:text-orange-600 transition-colors">
                                    {col.phrase}
                                  </span>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); playPronunciation(col.phrase, 'US'); }}
                                    className="p-1 hover:bg-white rounded-full transition-all shadow-sm"
                                  >
                                    <Volume2 size={12} className="text-orange-500" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-gray-400">{col.translation}</span>
                                  <button 
                                    onClick={(e) => toggleFavorite(e, 'colloc', col.phrase, currentCard.analysis.word, col.translation)}
                                    className="p-1 hover:bg-white rounded-full transition-all shadow-sm"
                                  >
                                    <Heart 
                                      size={14} 
                                      className={isFavorited('colloc', col.phrase, currentCard.analysis.word) ? 'fill-red-500 text-red-500' : 'text-gray-300'} 
                                    />
                                  </button>
                                </div>
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-[11px] text-gray-600 font-medium leading-tight italic">"{col.example}"</p>
                                <p className="text-[9px] text-gray-400 font-bold">{col.exampleTranslation}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      {/* Section 2: Morphology Applications */}
                      <section>
                        <div className="flex items-center gap-2 mb-4">
                          <GitBranch size={18} className="text-blue-500" />
                          <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Morphology Applications</h3>
                          <div className="h-[1px] flex-1 bg-blue-100/50 ml-2"></div>
                        </div>
                        <div className="space-y-3">
                          {/* Helper for highlighting */}
                          {(() => {
                            const renderHighlightedWord = (word: string, part: string, colorClass: string) => {
                              if (!part) return <span className="text-gray-900">{word}</span>;
                              const regex = new RegExp(`(${part})`, 'gi');
                              const parts = word.split(regex);
                              return (
                                <>
                                  {parts.map((p, i) => 
                                    p.toLowerCase() === part.toLowerCase() 
                                      ? <span key={i} className={colorClass}>{p}</span> 
                                      : <span key={i} className="text-gray-900">{p}</span>
                                  )}
                                </>
                              );
                            };

                            return (
                              <>
                                {/* Prefix Apps */}
                                {currentCard.analysis.prefixApplications && currentCard.analysis.prefixApplications.length > 0 && (
                                  <div className="space-y-1.5">
                                    <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                      <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                                      Prefix: {currentCard.analysis.morphology.prefix}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      {currentCard.analysis.prefixApplications.map((app, idx) => (
                                        <button
                                          key={idx}
                                          onClick={(e) => { e.stopPropagation(); handleAddWord(app.word); }}
                                          className="p-2 bg-blue-50/30 border border-blue-100/50 rounded-xl text-left hover:bg-blue-50 transition-all group"
                                        >
                                          <div className="flex items-center gap-1.5 mb-0.5">
                                            <div className="text-sm font-black truncate">
                                              {renderHighlightedWord(app.word, currentCard.analysis.morphology.prefix || '', 'text-blue-600')}
                                            </div>
                                            <button 
                                              onClick={(e) => { e.stopPropagation(); playPronunciation(app.word, 'US'); }}
                                              className="p-0.5 hover:bg-white rounded-full transition-all shadow-sm opacity-40 group-hover:opacity-100"
                                            >
                                              <Volume2 size={10} className="text-blue-500" />
                                            </button>
                                          </div>
                                          <div className="text-[9px] font-bold text-blue-500/70 truncate">{app.translation}</div>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Root Apps */}
                                {currentCard.analysis.rootApplications && currentCard.analysis.rootApplications.length > 0 && (
                                  <div className="space-y-1.5">
                                    <div className="text-[9px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-2">
                                      <div className="w-1 h-1 rounded-full bg-orange-400"></div>
                                      Root: {currentCard.analysis.morphology.root}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      {currentCard.analysis.rootApplications.map((app, idx) => (
                                        <button
                                          key={idx}
                                          onClick={(e) => { e.stopPropagation(); handleAddWord(app.word); }}
                                          className="p-2 bg-orange-50/30 border border-orange-100/50 rounded-xl text-left hover:bg-orange-50 transition-all group"
                                        >
                                          <div className="flex items-center gap-1.5 mb-0.5">
                                            <div className="text-sm font-black truncate">
                                              {renderHighlightedWord(app.word, currentCard.analysis.morphology.root || '', 'text-orange-600')}
                                            </div>
                                            <button 
                                              onClick={(e) => { e.stopPropagation(); playPronunciation(app.word, 'US'); }}
                                              className="p-0.5 hover:bg-white rounded-full transition-all shadow-sm opacity-40 group-hover:opacity-100"
                                            >
                                              <Volume2 size={10} className="text-orange-500" />
                                            </button>
                                          </div>
                                          <div className="text-[9px] font-bold text-orange-500/70 truncate">{app.translation}</div>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Suffix Apps */}
                                {currentCard.analysis.suffixApplications && currentCard.analysis.suffixApplications.length > 0 && (
                                  <div className="space-y-1.5">
                                    <div className="text-[9px] font-black text-green-400 uppercase tracking-widest flex items-center gap-2">
                                      <div className="w-1 h-1 rounded-full bg-green-400"></div>
                                      Suffix: {currentCard.analysis.morphology.suffix}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      {currentCard.analysis.suffixApplications.map((app, idx) => (
                                        <button
                                          key={idx}
                                          onClick={(e) => { e.stopPropagation(); handleAddWord(app.word); }}
                                          className="p-2 bg-green-50/30 border border-green-100/50 rounded-xl text-left hover:bg-green-50 transition-all group"
                                        >
                                          <div className="flex items-center gap-1.5 mb-0.5">
                                            <div className="text-sm font-black truncate">
                                              {renderHighlightedWord(app.word, currentCard.analysis.morphology.suffix || '', 'text-green-600')}
                                            </div>
                                            <button 
                                              onClick={(e) => { e.stopPropagation(); playPronunciation(app.word, 'US'); }}
                                              className="p-0.5 hover:bg-white rounded-full transition-all shadow-sm opacity-40 group-hover:opacity-100"
                                            >
                                              <Volume2 size={10} className="text-green-500" />
                                            </button>
                                          </div>
                                          <div className="text-[9px] font-bold text-green-500/70 truncate">{app.translation}</div>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </section>

                      {/* Section 3: Synonyms & Antonyms */}
                      <section>
                        <div className="flex items-center gap-2 mb-3">
                          <Layers size={18} className="text-purple-500" />
                          <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Synonyms & Antonyms</h3>
                          <div className="h-[1px] flex-1 bg-purple-100/50 ml-2"></div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Synonyms</div>
                            <div className="flex flex-wrap gap-1.5">
                              {currentCard.analysis.synonyms.map((syn, idx) => (
                                <button
                                  key={idx}
                                  onClick={(e) => { e.stopPropagation(); handleAddWord(syn); }}
                                  className="px-3 py-1.5 bg-gray-50 hover:bg-purple-50 hover:text-purple-600 rounded-lg text-[11px] font-bold text-gray-600 transition-all border border-transparent hover:border-purple-100"
                                >
                                  {syn}
                                </button>
                              ))}
                            </div>
                          </div>
                          {currentCard.analysis.antonyms && currentCard.analysis.antonyms.length > 0 && (
                            <div>
                              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Antonyms</div>
                              <div className="flex flex-wrap gap-1.5">
                                {currentCard.analysis.antonyms.map((ant, idx) => (
                                  <button
                                    key={idx}
                                    onClick={(e) => { e.stopPropagation(); handleAddWord(ant); }}
                                    className="px-3 py-1.5 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-lg text-[11px] font-bold text-gray-600 transition-all border border-transparent hover:border-red-100"
                                  >
                                    {ant}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </section>
                    </div>
                  </div>
                </motion.div>
              </div>
            ) : (
              <div className="w-full max-w-md aspect-[3/4] bg-white rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
                  <BookOpen size={32} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2 uppercase tracking-tight">No Cards Yet</h3>
                <p className="text-sm text-gray-400 font-bold leading-relaxed">
                  Enter a word above to start your journey of discovery.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const [selectedEtym, setSelectedEtym] = useState<EtymItem | null>(null);
  const [etymSearch, setEtymSearch] = useState("");
  const [etymFilter, setEtymFilter] = useState<'all' | 'prefix' | 'root' | 'suffix'>('all');
  const [offlineDict, setOfflineDict] = useState<Record<string, WordAnalysis>>({});

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("lingo_cards");
    if (saved) {
      const parsed = JSON.parse(saved);
      setCards(parsed);
      if (parsed.length > 0) {
        setCurrentCard(parsed[0]);
        setCurrentIndex(0);
      }
    }
    
    const savedFavs = localStorage.getItem("lingo_favorites_v2");
    if (savedFavs) {
      setFavorites(JSON.parse(savedFavs));
    }

    const savedDict = localStorage.getItem("lingo_offline_dict");
    if (savedDict) {
      try {
        setOfflineDict(JSON.parse(savedDict));
      } catch (e) {
        console.error("Failed to load offline dictionary", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("lingo_offline_dict", JSON.stringify(offlineDict));
  }, [offlineDict]);

  const addToOfflineDict = (word: string, analysis: WordAnalysis) => {
    setOfflineDict(prev => ({
      ...prev,
      [word.toLowerCase()]: analysis
    }));
  };

  const deleteFromOfflineDict = (word: string) => {
    setOfflineDict(prev => {
      const next = { ...prev };
      delete next[word.toLowerCase()];
      return next;
    });
  };

  const clearOfflineDict = () => {
    if (window.confirm("Are you sure you want to clear your entire offline dictionary? This cannot be undone.")) {
      setOfflineDict({});
    }
  };

  const uploadOfflineDict = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const uploaded = JSON.parse(event.target?.result as string);
        if (typeof uploaded === 'object' && uploaded !== null) {
          setOfflineDict(prev => ({ ...prev, ...uploaded }));
          alert("Dictionary uploaded and merged successfully!");
        } else {
          throw new Error("Invalid dictionary format");
        }
      } catch (err) {
        alert("Failed to upload dictionary. Please ensure it's a valid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const downloadOfflineDict = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(offlineDict, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "lingo_dictionary.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("lingo_cards", JSON.stringify(cards));
  }, [cards]);

  const toggleFavorite = (e: MouseEvent, type: FavoriteItem['type'], word: string, content: string, translation?: string) => {
    e.stopPropagation();
    const id = `${type}:${word}:${content}`;
    setFavorites(prev => {
      const exists = prev.find(f => f.id === id);
      if (exists) {
        return prev.filter(f => f.id !== id);
      }
      return [...prev, { type, word, content, translation, id }];
    });
  };

  const isFavorited = (type: FavoriteItem['type'], word: string, content: string) => {
    const id = `${type}:${word}:${content}`;
    return favorites.some(f => f.id === id);
  };

  const handleAddWord = async (wordToSearch?: string, e?: FormEvent) => {
    e?.preventDefault();
    const targetWord = (wordToSearch || input.trim()).toLowerCase();
    if (!targetWord || isLoading) return;

    // Check if word already exists in history
    const existingIndex = cards.findIndex(c => c.analysis.word.toLowerCase() === targetWord);
    if (existingIndex !== -1) {
      setCurrentCard(cards[existingIndex]);
      setCurrentIndex(existingIndex);
      setIsFlipped(false);
      setInput("");
      setView('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsFlipped(false);

    try {
      const analysis = await analyzeWord(targetWord);
      const imageUrl = await generateMnemonicImage(analysis.mnemonicPrompt);
      
      // Cache for offline use
      addToOfflineDict(targetWord, analysis);

      const newCard: Flashcard = {
        id: Date.now().toString(),
        analysis,
        imageUrl,
        createdAt: Date.now(),
      };

      setCards(prev => {
        const filtered = prev.filter(c => c.analysis.word.toLowerCase() !== targetWord.toLowerCase());
        return [newCard, ...filtered];
      });
      setCurrentCard(newCard);
      setCurrentIndex(0);
      setInput("");
      setView('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setError("Failed to analyze word. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getDiscoveryWord = async (rule: typeof discoveryRule, currentWord: string, value?: string | null): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `Based on the English word "${currentWord}", find a new interesting English word that follows this rule: "${rule}"${value ? ` with specific value "${value}"` : ""}.
    If the rule is "root", find another word with the same root.
    If the rule is "prefix", find another word with the same prefix.
    If the rule is "suffix", find another word with the same suffix.
    If the rule is "synonym", find a synonym.
    If the rule is "random", find any interesting related word.
    Return ONLY the word itself, nothing else.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text.trim().toLowerCase();
  };

  const handleNextCard = async () => {
    if (isLoading) return;
    
    // If we are in history mode or have cards ahead
    if (discoveryRule === 'history' && currentIndex > 0) {
      const nextIdx = currentIndex - 1;
      setCurrentIndex(nextIdx);
      setCurrentCard(cards[nextIdx]);
      setIsFlipped(false);
      return;
    }

    // If we are at the end of history or in discovery mode
    if (discoveryRule !== 'history' || currentIndex === 0) {
      if (!currentCard) {
        const randomWords = ["serendipity", "ephemeral", "eloquence", "nefarious", "ethereal"];
        const randomWord = randomWords[Math.floor(Math.random() * randomWords.length)];
        handleAddWord(randomWord);
        return;
      }

      setIsLoading(true);
      try {
        const nextWord = await getDiscoveryWord(discoveryRule === 'history' ? 'random' : discoveryRule, currentCard.analysis.word, discoveryValue);
        await handleAddWord(nextWord);
      } catch (err) {
        console.error(err);
        // Fallback to random
        const randomWords = ["luminous", "petrichor", "sonorous", "mellifluous", "halcyon"];
        const randomWord = randomWords[Math.floor(Math.random() * randomWords.length)];
        handleAddWord(randomWord);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePrevCard = () => {
    if (isLoading) return;
    if (currentIndex < cards.length - 1) {
      const prevIdx = currentIndex + 1;
      setCurrentIndex(prevIdx);
      setCurrentCard(cards[prevIdx]);
      setIsFlipped(false);
    }
  };

  const deleteCard = (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
    if (currentCard?.id === id) {
      setCurrentCard(cards.find(c => c.id !== id) || null);
    }
  };

  const updateMastery = (e: MouseEvent, cardId: string, status: 'mastered' | 'learning') => {
    e.stopPropagation();
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, masteryStatus: status } : c));
    if (currentCard?.id === cardId) {
      setCurrentCard(prev => prev ? { ...prev, masteryStatus: status } : null);
    }
  };

  const handleSpeak = async (e: MouseEvent, text: string, accent: 'UK' | 'US' = 'US') => {
    e.stopPropagation();
    if (isSpeaking) return;
    setIsSpeaking(accent);
    try {
      await playPronunciation(text, accent);
    } catch (err) {
      console.error("Speech error:", err);
    } finally {
      setIsSpeaking(null);
    }
  };

  const highlightPart = (word: string, origin: string, typeOrClass: 'prefix' | 'root' | 'suffix' | string) => {
    if (!origin) return word;
    
    // Split by / and clean up - or /
    const parts = origin.split('/').map(p => p.replace(/-/g, '').trim());
    
    // Find the first part that matches
    let matchPart = '';
    let index = -1;
    
    for (const p of parts) {
      if (!p) continue;
      const i = word.toLowerCase().indexOf(p.toLowerCase());
      if (i !== -1) {
        matchPart = p;
        index = i;
        break;
      }
    }

    if (index === -1) return word;

    const isType = typeOrClass === 'prefix' || typeOrClass === 'root' || typeOrClass === 'suffix';
    
    if (isType) {
      const colorClasses = {
        prefix: 'text-orange-500',
        root: 'text-blue-500',
        suffix: 'text-green-500'
      };
      return (
        <>
          {word.substring(0, index)}
          <span className={colorClasses[typeOrClass as keyof typeof colorClasses]}>
            {word.substring(index, index + matchPart.length)}
          </span>
          {word.substring(index + matchPart.length)}
        </>
      );
    }

    return (
      <>
        {word.substring(0, index)}
        <span className={typeOrClass}>{word.substring(index, index + matchPart.length)}</span>
        {word.substring(index + matchPart.length)}
      </>
    );
  };

  const filteredEtym = etymologyData.filter(item => {
    const matchesSearch = item.origin.toLowerCase().includes(etymSearch.toLowerCase()) || 
                         item.meaning.toLowerCase().includes(etymSearch.toLowerCase());
    const matchesFilter = etymFilter === 'all' || item.type === etymFilter;
    return matchesSearch && matchesFilter;
  }).sort((a, b) => a.origin.localeCompare(b.origin));

  const DictionaryModule = ({ 
    offlineDict, 
    onSelectWord, 
    onDeleteWord, 
    onClearDict, 
    onUploadDict,
    onDownloadDict
  }: { 
    offlineDict: Record<string, WordAnalysis>, 
    onSelectWord: (word: string) => void,
    onDeleteWord: (word: string) => void,
    onClearDict: () => void,
    onUploadDict: (e: ChangeEvent<HTMLInputElement>) => void,
    onDownloadDict: () => void
  }) => {
    const [activeTab, setActiveTab] = useState<'offline' | 'online'>('offline');
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<'all' | 'prefix' | 'root' | 'suffix'>('all');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Online Dictionary State
    const [onlineSearch, setOnlineSearch] = useState("");
    const [customLinks, setCustomLinks] = useState<{ name: string, url: string }[]>(() => {
      const saved = localStorage.getItem("lingo_custom_dict_links");
      return saved ? JSON.parse(saved) : [];
    });
    const [newLinkName, setNewLinkName] = useState("");
    const [newLinkUrl, setNewLinkUrl] = useState("");
    const [showAddLink, setShowAddLink] = useState(false);

    useEffect(() => {
      localStorage.setItem("lingo_custom_dict_links", JSON.stringify(customLinks));
    }, [customLinks]);

    const featuredDicts = [
      { name: "Oxford", url: "https://www.oxfordlearnersdictionaries.com/definition/english/", icon: "O" },
      { name: "Cambridge", url: "https://dictionary.cambridge.org/dictionary/english/", icon: "C" },
      { name: "Merriam-Webster", url: "https://www.merriam-webster.com/dictionary/", icon: "M" },
      { name: "Etymonline", url: "https://www.etymonline.com/word/", icon: "E" },
      { name: "Dictionary.com", url: "https://www.dictionary.com/browse/", icon: "D" },
      { name: "Google Search", url: "https://www.google.com/search?q=define+", icon: "G" }
    ];

    const handleOnlineSearch = (baseUrl: string) => {
      if (!onlineSearch.trim()) return;
      window.open(`${baseUrl}${encodeURIComponent(onlineSearch.trim().toLowerCase())}`, '_blank');
    };

    const addCustomLink = () => {
      if (!newLinkName.trim() || !newLinkUrl.trim()) return;
      setCustomLinks(prev => [...prev, { name: newLinkName, url: newLinkUrl }]);
      setNewLinkName("");
      setNewLinkUrl("");
      setShowAddLink(false);
    };

    const removeCustomLink = (index: number) => {
      setCustomLinks(prev => prev.filter((_, i) => i !== index));
    };
    
    const filteredWords = Object.keys(offlineDict).filter(word => {
      const matchesSearch = word.toLowerCase().includes(search.toLowerCase()) || 
                           offlineDict[word].meaning.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;
      
      if (filter === 'all') return true;
      if (filter === 'prefix') return !!offlineDict[word].morphology.prefix;
      if (filter === 'root') return !!offlineDict[word].morphology.root;
      if (filter === 'suffix') return !!offlineDict[word].morphology.suffix;
      return true;
    }).sort();

    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Tab Switcher */}
        <div className="flex items-center justify-center mb-12">
          <div className="bg-gray-100 p-1 rounded-2xl flex items-center gap-1">
            <button
              onClick={() => setActiveTab('offline')}
              className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'offline' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Book size={18} />
              Offline
            </button>
            <button
              onClick={() => setActiveTab('online')}
              className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'online' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Globe size={18} />
              Online
            </button>
          </div>
        </div>

        {activeTab === 'offline' ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key="offline-tab"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <div>
                <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                  <Book className="text-orange-500" size={32} />
                  Offline Dictionary
                </h2>
                <p className="text-sm text-gray-500 mt-1">Your personal library of analyzed words, available even without internet.</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search offline words..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2.5 bg-gray-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-orange-500/20 transition-all w-64"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={onUploadDict} 
                    className="hidden" 
                    accept=".json"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                    title="Upload Dictionary"
                  >
                    <Upload size={18} />
                  </button>
                  <button 
                    onClick={onDownloadDict}
                    className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                    title="Download Dictionary"
                  >
                    <Download size={18} />
                  </button>
                  <button 
                    onClick={onClearDict}
                    className="p-2.5 bg-white border border-gray-200 text-red-500 rounded-xl hover:bg-red-50 hover:border-red-100 transition-all shadow-sm"
                    title="Clear All"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 custom-scrollbar">
              {(['all', 'prefix', 'root', 'suffix'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    filter === f 
                      ? 'bg-orange-500 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>

            {filteredWords.length === 0 ? (
              <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Search size={32} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No words found</h3>
                <p className="text-sm text-gray-500">Search for new words in the main tab or upload a dictionary to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWords.map(word => {
                  const analysis = offlineDict[word];
                  return (
                    <motion.div
                      layout
                      key={word}
                      onClick={() => onSelectWord(word)}
                      className="group bg-white border border-gray-100 p-6 rounded-3xl hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5 transition-all cursor-pointer relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Book size={48} />
                      </div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xl font-black text-gray-900 group-hover:text-orange-500 transition-colors uppercase tracking-tight">
                            {word}
                          </h4>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteWord(word);
                              }}
                              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete Word"
                            >
                              <Trash2 size={14} />
                            </button>
                            <ChevronRight size={16} className="text-gray-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                        
                        <p className="text-sm font-bold text-gray-600 mb-4 line-clamp-2">{analysis.meaning}</p>
                        
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.morphology.prefix && (
                            <span className="text-[8px] font-black bg-orange-50 text-orange-500 px-1.5 py-0.5 rounded uppercase tracking-widest">
                              {analysis.morphology.prefix}
                            </span>
                          )}
                          <span className="text-[8px] font-black bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded uppercase tracking-widest">
                            {analysis.morphology.root}
                          </span>
                          {analysis.morphology.suffix && (
                            <span className="text-[8px] font-black bg-green-50 text-green-500 px-1.5 py-0.5 rounded uppercase tracking-widest">
                              {analysis.morphology.suffix}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key="online-tab"
            className="max-w-3xl mx-auto"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-gray-900 mb-2">Online Dictionary Hub</h2>
              <p className="text-gray-500">Quickly search across the web's most authoritative sources.</p>
            </div>

            <div className="relative mb-12">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
              <input 
                type="text" 
                placeholder="Enter a word to search online..."
                value={onlineSearch}
                onChange={(e) => setOnlineSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleOnlineSearch(featuredDicts[0].url)}
                className="w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-3xl text-lg font-bold shadow-xl shadow-orange-500/5 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
              />
            </div>

            <div className="space-y-12">
              {/* Featured Dictionaries */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                  <Sparkles size={14} className="text-orange-500" />
                  Featured Sources
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {featuredDicts.map(dict => (
                    <button
                      key={dict.name}
                      onClick={() => handleOnlineSearch(dict.url)}
                      className="group bg-white border border-gray-100 p-4 rounded-2xl hover:border-orange-200 hover:shadow-lg transition-all flex items-center gap-3 text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center font-black text-lg group-hover:bg-orange-500 group-hover:text-white transition-all">
                        {dict.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-gray-900 truncate">{dict.name}</div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-1">
                          Search <ExternalLink size={8} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Links */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Link size={14} className="text-blue-500" />
                    My Custom Links
                  </h3>
                  <button 
                    onClick={() => setShowAddLink(!showAddLink)}
                    className="text-[10px] font-bold text-blue-500 hover:underline flex items-center gap-1"
                  >
                    <Plus size={12} /> Add New
                  </button>
                </div>

                {showAddLink && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-gray-50 p-4 rounded-2xl mb-6 space-y-3 border border-gray-100"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input 
                        type="text" 
                        placeholder="Site Name (e.g. Urban Dictionary)"
                        value={newLinkName}
                        onChange={(e) => setNewLinkName(e.target.value)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <input 
                        type="text" 
                        placeholder="Search URL (e.g. https://site.com/q=)"
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setShowAddLink(false)}
                        className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={addCustomLink}
                        className="px-4 py-2 text-xs font-bold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shadow-sm"
                      >
                        Save Link
                      </button>
                    </div>
                  </motion.div>
                )}

                {customLinks.length === 0 ? (
                  <div className="py-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <p className="text-sm text-gray-400">No custom links added yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {customLinks.map((link, idx) => (
                      <div 
                        key={idx}
                        className="group bg-white border border-gray-100 p-4 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all flex items-center justify-between"
                      >
                        <button
                          onClick={() => handleOnlineSearch(link.url)}
                          className="flex items-center gap-3 text-left flex-1 min-w-0"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                            <Link size={16} />
                          </div>
                          <div className="truncate">
                            <div className="text-sm font-bold text-gray-900 truncate">{link.name}</div>
                            <div className="text-[10px] text-gray-400 truncate">{link.url}</div>
                          </div>
                        </button>
                        <button 
                          onClick={() => removeCustomLink(idx)}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  const Dashboard = () => {
    const masteredCount = cards.filter(c => c.masteryStatus === 'mastered').length;
    const learningCount = cards.filter(c => c.masteryStatus !== 'mastered').length;
    const totalCount = cards.length;
    const masteryRate = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

    const recentCards = cards.slice(0, 6);
    const userPrefix = "wefran996".split('@')[0]; // Using the email prefix from context

    return (
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
        {/* Welcome Section */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">
              Welcome back, <span className="text-orange-500">{userPrefix}</span>!
            </h2>
            <p className="text-gray-500 font-medium">Ready to discover some new words today?</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Streak</div>
              <div className="text-lg font-black text-orange-500 flex items-center justify-end gap-1">
                <Sparkles size={16} />
                12 Days
              </div>
            </div>
            <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <Trophy size={24} />
            </div>
          </div>
        </section>

        {/* Hero Section */}
        <section className="text-center space-y-6 py-12 bg-white rounded-[3rem] border border-gray-100 shadow-2xl shadow-orange-500/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
            <div className="absolute top-0 left-0 w-64 h-64 bg-orange-500 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />
          </div>

          <div className="relative z-10 space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-full text-xs font-black uppercase tracking-widest"
            >
              <Sparkles size={14} />
              AI-Powered Vocabulary Mastery
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight"
            >
              Master Words with <br />
              <span className="text-orange-500">Visual Memory</span>
            </motion.h2>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-2xl mx-auto pt-4 px-6"
            >
              <form onSubmit={(e) => handleAddWord(undefined, e)} className="relative group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Search any word to start..."
                  className="w-full bg-gray-50 border-2 border-transparent rounded-3xl py-6 pl-16 pr-6 text-xl font-bold shadow-inner focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                />
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={28} />
                <button 
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black disabled:opacity-50 transition-all shadow-lg"
                >
                  {isLoading ? <RotateCw className="animate-spin" size={20} /> : "Discover"}
                </button>
              </form>
            </motion.div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-orange-200 transition-all">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all">
                <Trophy size={24} />
              </div>
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Mastery Rate</span>
            </div>
            <div>
              <div className="text-4xl font-black text-gray-900 mb-2">{masteryRate}%</div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${masteryRate}%` }}
                  className="h-full bg-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-blue-200 transition-all">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
                <BookOpen size={24} />
              </div>
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Words Studied</span>
            </div>
            <div>
              <div className="text-4xl font-black text-gray-900 mb-1">{totalCount}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Vocabulary</div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-green-200 transition-all">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-all">
                <Target size={24} />
              </div>
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Learning</span>
            </div>
            <div>
              <div className="text-4xl font-black text-gray-900 mb-1">{learningCount}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">In Progress</div>
            </div>
          </div>
        </section>

        {/* Quick Access Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { id: 'home', label: 'Study Mode', icon: <Sparkles size={20} />, color: 'orange', desc: 'Smart Flashcards' },
            { id: 'etymology', label: 'Etymology', icon: <Library size={20} />, color: 'blue', desc: 'Root Explorer' },
            { id: 'dictionary', label: 'Dictionary', icon: <Book size={20} />, color: 'green', desc: 'Offline Library' },
            { id: 'tracker', label: 'Tracker', icon: <Calendar size={20} />, color: 'purple', desc: 'Study Calendar', action: () => setShowCalendar(true) },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => item.action ? item.action() : setView(item.id as any)}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left flex flex-col gap-4 group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all
                ${item.color === 'orange' ? 'bg-orange-50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white' : ''}
                ${item.color === 'blue' ? 'bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white' : ''}
                ${item.color === 'green' ? 'bg-green-50 text-green-500 group-hover:bg-green-500 group-hover:text-white' : ''}
                ${item.color === 'purple' ? 'bg-purple-50 text-purple-500 group-hover:bg-purple-500 group-hover:text-white' : ''}
              `}>
                {item.icon}
              </div>
              <div>
                <div className="text-sm font-black text-gray-900 uppercase tracking-tight">{item.label}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.desc}</div>
              </div>
            </button>
          ))}
        </section>

        {/* Recent Words */}
        {recentCards.length > 0 ? (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <History size={14} />
                Recently Studied
              </h3>
              <button 
                onClick={() => setView('home')}
                className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:underline"
              >
                View History
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {recentCards.map(card => (
                <div 
                  key={card.id}
                  onClick={() => {
                    setCurrentCard(card);
                    setView('home');
                    setIsFlipped(false);
                  }}
                  className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-orange-200 hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="aspect-square relative overflow-hidden bg-gray-50">
                    <img 
                      src={card.imageUrl} 
                      alt={card.analysis.word} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                  <div className="p-3">
                    <h4 className="text-xs font-bold text-gray-900 group-hover:text-orange-500 transition-colors truncate">{card.analysis.word}</h4>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="bg-gray-50 rounded-[2rem] p-12 text-center space-y-4 border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <BookOpen size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Your library is empty</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              Start your journey by searching for a word above. We'll help you break it down and remember it forever.
            </p>
          </section>
        )}
      </div>
    );
  };

  const EtymologyExplorer = () => (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900">Etymology Explorer</h2>
          <p className="text-gray-500 font-medium">Master English by understanding its DNA: Roots, Prefixes, and Suffixes.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
          {(['all', 'prefix', 'root', 'suffix'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setEtymFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                etymFilter === f ? 'bg-orange-500 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by origin or meaning..."
          value={etymSearch}
          onChange={(e) => setEtymSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all font-medium"
        />
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="hidden md:grid grid-cols-[120px_1fr_120px_80px] gap-4 px-8 py-4 bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
          <div>Origin</div>
          <div>含义 (CN)</div>
          <div>Type</div>
          <div className="text-right">Action</div>
        </div>
        <div className="divide-y divide-gray-50">
          {filteredEtym.map((item) => {
            const isExpanded = selectedEtym?.id === item.id;
            return (
              <div key={item.id} className="overflow-hidden">
                <motion.div
                  onClick={() => setSelectedEtym(isExpanded ? null : item)}
                  className={`grid grid-cols-1 md:grid-cols-[120px_1fr_120px_80px] gap-2 md:gap-4 px-8 py-5 hover:bg-orange-50/50 transition-all cursor-pointer group items-center ${isExpanded ? 'bg-orange-50/30' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      item.type === 'prefix' ? 'bg-orange-100 text-orange-600' : 
                      item.type === 'root' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                    }`}>
                      <Layers size={16} />
                    </div>
                    <h3 className="text-lg font-black group-hover:text-orange-500 transition-colors">{item.origin}</h3>
                  </div>
                  
                  <div className="text-sm text-gray-600 font-medium md:pl-0 pl-11">
                    {item.meaningCN}
                  </div>

                  <div className="md:pl-0 pl-11">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                      item.type === 'prefix' ? 'bg-orange-50 text-orange-500' : 
                      item.type === 'root' ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'
                    }`}>
                      {item.type}
                    </span>
                  </div>

                  <div className="hidden md:flex justify-end">
                    <motion.div 
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${isExpanded ? 'text-orange-500 bg-white shadow-sm' : 'text-gray-300 group-hover:text-orange-500 group-hover:bg-white shadow-sm'} transition-all`}
                    >
                      <ChevronRight size={18} />
                    </motion.div>
                  </div>
                </motion.div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="bg-gray-50/50 border-t border-gray-50"
                    >
                      <div className="px-8 py-8 md:pl-[152px]">
                        <div>
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Example Words</h4>
                          <div className="divide-y divide-gray-100 border-t border-b border-gray-100">
                            {item.examples.map((ex, i) => (
                              <button
                                key={i}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddWord(ex.word);
                                  setView('home');
                                  setSelectedEtym(null);
                                }}
                                className="w-full flex items-center justify-between py-4 hover:bg-orange-50/50 transition-all group px-2 text-left"
                              >
                                <div className="flex items-center gap-4">
                                  <span className="text-xl font-black text-gray-800 group-hover:text-orange-500 transition-colors">
                                    {highlightPart(ex.word, item.origin, item.type)}
                                  </span>
                                  <span className="text-sm text-gray-400 font-bold">{ex.translation}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-500 opacity-0 group-hover:opacity-100 transition-all">
                                  <span>Study</span>
                                  <ChevronRight size={14} />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="mt-6 flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                          <Sparkles size={12} className="text-orange-400" />
                          Click a word to generate its 3D visual flashcard
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
        {filteredEtym.length === 0 && (
          <div className="py-20 text-center text-gray-400 font-medium">
            No results found for "{etymSearch}"
          </div>
        )}
      </div>

      <AnimatePresence>
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-orange-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">
              <Sparkles size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">LingoVisual AI</h1>
          </div>
          
          <form onSubmit={(e) => handleAddWord(undefined, e)} className="flex-1 max-w-md mx-8 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter a word (e.g., persistent)"
              className="w-full bg-gray-100 border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-orange-500 transition-all outline-none text-sm"
              disabled={isLoading}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-orange-500 text-white p-1.5 rounded-full hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {isLoading ? <RotateCw className="animate-spin" size={14} /> : <Plus size={14} />}
            </button>
          </form>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView('dashboard')}
              className={`p-2 rounded-full transition-all ${view === 'dashboard' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50'}`}
              title="Dashboard"
            >
              <Home size={20} />
            </button>
            <button 
              onClick={() => setView('home')}
              className={`p-2 rounded-full transition-all ${view === 'home' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50'}`}
              title="Study Mode"
            >
              <Sparkles size={20} />
            </button>
            <button 
              onClick={() => setView('etymology')}
              className={`p-2 rounded-full transition-all ${view === 'etymology' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50'}`}
              title="Etymology Explorer"
            >
              <Library size={20} />
            </button>
            <button 
              onClick={() => setView('dictionary')}
              className={`p-2 rounded-full transition-all ${view === 'dictionary' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50'}`}
              title="Offline Dictionary"
            >
              <Book size={20} />
            </button>
            <button 
              onClick={() => setShowMastery(true)}
              className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-all"
            >
              <Trophy size={20} />
            </button>
            <button 
              onClick={() => setShowCalendar(true)}
              className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-all"
            >
              <Calendar size={20} />
            </button>
            <button 
              onClick={() => setShowFavorites(true)}
              className="relative p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-all"
            >
              <Bookmark size={20} />
              {favorites.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </button>
            <div className="flex items-center gap-1 text-xs font-medium bg-gray-100 px-2 py-1 rounded-full text-gray-500">
              <History size={12} />
              {cards.length} Cards
            </div>
          </div>
        </div>
      </header>

      <main className="pb-20">
        {view === 'dashboard' ? (
          <Dashboard />
        ) : view === 'home' ? (
          <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12">
            {/* Flashcard Area */}
            <FlashcardView />

            {/* Sidebar / History */}
            <aside className="space-y-6">
              <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <History size={14} />
              Exploration Path
            </h3>
            <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500 font-bold">{cards.length}</span>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar relative">
            <AnimatePresence initial={false}>
              {cards.map((card, index) => {
                const sharesRoot = index > 0 && 
                  card.analysis.morphology.root.toLowerCase() === cards[index-1].analysis.morphology.root.toLowerCase();

                return (
                  <div key={card.id} className="relative">
                    {sharesRoot && (
                      <div className="absolute -top-4 left-6 w-[2px] h-4 bg-blue-100 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-300"></div>
                      </div>
                    )}
                    <motion.div
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => {
                        setCurrentCard(card);
                        setIsFlipped(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`group p-3 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                        currentCard?.id === card.id 
                          ? "bg-white border-orange-200 shadow-sm ring-1 ring-orange-100" 
                          : "bg-transparent border-transparent hover:bg-white hover:border-gray-100"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border-2 ${sharesRoot ? 'border-blue-100' : 'border-transparent'}`}>
                        <img src={card.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm truncate">{card.analysis.word}</h4>
                          {sharesRoot && <span className="text-[8px] bg-blue-50 text-blue-500 px-1 rounded uppercase font-bold">Same Root</span>}
                        </div>
                        <p className="text-[10px] text-gray-400 truncate">{card.analysis.meaning}</p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCard(card.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  </div>
                );
              })}
            </AnimatePresence>
          </div>
        </aside>
      </div>
    ) : view === 'etymology' ? (
      <EtymologyExplorer />
    ) : view === 'dictionary' ? (
      <DictionaryModule 
        offlineDict={offlineDict} 
        onSelectWord={(word) => {
          handleAddWord(word);
          setView('home');
        }} 
        onDeleteWord={deleteFromOfflineDict}
        onClearDict={clearOfflineDict}
        onUploadDict={uploadOfflineDict}
        onDownloadDict={downloadOfflineDict}
      />
    ) : (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
        <RotateCw className="animate-spin mb-4" size={32} />
        <p>Loading View...</p>
      </div>
    )}
  </main>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
      `}</style>
      {/* Favorites Overlay */}
      <AnimatePresence>
        {showFavorites && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col"
          >
            <header className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md sticky top-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowFavorites(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Bookmark className="text-orange-500" size={20} />
                  My Collection
                </h2>
              </div>
              <button 
                onClick={() => setShowFavorites(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </header>

            <main className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full">
              {favorites.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                    <Heart size={32} />
                  </div>
                  <p className="text-sm">Your collection is empty. Start favoriting items on cards!</p>
                </div>
              ) : (
                <div className="space-y-8 pb-12">
                  {/* Filter Bar */}
                  <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 custom-scrollbar">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'word', label: 'Words' },
                      { id: 'colloc', label: 'Collocations' },
                      { id: 'root', label: 'Roots' },
                      { id: 'sentence', label: 'Sentences' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setFavFilter(tab.id as any)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                          favFilter === tab.id 
                            ? 'bg-orange-500 text-white shadow-md' 
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Categorized Favorites */}
                  {(() => {
                    const activeTypes = ['word', 'colloc', 'root', 'sentence'].filter(type => favFilter === 'all' || favFilter === type);
                    const visibleSections = activeTypes.map(type => {
                      const items = favorites.filter(f => f.type === type);
                      if (items.length === 0) return null;
                      
                      const titles: Record<string, string> = {
                        word: 'Words',
                        colloc: 'Collocations',
                        root: 'Roots & Affixes',
                        sentence: 'Example Sentences'
                      };

                      return (
                        <section key={type} className="space-y-4">
                          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            {titles[type]}
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            {items.length}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {items.map(item => (
                              <div 
                                key={item.id}
                                onClick={() => {
                                  handleAddWord(item.word);
                                  setShowFavorites(false);
                                }}
                                className="group bg-white border border-gray-100 p-4 rounded-2xl hover:border-orange-200 hover:shadow-md transition-all relative cursor-pointer"
                              >
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-gray-900 group-hover:text-orange-500 transition-colors">
                                      {item.content}
                                    </span>
                                    <button 
                                      onClick={(e) => toggleFavorite(e, item.type, item.word, item.content)}
                                      className="text-red-500 p-1 hover:bg-red-50 rounded-full transition-all z-10"
                                    >
                                      <Heart size={14} fill="currentColor" />
                                    </button>
                                  </div>
                                  {item.translation && (
                                    <p className="text-xs text-gray-500">{item.translation}</p>
                                  )}
                                  {item.type !== 'word' && (
                                    <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between">
                                      <span className="text-[10px] text-gray-400 italic">From: {item.word}</span>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSpeak(e, item.content);
                                        }}
                                        className="p-1 text-gray-300 hover:text-orange-500 transition-colors z-10"
                                      >
                                        <Volume2 size={12} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      );
                    }).filter(Boolean);

                    if (visibleSections.length === 0) {
                      return (
                        <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-2">
                          <p className="text-sm font-medium">No items found in this category.</p>
                          <button 
                            onClick={() => setFavFilter('all')}
                            className="text-xs text-orange-500 font-bold hover:underline"
                          >
                            Show all items
                          </button>
                        </div>
                      );
                    }

                    return visibleSections;
                  })()}
                </div>
              )}
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mastery View */}
      <AnimatePresence>
        {showMastery && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[120] bg-white flex flex-col"
          >
            <header className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowMastery(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Trophy className="text-orange-500" size={20} />
                  Mastery Progress
                </h2>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30">
              <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Mastered Section */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between pb-2 border-b border-green-100">
                    <h3 className="text-sm font-black text-green-600 uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      Mastered ({cards.filter(c => c.masteryStatus === 'mastered').length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {cards.filter(c => c.masteryStatus === 'mastered').map(card => (
                      <div 
                        key={card.id}
                        onClick={() => {
                          setCurrentCard(card);
                          setShowMastery(false);
                          setIsFlipped(false);
                        }}
                        className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-green-200 hover:shadow-xl hover:shadow-green-500/5 transition-all cursor-pointer flex flex-col"
                      >
                        <div className="aspect-video relative overflow-hidden bg-gray-50">
                          <img 
                            src={card.imageUrl} 
                            alt={card.analysis.word} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                            referrerPolicy="no-referrer" 
                          />
                        </div>
                        <div className="p-4">
                          <h4 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">{card.analysis.word}</h4>
                          <p className="text-xs text-gray-500 line-clamp-1">{card.analysis.meaning}</p>
                        </div>
                      </div>
                    ))}
                    {cards.filter(c => c.masteryStatus === 'mastered').length === 0 && (
                      <div className="col-span-full py-12 text-center text-gray-400 text-sm italic">
                        No mastered words yet. Keep going!
                      </div>
                    )}
                  </div>
                </section>

                {/* Learning Section */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between pb-2 border-b border-orange-100">
                    <h3 className="text-sm font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                      <Target size={16} />
                      Learning ({cards.filter(c => c.masteryStatus !== 'mastered').length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {cards.filter(c => c.masteryStatus !== 'mastered').map(card => (
                      <div 
                        key={card.id}
                        onClick={() => {
                          setCurrentCard(card);
                          setShowMastery(false);
                          setIsFlipped(false);
                        }}
                        className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5 transition-all cursor-pointer flex flex-col"
                      >
                        <div className="aspect-video relative overflow-hidden bg-gray-50">
                          <img 
                            src={card.imageUrl} 
                            alt={card.analysis.word} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                            referrerPolicy="no-referrer" 
                          />
                        </div>
                        <div className="p-4">
                          <h4 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{card.analysis.word}</h4>
                          <p className="text-xs text-gray-500 line-clamp-1">{card.analysis.meaning}</p>
                        </div>
                      </div>
                    ))}
                    {cards.filter(c => c.masteryStatus !== 'mastered').length === 0 && (
                      <div className="col-span-full py-12 text-center text-gray-400 text-sm italic">
                        All words mastered! Amazing work.
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calendar View */}
      <AnimatePresence>
        {showCalendar && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-[110] bg-white flex flex-col md:flex-row"
          >
            {/* Calendar Sidebar (Desktop) / Top (Mobile) */}
            <div className="w-full md:w-[400px] border-r border-gray-100 flex flex-col bg-gray-50/50">
              <header className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowCalendar(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <CalendarCheck className="text-orange-500" size={20} />
                    Study Tracker
                  </h2>
                </div>
              </header>

              <div className="p-6 flex-1 overflow-y-auto">
                {/* Calendar Grid */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-900">
                      {viewMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h3>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1))}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-all"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button 
                        onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1))}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-all"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                      <div key={d} className="text-[10px] font-black text-gray-300 uppercase text-center py-2">{d}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const days = [];
                      const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();
                      const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
                      
                      for (let i = 0; i < firstDay; i++) {
                        days.push(<div key={`empty-${i}`} />);
                      }

                      for (let d = 1; d <= daysInMonth; d++) {
                        const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d);
                        const isToday = new Date().toDateString() === date.toDateString();
                        const isSelected = selectedDate.toDateString() === date.toDateString();
                        const hasCards = cards.some(c => new Date(c.createdAt).toDateString() === date.toDateString());

                        days.push(
                          <button
                            key={d}
                            onClick={() => setSelectedDate(date)}
                            className={`
                              aspect-square rounded-xl text-xs font-bold flex flex-col items-center justify-center relative transition-all
                              ${isSelected ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'hover:bg-gray-50 text-gray-600'}
                              ${isToday && !isSelected ? 'border-2 border-orange-100' : ''}
                            `}
                          >
                            {d}
                            {hasCards && (
                              <div className={`w-1 h-1 rounded-full absolute bottom-1.5 ${isSelected ? 'bg-white' : 'bg-orange-400'}`} />
                            )}
                          </button>
                        );
                      }
                      return days;
                    })()}
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-500 shadow-sm">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Total Progress</p>
                        <p className="text-sm font-bold text-orange-900">{cards.length} Words Mastered</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily View (Right Side) */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
              <header className="h-16 border-b border-gray-100 flex items-center px-8 justify-between">
                <div>
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">
                    {selectedDate.toLocaleDateString('default', { weekday: 'long' })}
                  </h3>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedDate.toLocaleDateString('default', { month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                  {cards.filter(c => new Date(c.createdAt).toDateString() === selectedDate.toDateString()).length} Cards
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-8">
                {(() => {
                  const dailyCards = cards.filter(c => new Date(c.createdAt).toDateString() === selectedDate.toDateString());
                  
                  if (dailyCards.length === 0) {
                    return (
                      <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                          <BookOpen size={32} />
                        </div>
                        <p className="text-sm">No cards studied on this day.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {dailyCards.map(card => (
                        <div 
                          key={card.id}
                          onClick={() => {
                            setCurrentCard(card);
                            setShowCalendar(false);
                            setIsFlipped(false);
                          }}
                          className="group bg-white border border-gray-100 rounded-3xl overflow-hidden hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5 transition-all cursor-pointer flex flex-col"
                        >
                          <div className="aspect-video relative overflow-hidden bg-gray-50">
                            <img 
                              src={card.imageUrl} 
                              alt={card.analysis.word}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="p-4 flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-gray-900 group-hover:text-orange-500 transition-colors">
                                {card.analysis.word}
                              </h4>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSpeak(e, card.analysis.word);
                                }}
                                className="p-1.5 text-gray-300 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-all"
                              >
                                <Volume2 size={14} />
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-1">{card.analysis.meaning}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
