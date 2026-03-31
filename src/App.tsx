/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Plus, Home, Search, RotateCw, Trash2, BookOpen, Image as ImageIcon, 
  Sparkles, ChevronRight, History, Info, Volume2, ExternalLink, Heart, 
  Bookmark, Book, Globe, Link, Upload, Download, X, ChevronLeft, 
  Calendar, CalendarCheck, Trophy, Target, CheckCircle2, XCircle, 
  Library, Layers, Settings2, Shuffle, GitBranch, Dna
} from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "motion/react";
import { useState, useMemo, useCallback } from "react";

// --- 1. Types 完善 ---

interface WordAnalysis {
  word: string;
  phoneticUK: string;
  phoneticUS: string;
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
  masteryStatus: 'mastered' | 'learning';
}

// --- 2. 模拟 AI 服务 (修复了返回字段缺失问题) ---

async function analyzeWord(word: string): Promise<WordAnalysis> {
  // 模拟 API 延迟
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return {
    word: word,
    phoneticUK: "/wɜːd/",
    phoneticUS: "/wɜːrd/",
    meaning: "单词；话语；消息",
    morphology: {
      prefix: "",
      prefixMeaning: "",
      root: word,
      rootMeaning: "核心意义",
      suffix: "",
      suffixMeaning: ""
    },
    synonyms: ["term", "expression"],
    antonyms: ["silence"],
    familyWords: ["wordy", "wordless"],
    collocations: [
      { 
        phrase: "keep one's word", 
        translation: "守信用", 
        example: "He is a man who always keeps his word.", 
        exampleTranslation: "他是个总是守信用的人。" 
      }
    ],
    mnemonicPrompt: "A glowing golden dictionary page"
  };
}

// --- 3. 子组件拆分 (移出 App 以提升性能) ---

