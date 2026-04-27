/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { 
  Users, 
  UserPlus, 
  Shuffle, 
  Trash2, 
  Copy, 
  LayoutGrid, 
  ListOrdered,
  Plus,
  X,
  FileUp,
  AlertCircle,
  CheckCircle2,
  Download,
  Crown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

type GroupMode = 'groupCount' | 'memberCount';

interface Group {
  id: string;
  name: string;
  members: string[];
  leader?: string;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export default function App() {
  const [inputText, setInputText] = useState<string>('');
  const [names, setNames] = useState<string[]>([]);
  const [mode, setMode] = useState<GroupMode>('groupCount');
  const [count, setCount] = useState<number>(2);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isGenerated, setIsGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleNames = '陳小明, 張美玲, 李冠廷, 王雅婷, 林志強, 吳詩涵, 黃柏翰, 蔡宜君, 曾政傑, 鄭佩芬, 劉依婷, 許家維, 郭建宏, 謝欣穎, 鍾志明';

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const parseNamesFromText = (text: string) => {
    const rawList = text
      .split(/[\n,，、\s\t]+/)
      .map(n => n.trim())
      .filter(n => n.length > 0);
    return Array.from(new Set(rawList)); // Remove duplicates
  };

  const updateInputAndNames = (text: string) => {
    setInputText(text);
    setNames(parseNamesFromText(text));
  };

  const loadExample = () => {
    updateInputAndNames(sampleNames);
    showToast('範例名單已載入');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateInputAndNames(e.target.value);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        
        // Extract all unique strings from the spreadsheet
        const extractedNames: string[] = [];
        data.forEach(row => {
          row.forEach(cell => {
            if (cell && typeof cell === 'string') {
              const cleaned = cell.trim();
              if (cleaned && !extractedNames.includes(cleaned)) {
                extractedNames.push(cleaned);
              }
            } else if (cell !== null && cell !== undefined) {
              const cleaned = String(cell).trim();
               if (cleaned && !extractedNames.includes(cleaned)) {
                extractedNames.push(cleaned);
              }
            }
          });
        });

        if (extractedNames.length > 0) {
          updateInputAndNames(extractedNames.join('\n'));
          setError(null);
          showToast(`成功匯入 ${extractedNames.length} 位成員`);
        } else {
          setError('找不到任何有效的名單內容。');
        }
      } catch (err) {
        setError('解析檔案失敗，請檢查格式是否正確。');
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  // Shuffle array
  const shuffle = (array: string[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const generateGroups = () => {
    if (names.length < 2) {
      setError('名單人數至少需要 2 人。');
      return;
    }
    setError(null);

    const shuffled = shuffle(names);
    let resultGroups: Group[] = [];

    if (mode === 'groupCount') {
      const numGroups = Math.min(count, names.length);
      for (let i = 0; i < numGroups; i++) {
        resultGroups.push({ id: `group-${i}`, name: `能量小組 ${i + 1}`, members: [] });
      }
      shuffled.forEach((name, index) => {
        resultGroups[index % numGroups].members.push(name);
      });
    } else {
      const membersPerGroup = count;
      const numGroups = Math.ceil(names.length / membersPerGroup);
      for (let i = 0; i < numGroups; i++) {
        const start = i * membersPerGroup;
        const end = start + membersPerGroup;
        resultGroups.push({
          id: `group-${i}`,
          name: `能量小組 ${i + 1}`,
          members: shuffled.slice(start, end)
        });
      }
    }

    // Randomize leaders
    resultGroups = resultGroups.map(group => {
      const leaderIndex = Math.floor(Math.random() * group.members.length);
      return { ...group, leader: group.members[leaderIndex] };
    });

    setGroups(resultGroups);
    setIsGenerated(true);
    showToast('分組矩陣已生成');
  };

  const reset = () => {
    setIsGenerated(false);
    setGroups([]);
  };

  const copyResults = () => {
    const text = groups
      .map(g => `${g.name}${g.leader ? ` (隊長: ${g.leader})` : ''}：${g.members.join('、')}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    showToast('結果已複製');
  };

  const exportToExcel = () => {
    const data = groups.map(g => ({
      '小組名稱': g.name,
      '隊長': g.leader || '',
      '成員總數': g.members.length,
      '成員名單': g.members.join(', ')
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "分組結果");
    XLSX.writeFile(wb, `EnergyGroup_${new Date().toLocaleDateString()}.xlsx`);
    showToast('Excel 文件匯出中');
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-sans relative text-slate-100">
      {/* Background Mesh */}
      <div className="bg-mesh pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="mesh-1 animate-pulse" />
        <div className="mesh-2 animate-pulse" />
        <div className="mesh-3 animate-pulse" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center mb-6"
          >
            <div className="bg-gradient-to-tr from-slate-400 to-slate-600 p-0.5 rounded-2xl shadow-2xl">
              <div className="bg-[#0f172a] p-4 rounded-[14px]">
                <Users className="w-8 h-8 text-slate-300" />
              </div>
            </div>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-200 to-slate-500 tracking-tight mb-4"
          >
            能量生成分組大工具
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-slate-400 text-lg font-mono uppercase tracking-[0.2em]"
          >
            Energy Optimization Matrix System
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Input Section */}
          <div className="md:col-span-12 lg:col-span-5 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-panel p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-slate-400" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">輸入名單</h2>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={loadExample}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-all uppercase tracking-wider"
                  >
                    <Plus className="w-3 h-3" /> 載入範例
                  </button>
                </div>
              </div>
              
              <textarea
                value={inputText}
                onChange={handleInputChange}
                placeholder="輸入名字，用空格、逗號或換行分隔..."
                className="w-full h-64 p-4 text-slate-200 bg-black/30 border border-white/5 rounded-2xl focus:ring-1 focus:ring-slate-500/50 transition-all outline-none resize-none font-mono text-sm placeholder:text-slate-600"
              />

              <div className="mt-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono uppercase">
                    MEMBERS: <span className="text-white font-bold">{names.length}</span>
                  </span>
                  <button 
                    onClick={() => { setInputText(''); setNames([]); }}
                    className="text-slate-500 hover:text-rose-400 transition-colors p-2"
                    title="清除"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload}
                  accept=".xlsx, .xls, .csv"
                  className="hidden" 
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-all text-xs font-bold uppercase tracking-widest group"
                >
                  <FileUp className="w-4 h-4 text-slate-500 group-hover:scale-110 transition-transform" />
                  資料匯入 (Excel/CSV)
                </button>
                
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </motion.div>
                )}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-panel p-6 shadow-xl"
            >
              <div className="flex items-center gap-2 mb-6">
                <LayoutGrid className="w-5 h-5 text-slate-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">分組設定</h2>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setMode('groupCount')}
                  className={`py-3 px-4 rounded-xl flex flex-col items-center gap-2 border transition-all ${
                    mode === 'groupCount' 
                      ? 'bg-white/10 border-white/20 text-white' 
                      : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wide">總組數</span>
                </button>
                <button
                  onClick={() => setMode('memberCount')}
                  className={`py-3 px-4 rounded-xl flex flex-col items-center gap-2 border transition-all ${
                    mode === 'memberCount' 
                      ? 'bg-white/10 border-white/20 text-white' 
                      : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <UserPlus className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wide">每組人數</span>
                </button>
              </div>

              <div className="relative mb-8">
                <div className="flex justify-between items-center mb-4 px-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Target {mode === 'groupCount' ? 'Groups' : 'Size'}
                  </label>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setCount(Math.max(2, count - 1))}
                      className="p-1 text-slate-600 hover:text-white transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-2xl font-black text-white font-mono">{count}</span>
                    <button 
                      onClick={() => setCount(Math.min(names.length || 10, count + 1))}
                      className="p-1 text-slate-600 hover:text-white transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="2"
                  max={Math.max(2, names.length)}
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-slate-300 opacity-80 hover:opacity-100 transition-opacity"
                />
              </div>

              <button
                disabled={names.length < 2}
                onClick={generateGroups}
                className="w-full bg-gradient-to-r from-slate-600/80 to-slate-800/80 hover:from-slate-600 hover:to-slate-700 text-white py-4 px-6 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 backdrop-blur-md shadow-xl shadow-black/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:scale-100"
              >
                <Shuffle className="w-5 h-5" />
                發動能量分組
              </button>
            </motion.div>
          </div>

          {/* Results Section */}
          <div className="md:col-span-12 lg:col-span-7">
            <AnimatePresence mode="wait">
              {!isGenerated ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[400px] bg-black/20 backdrop-blur-sm rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center p-8 text-center"
                >
                  <div className="bg-white/5 p-4 rounded-full border border-white/10 mb-4">
                    <ListOrdered className="w-8 h-8 text-slate-600" />
                  </div>
                  <h3 className="text-slate-400 font-bold uppercase tracking-widest text-sm">Waiting for Input</h3>
                  <p className="text-slate-500 text-xs mt-3 max-w-[200px] leading-relaxed">
                    輸入名單後點擊按鈕，系統將自動運行隨機分配算法。
                  </p>
                </motion.div>
              ) : (
                <motion.div 
                  key="results"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row items-center justify-between px-2 gap-4">
                    <h2 className="text-2xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                      分組結果報告
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-white/5 border border-white/10 rounded text-slate-400">SYNC_OK</span>
                    </h2>
                    <div className="flex gap-2">
                      <button 
                        onClick={copyResults}
                        className="bg-white/5 p-2.5 rounded-xl border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-all backdrop-blur-md shadow-sm"
                        title="複製結果"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={exportToExcel}
                        className="bg-white/5 p-2.5 rounded-xl border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-all backdrop-blur-md shadow-sm"
                        title="匯出 Excel"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={reset}
                        className="bg-white/5 p-2.5 rounded-xl border border-white/10 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition-all backdrop-blur-md shadow-sm"
                        title="重設"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {groups.map((group, index) => (
                      <motion.div
                        key={group.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="glass-card p-6 relative overflow-hidden group hover:border-white/30 transition-all duration-300"
                      >
                         <div className={`absolute top-0 left-0 w-1.5 h-full bg-slate-500`} />
                         
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="text-xl font-black text-slate-200 group-hover:text-white transition-colors uppercase italic">{group.name}</h4>
                          <span className="px-2 py-1 bg-white/5 border border-white/10 text-slate-500 text-[10px] rounded font-mono font-bold">
                            {group.members.length.toString().padStart(2, '0')} UNITS
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          {group.members.map((member, mIdx) => (
                            <div key={mIdx} className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${
                              member === group.leader 
                                ? 'bg-white/10 border-white/20 shadow-lg' 
                                : 'bg-black/20 border-white/5 hover:border-white/10'
                            }`}>
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shadow-inner ${
                                member === group.leader
                                  ? 'bg-slate-200 text-black'
                                  : 'bg-white/5 text-slate-500'
                              }`}>
                                {member === group.leader ? <Crown className="w-4 h-4" /> : member.charAt(0)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className={`text-sm font-bold ${member === group.leader ? 'text-white' : 'text-slate-400'}`}>{member}</span>
                                  {member === group.leader && <span className="text-[10px] font-black uppercase text-slate-300 tracking-[0.1em]">隊長</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5 flex justify-center">
                     <button
                        onClick={generateGroups}
                        className="text-slate-400 hover:text-white font-bold flex items-center gap-2 px-6 py-3 rounded-2xl hover:bg-white/5 transition-all text-sm uppercase tracking-widest"
                      >
                        <Shuffle className="w-5 h-5" />
                        RE-GENERATE
                      </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      <footer className="max-w-5xl mx-auto mt-20 flex flex-col sm:flex-row items-center justify-between gap-8 px-8 py-10 glass-panel border-white/5 text-[10px] text-slate-500 font-mono tracking-[0.2em] uppercase">
        <div className="flex gap-12">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse shadow-[0_0_8px_rgba(148,163,184,0.4)]" />
            STATUS: <span className="text-slate-400">READY</span>
          </div>
          <span>SYSTEM: STABLE</span>
          <span>MEMORY: OPTIMIZED</span>
        </div>
        <div className="flex items-center gap-6 opacity-40">
          <span>SECURE_ENCRYPTION_ACTIVE</span>
          <span className="bg-white/10 px-2 py-0.5 rounded text-[8px] font-black">ID: MATRIX_3.02-X</span>
        </div>
      </footer>

      {/* Dynamic Toast System */}
      <div className="fixed bottom-10 right-10 z-[100] space-y-4">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-3xl border ${
                toast.type === 'success' 
                  ? 'bg-white/10 border-white/20 text-white' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}
            >
              {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="text-xs font-black uppercase tracking-widest">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