const DiscoverySettings = ({ 
  rule, 
  setRule, 
  onClose 
}: { 
  rule: string, 
  setRule: (r: any) => void, 
  onClose: () => void 
}) => (
  <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 space-y-6">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
        <Settings2 size={20} className="text-orange-500" />
        Discovery Rules
      </h3>
      <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-all">
        <X size={20} className="text-gray-400" />
      </button>
    </div>

    <div className="grid grid-cols-2 gap-2">
      {[
        { id: 'history', label: 'History', icon: <History size={14} />, desc: 'Sequential' },
        { id: 'root', label: 'Same Root', icon: <GitBranch size={14} />, desc: 'Etymology chain' },
        { id: 'synonym', label: 'Synonyms', icon: <Sparkles size={14} />, desc: 'Meaning chain' },
        { id: 'random', label: 'Random', icon: <Shuffle size={14} />, desc: 'AI pick' },
      ].map((r) => (
        <button
          key={r.id}
          onClick={() => setRule(r.id)}
          className={`p-3 rounded-2xl border-2 text-left transition-all ${
            rule === r.id ? 'border-orange-500 bg-orange-50/50' : 'border-gray-50 bg-gray-50/50'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className={rule === r.id ? 'text-orange-500' : 'text-gray-400'}>{r.icon}</div>
            <span className="text-xs font-black">{r.label}</span>
          </div>
          <p className="text-[9px] text-gray-400 font-bold">{r.desc}</p>
        </button>
      ))}
    </div>
    <button onClick={onClose} className="w-full py-3 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">
      Apply Rules
    </button>
  </div>
);

// --- 4. 主程序 ---

export default function App() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isFlipped, setIsFlipped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [discoveryRule, setDiscoveryRule] = useState<'history' | 'random' | 'root' | 'synonym'>('history');
  const [showDiscoverySettings, setShowDiscoverySettings] = useState(false);

  // 派生状态：当前选中的卡片
  const currentCard = useMemo(() => 
    currentIndex >= 0 && cards[currentIndex] ? cards[currentIndex] : null
  , [cards, currentIndex]);

  // 添加卡片逻辑
  const handleAdd = async () => {
    const term = input.trim();
    if (!term || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const analysis = await analyzeWord(term);
      const newCard: Flashcard = {
        id: crypto.randomUUID(),
        analysis,
        imageUrl: `https://picsum.photos/seed/${term}/600/800`,
        createdAt: Date.now(),
        masteryStatus: 'learning'
      };
      
      setCards(prev => [...prev, newCard]);
      setInput("");
      // 如果是第一张卡，自动选中
      if (currentIndex === -1) setCurrentIndex(0);
    } catch (err) {
      setError("分析失败，请检查网络");
    } finally {
      setIsLoading(false);
    }
  };

  // 更新掌握程度
  const updateMastery = useCallback((id: string, status: 'mastered' | 'learning') => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, masteryStatus: status } : c));
  }, []);

  // 收藏逻辑
  const toggleFavorite = (type: FavoriteItem['type'], content: string, word: string, translation?: string) => {
    const favId = `${type}-${content}`;
    setFavorites(prev => {
      const exists = prev.find(f => f.id === favId);
      if (exists) return prev.filter(f => f.id !== favId);
      return [...prev, { type, content, word, translation, id: favId }];
    });
  };

  // --- Framer Motion Values ---
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const masteredOpacity = useTransform(x, [50, 150], [0, 1]);
  const learningOpacity = useTransform(x, [-150, -50], [1, 0]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* 输入区域 */}
        <div className="relative group">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Search root or word..."
            className="w-full bg-white border-2 border-gray-100 rounded-2xl px-6 py-4 pr-14 focus:border-orange-500 outline-none transition-all shadow-sm group-hover:shadow-md"
          />
          <button 
            onClick={handleAdd}
            disabled={isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:bg-gray-300"
          >
            {isLoading ? <RotateCw className="animate-spin" size={20} /> : <Search size={20} />}
          </button>
        </div>

        {/* 错误提示 */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2">
              <Info size={14} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 主视图控制 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">
              <Sparkles size={16} />
            </div>
            <h2 className="font-black uppercase tracking-tight text-gray-900">Study Deck</h2>
          </div>
          <button 
            onClick={() => setShowDiscoverySettings(!showDiscoverySettings)}
            className={`p-2 rounded-lg border transition-all ${showDiscoverySettings ? 'bg-orange-500 text-white' : 'bg-white text-gray-400'}`}
          >
            <Settings2 size={20} />
          </button>
        </div>

        {/* 卡片容器 */}
        <div className="relative perspective-1000 min-h-[500px]">
          {showDiscoverySettings ? (
            <DiscoverySettings 
              rule={discoveryRule} 
              setRule={setDiscoveryRule} 
              onClose={() => setShowDiscoverySettings(false)} 
            />
          ) : currentCard ? (
            <motion.div
              key={currentCard.id}
              style={{ x, rotate, opacity, touchAction: 'none' }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x > 100) {
                  updateMastery(currentCard.id, 'mastered');
                  if (currentIndex < cards.length - 1) setCurrentIndex(v => v + 1);
                } else if (info.offset.x < -100) {
                  updateMastery(currentCard.id, 'learning');
                  if (currentIndex < cards.length - 1) setCurrentIndex(v => v + 1);
                }
              }}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              onClick={() => setIsFlipped(!isFlipped)}
              className="relative w-full aspect-[3/4] preserve-3d cursor-pointer"
            >
              {/* 反馈指示器 */}
              <motion.div style={{ opacity: masteredOpacity }} className="absolute -right-4 top-10 z-50 bg-green-500 text-white px-4 py-2 rounded-full font-black text-xs rotate-12 shadow-lg">MASTERED</motion.div>
              <motion.div style={{ opacity: learningOpacity }} className="absolute -left-4 top-10 z-50 bg-orange-500 text-white px-4 py-2 rounded-full font-black text-xs -rotate-12 shadow-lg">LEARNING</motion.div>

              {/* 卡片正面 */}
              <div className="absolute inset-0 backface-hidden bg-white rounded-3xl shadow-xl border border-gray-100 p-6 flex flex-col gap-6">
                <div className="w-full aspect-video rounded-2xl overflow-hidden bg-gray-100">
                  <img src={currentCard.imageUrl} className="w-full h-full object-cover" alt="mnemonic" />
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <h1 className="text-4xl font-black text-gray-900">{currentCard.analysis.word}</h1>
                    <Heart 
                      size={20} 
                      onClick={(e) => { e.stopPropagation(); toggleFavorite('word', currentCard.analysis.word, currentCard.analysis.word); }}
                      className={favorites.some(f => f.content === currentCard.analysis.word) ? "fill-red-500 text-red-500" : "text-gray-200"}
                    />
                  </div>
                  <div className="flex justify-center gap-4 text-xs font-bold text-gray-400">
                    <span>UK {currentCard.analysis.phoneticUK}</span>
                    <span>US {currentCard.analysis.phoneticUS}</span>
                  </div>
                </div>
                <div className="flex-1 border-t border-dashed border-gray-100 pt-4">
                  <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Meaning</span>
                  <p className="text-xl font-bold text-gray-800">{currentCard.analysis.meaning}</p>
                </div>
              </div>

              {/* 卡片背面 */}
              <div className="absolute inset-0 backface-hidden bg-white rounded-3xl shadow-xl border border-gray-100 p-6 flex flex-col rotate-y-180 overflow-y-auto custom-scrollbar">
                <h3 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
                  <Target size={16} className="text-orange-500" /> Collocations
                </h3>
                <div className="space-y-3">
                  {currentCard.analysis.collocations.map((col, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="font-bold text-gray-900 text-sm">{col.phrase}</p>
                      <p className="text-xs text-gray-500 italic">"{col.example}"</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-gray-900 rounded-2xl text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={14} className="text-orange-400" />
                    <span className="text-[10px] font-black uppercase">Mnemonic Hook</span>
                  </div>
                  <p className="text-xs text-gray-300 italic">{currentCard.analysis.mnemonicPrompt}</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-gray-300 border-2 border-dashed border-gray-200 rounded-3xl">
              <BookOpen size={48} className="mb-4 opacity-20" />
              <p className="font-bold">No cards yet. Start searching!</p>
            </div>
          )}
        </div>

        {/* 底部导航 */}
        {cards.length > 0 && (
          <div className="flex items-center justify-between px-4">
            <button 
              disabled={currentIndex <= 0}
              onClick={() => setCurrentIndex(v => v - 1)}
              className="p-3 bg-white rounded-full shadow-sm disabled:opacity-30"
            >
              <ChevronLeft />
            </button>
            <span className="text-xs font-black text-gray-400">
              {currentIndex + 1} / {cards.length}
            </span>
            <button 
              disabled={currentIndex >= cards.length - 1}
              onClick={() => setCurrentIndex(v => v + 1)}
              className="p-3 bg-white rounded-full shadow-sm disabled:opacity-30"
            >
              <ChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
