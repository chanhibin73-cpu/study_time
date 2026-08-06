import React, { useState, useEffect } from 'react';
import { 
  Menu, X, Home, Calendar, BarChart2, Settings, 
  Dumbbell, BookOpen, PlusCircle, ChevronRight, ChevronLeft, 
  Save, Check, Clock, Edit3, Target, AlertTriangle, Trash2
} from 'lucide-react';

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  // ★アニメーション用のステート（タブ切り替え時などに発火）
  const [showAnimations, setShowAnimations] = useState(false);

  // データ管理用のステート
  const [records, setRecords] = useState([]);
  const [goalStudy, setGoalStudy] = useState(60);
  const [goalWorkout, setGoalWorkout] = useState(30);
  
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);
  const [showSettingsSuccess, setShowSettingsSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 今日の記録用ステート
  const [studyTime, setStudyTime] = useState('');
  const [workoutTime, setWorkoutTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [selectedDateStr, setSelectedDateStr] = useState(getTodayStr());

  const STORAGE_KEY = 'fit_and_study_records_v2';
  const GOAL_STORAGE_KEY = 'fit_and_study_goals';

  const formatDateWithDay = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    return `${m}月${d}日(${dayNames[dateObj.getDay()]})`;
  };

  // アプリ起動時のデータ読み込み
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    let loadedRecords = [];
    if (savedData) {
      loadedRecords = JSON.parse(savedData);
    } else {
      const sample = [];
      const today = new Date();
      for (let i = 0; i < 90; i++) {
        if (Math.random() > 0.4) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          sample.push({
            date: dateStr,
            study: [30, 45, 60, 90, 120][Math.floor(Math.random() * 5)],
            workout: [0, 20, 30, 45, 60][Math.floor(Math.random() * 5)]
          });
        }
      }
      loadedRecords = sample;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
    }
    setRecords(loadedRecords);

    const todayStr = getTodayStr();
    const todayRecord = loadedRecords.find(r => r.date === todayStr);
    if (todayRecord) {
      setStudyTime(todayRecord.study > 0 ? String(todayRecord.study) : '');
      setWorkoutTime(todayRecord.workout > 0 ? String(todayRecord.workout) : '');
    }

    const savedGoals = localStorage.getItem(GOAL_STORAGE_KEY);
    if (savedGoals) {
      const goals = JSON.parse(savedGoals);
      if (goals.study) setGoalStudy(goals.study);
      if (goals.workout) setGoalWorkout(goals.workout);
    }
  }, []);

  // ★タブやカレンダー月が変わるたびにアニメーションをリセットして再発火
  useEffect(() => {
    setShowAnimations(false);
    const timer = setTimeout(() => {
      setShowAnimations(true);
    }, 50); // 描画直後にステートを変えることでCSSトランジションを発火
    return () => clearTimeout(timer);
  }, [activeTab, currentMonthDate]);


  // ====== データの集計ロジック ======
  const generateWeeklyData = () => {
    const result = [];
    const today = new Date();
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const record = records.find(r => r.date === dateStr);
      result.push({
        dateStr,
        day: dayNames[d.getDay()],
        study: record ? record.study : 0,
        workout: record ? record.workout : 0,
      });
    }
    return result;
  };
  const weeklyData = generateWeeklyData();
  const maxTimeInWeek = Math.max(...weeklyData.map(d => Math.max(d.study, d.workout)));
  const maxTime = Math.max(120, maxTimeInWeek); 

  const handlePrevMonth = () => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  for(let i=0; i<firstDay; i++) calendarDays.push(null);
  for(let i=1; i<=daysInMonth; i++) calendarDays.push(i);

  const selectedRecord = records.find(r => r.date === selectedDateStr);

  const weeklyStats = [];
  let currentWeek = 1;
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const record = records.find(r => r.date === dateStr);
    const dayOfWeek = new Date(year, month, d).getDay();
    
    if (!weeklyStats[currentWeek - 1]) weeklyStats[currentWeek - 1] = { week: currentWeek, study: 0, workout: 0 };
    if (record) {
      weeklyStats[currentWeek - 1].study += record.study || 0;
      weeklyStats[currentWeek - 1].workout += record.workout || 0;
    }
    if (dayOfWeek === 6 && d !== daysInMonth) currentWeek++;
  }
  const maxWeeklyTime = Math.max(120, ...weeklyStats.map(w => Math.max(w.study, w.workout)));

  const monthlyStats = Array.from({length: 12}, (_, i) => ({ month: i + 1, study: 0, workout: 0 }));
  records.forEach(r => {
    const [y, m, d] = r.date.split('-');
    if (parseInt(y) === year) {
      monthlyStats[parseInt(m) - 1].study += r.study || 0;
      monthlyStats[parseInt(m) - 1].workout += r.workout || 0;
    }
  });
  const maxMonthlyTime = Math.max(300, ...monthlyStats.map(m => Math.max(m.study, m.workout)));

  // ====== 入力・保存機能 ======
  const addTime = (type, amount) => {
    if (type === 'study') setStudyTime(prev => String((parseInt(prev) || 0) + amount));
    else setWorkoutTime(prev => String((parseInt(prev) || 0) + amount));
  };

  const handleSaveRecord = () => {
    const sTime = parseInt(studyTime) || 0;
    const wTime = parseInt(workoutTime) || 0;
    if (sTime === 0 && wTime === 0) return;
    setIsSaving(true);
    
    setTimeout(() => {
      const todayStr = getTodayStr();
      let updatedRecords = [...records];
      const existingIndex = updatedRecords.findIndex(r => r.date === todayStr);
      
      if (existingIndex >= 0) updatedRecords[existingIndex] = { date: todayStr, study: sTime, workout: wTime };
      else updatedRecords.push({ date: todayStr, study: sTime, workout: wTime });

      updatedRecords.sort((a, b) => a.date.localeCompare(b.date));
      setRecords(updatedRecords);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));

      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500); // メッセージを少し早く消す
    }, 600); // ローディングも少し長めにして「保存してる感」を出す
  };

  const handleSaveSettings = () => {
    setIsSettingsSaving(true);
    setTimeout(() => {
      localStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify({ study: goalStudy, workout: goalWorkout }));
      setIsSettingsSaving(false);
      setShowSettingsSuccess(true);
      setTimeout(() => setShowSettingsSuccess(false), 2500);
    }, 600);
  };

  const executeDeleteData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setRecords([]);
    setStudyTime('');
    setWorkoutTime('');
    setShowDeleteModal(false);
    setSelectedDateStr(getTodayStr());
  };

  const navItems = [
    { id: 'home', label: 'ホーム', icon: Home },
    { id: 'today', label: '今日の記録', icon: Calendar },
    { id: 'history', label: '今までの記録', icon: BarChart2 },
    { id: 'settings', label: '設定', icon: Settings },
  ];

  const currentStudyVal = parseInt(studyTime) || 0;
  const currentWorkoutVal = parseInt(workoutTime) || 0;
  const studyProgress = Math.min(100, (currentStudyVal / goalStudy) * 100) || 0;
  const workoutProgress = Math.min(100, (currentWorkoutVal / goalWorkout) * 100) || 0;

  // 各画面を包む共通のアニメーションクラス
  const pageTransitionClass = "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col overflow-x-hidden">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 shadow-sm transition-all">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-md shadow-indigo-200 transition-transform active:scale-95">
              <Dumbbell className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Fit & Study
            </h1>
          </div>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all active:scale-90"
          >
            {isMenuOpen ? <X className="w-6 h-6 animate-in fade-in zoom-in duration-300" /> : <Menu className="w-6 h-6 animate-in fade-in zoom-in duration-300" />}
          </button>
        </div>
      </header>

      {/* ハンバーガーメニュー */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-30 flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsMenuOpen(false)}></div>
          <div className="relative w-64 max-w-[80%] bg-white h-full shadow-2xl p-5 flex flex-col justify-between z-10 animate-in slide-in-from-left duration-300 ease-out">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <span className="font-bold text-slate-700">メニュー</span>
                <button onClick={() => setIsMenuOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-md active:scale-90 transition-transform"><X className="w-5 h-5" /></button>
              </div>
              <nav className="space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setIsMenuOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl font-medium transition-all active:scale-95 ${
                      activeTab === item.id ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 transition-transform ${activeTab === item.id ? 'text-indigo-600 scale-110' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* メインコンテンツエリア */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6">
        
        {/* ホーム画面 */}
        {activeTab === 'home' && (
          <div className={pageTransitionClass}>
            {/* 今日の概要とプログレスバー */}
            <section className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200 overflow-hidden relative">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
              
              <h2 className="text-sm font-medium text-indigo-100 mb-1 relative z-10">本日の目標達成度</h2>
              
              <div className="mt-4 space-y-5 relative z-10">
                <div>
                  <div className="flex justify-between items-end mb-1.5">
                    <div className="flex items-center space-x-1.5 text-sm font-medium">
                      <BookOpen className="w-4 h-4 text-indigo-200" />
                      <span>学習</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-xl font-bold">{currentStudyVal}</span>
                      <span className="text-indigo-200 text-xs ml-1">/ {goalStudy}分</span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full bg-white/20 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-white rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: showAnimations ? `${studyProgress}%` : '0%' }} 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-1.5">
                    <div className="flex items-center space-x-1.5 text-sm font-medium">
                      <Dumbbell className="w-4 h-4 text-emerald-300" />
                      <span>筋トレ</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-xl font-bold">{currentWorkoutVal}</span>
                      <span className="text-indigo-200 text-xs ml-1">/ {goalWorkout}分</span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full bg-white/20 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-emerald-400 rounded-full transition-all duration-1000 ease-out delay-150" 
                      style={{ width: showAnimations ? `${workoutProgress}%` : '0%' }} 
                    />
                  </div>
                </div>
              </div>

              {(studyProgress >= 100 && workoutProgress >= 100) ? (
                <div className="mt-5 pt-3 border-t border-indigo-500/30 text-center font-bold text-yellow-300 text-sm flex items-center justify-center animate-in fade-in zoom-in duration-500 delay-300">
                  <Check className="w-4 h-4 mr-1" /> 両方の目標をクリア！素晴らしい！
                </div>
              ) : (
                <div className="mt-5 pt-3 border-t border-indigo-500/30 text-center text-indigo-100 text-xs">
                  今日も自分のペースでがんばりましょう！
                </div>
              )}
            </section>

            {/* 週別グラフ（ホーム） */}
            <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-800">今週の記録</h3>
                  <p className="text-xs text-slate-400">直近7日間の活動状況</p>
                </div>
                <div className="flex items-center space-x-3 text-xs">
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                    <span className="text-slate-600">学習</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-600">筋トレ</span>
                  </div>
                </div>
              </div>
              
              <div className="h-48 flex items-end justify-between pt-8 pb-2 px-1 gap-2">
                {weeklyData.map((data, index) => {
                  const studyHeight = (data.study / maxTime) * 100;
                  const workoutHeight = (data.workout / maxTime) * 100;
                  const isToday = index === 6; 
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group">
                      <div className="w-full flex justify-center items-end gap-1 h-full">
                        {/* 学習バー */}
                        <div 
                          style={{ height: showAnimations ? `${studyHeight}%` : '0%' }} 
                          className={`w-1/2 rounded-t-sm transition-all duration-700 ease-out relative flex justify-center ${isToday ? 'bg-indigo-400' : 'bg-indigo-500'} delay-${index * 75}`}
                        >
                          {data.study > 0 && showAnimations && (
                            <span className="absolute -top-4 text-[9px] font-bold text-indigo-600 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-500">
                              {data.study}
                            </span>
                          )}
                        </div>
                        {/* 筋トレバー */}
                        <div 
                          style={{ height: showAnimations ? `${workoutHeight}%` : '0%' }} 
                          className={`w-1/2 rounded-t-sm transition-all duration-700 ease-out relative flex justify-center ${isToday ? 'bg-emerald-400' : 'bg-emerald-500'} delay-${index * 75 + 50}`}
                        >
                          {data.workout > 0 && showAnimations && (
                            <span className="absolute -top-4 text-[9px] font-bold text-emerald-600 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-500">
                              {data.workout}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs font-medium mt-2 transition-colors ${isToday ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>{data.day}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* 今日の記録画面 */}
        {activeTab === 'today' && (
          <div className={pageTransitionClass}>
            <div className="mb-2">
              <h2 className="text-xl font-bold text-slate-800">今日の記録</h2>
              <p className="text-sm text-slate-500">今日がんばった時間を記録しましょう！</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 text-indigo-600">
                  <div className="p-1.5 bg-indigo-50 rounded-lg"><BookOpen className="w-5 h-5" /></div>
                  <h3 className="font-bold text-slate-800">学習時間</h3>
                </div>
              </div>
              <div className="flex items-end space-x-2 mb-5">
                <input 
                  type="number" min="0" value={studyTime} onChange={(e) => setStudyTime(e.target.value)} placeholder="0"
                  className="w-full text-5xl font-bold text-center border-b-2 border-slate-100 focus:border-indigo-500 focus:outline-none pb-2 text-slate-800 transition-colors bg-transparent placeholder:text-slate-200"
                />
                <span className="text-slate-500 font-medium pb-3">分</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => addTime('study', 15)} className="flex-1 py-3 bg-indigo-50 text-indigo-600 text-sm font-bold rounded-xl hover:bg-indigo-100 active:scale-95 transition-all shadow-sm">+ 15分</button>
                <button onClick={() => addTime('study', 30)} className="flex-1 py-3 bg-indigo-50 text-indigo-600 text-sm font-bold rounded-xl hover:bg-indigo-100 active:scale-95 transition-all shadow-sm">+ 30分</button>
                <button onClick={() => addTime('study', 60)} className="flex-1 py-3 bg-indigo-50 text-indigo-600 text-sm font-bold rounded-xl hover:bg-indigo-100 active:scale-95 transition-all shadow-sm">+ 60分</button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 text-emerald-600">
                  <div className="p-1.5 bg-emerald-50 rounded-lg"><Dumbbell className="w-5 h-5" /></div>
                  <h3 className="font-bold text-slate-800">筋トレ時間</h3>
                </div>
              </div>
              <div className="flex items-end space-x-2 mb-5">
                <input 
                  type="number" min="0" value={workoutTime} onChange={(e) => setWorkoutTime(e.target.value)} placeholder="0"
                  className="w-full text-5xl font-bold text-center border-b-2 border-slate-100 focus:border-emerald-500 focus:outline-none pb-2 text-slate-800 transition-colors bg-transparent placeholder:text-slate-200"
                />
                <span className="text-slate-500 font-medium pb-3">分</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => addTime('workout', 10)} className="flex-1 py-3 bg-emerald-50 text-emerald-600 text-sm font-bold rounded-xl hover:bg-emerald-100 active:scale-95 transition-all shadow-sm">+ 10分</button>
                <button onClick={() => addTime('workout', 20)} className="flex-1 py-3 bg-emerald-50 text-emerald-600 text-sm font-bold rounded-xl hover:bg-emerald-100 active:scale-95 transition-all shadow-sm">+ 20分</button>
                <button onClick={() => addTime('workout', 30)} className="flex-1 py-3 bg-emerald-50 text-emerald-600 text-sm font-bold rounded-xl hover:bg-emerald-100 active:scale-95 transition-all shadow-sm">+ 30分</button>
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={handleSaveRecord} disabled={isSaving || (!studyTime && !workoutTime)}
                className={`w-full flex items-center justify-center space-x-2 py-4 rounded-xl font-bold text-white transition-all duration-300 ${
                  isSaving || (!studyTime && !workoutTime) 
                    ? 'bg-slate-300 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-95'
                }`}
              >
                {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : showSuccess ? <><Check className="w-5 h-5 animate-in zoom-in duration-300" /><span className="animate-in fade-in slide-in-from-right-2 duration-300">保存しました！</span></>
                  : <><Save className="w-5 h-5" /><span>記録を保存する</span></>}
              </button>
            </div>
          </div>
        )}

        {/* 今までの記録画面（カレンダー＆グラフ） */}
        {activeTab === 'history' && (
          <div className={`${pageTransitionClass} pb-6`}>
            <div className="mb-2">
              <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
                <BarChart2 className="w-6 h-6 text-emerald-600" />
                <span>今までの記録</span>
              </h2>
              <p className="text-sm text-slate-500 mt-1">日付をタップすると詳細が表示されます。</p>
            </div>

            <div className="flex items-center justify-end space-x-3 text-xs mb-2 pr-1">
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <span className="text-slate-600">学習</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-600">筋トレ</span>
              </div>
            </div>

            {/* カレンダー */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <button onClick={handlePrevMonth} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-all active:scale-90"><ChevronLeft className="w-5 h-5"/></button>
                <div className="font-bold text-slate-800 text-lg animate-in fade-in zoom-in duration-300" key={year+month}>{year}年 {month + 1}月</div>
                <button onClick={handleNextMonth} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-all active:scale-90"><ChevronRight className="w-5 h-5"/></button>
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400 mb-2">
                <div className="text-red-400">日</div><div>月</div><div>火</div><div>水</div><div>木</div><div>金</div><div className="text-blue-400">土</div>
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                  if (day === null) return <div key={`empty-${idx}`} className="h-12"></div>;
                  
                  const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                  const record = records.find(r => r.date === dateStr);
                  const hasStudy = record && record.study > 0;
                  const hasWorkout = record && record.workout > 0;
                  const isSelected = selectedDateStr === dateStr;
                  const isToday = getTodayStr() === dateStr;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDateStr(dateStr)}
                      className={`h-12 flex flex-col items-center justify-center rounded-xl border transition-all duration-200 relative ${
                        isSelected 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105 z-10' 
                          : isToday 
                            ? 'border-indigo-300 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100/50' 
                            : 'border-transparent text-slate-700 hover:bg-slate-100 active:scale-95'
                      }`}
                    >
                      <span className={`text-sm font-medium ${isSelected ? 'text-white' : ''}`}>{day}</span>
                      <div className="flex space-x-1 mt-1 h-1.5">
                        {hasStudy && <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isSelected ? 'bg-white' : 'bg-indigo-500'}`} />}
                        {hasWorkout && <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isSelected ? 'bg-emerald-300' : 'bg-emerald-500'}`} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 詳細カード (日付選択でアニメーション発火) */}
            <div key={selectedDateStr} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 animate-in slide-in-from-top-4 fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <span className="font-bold text-slate-800">{formatDateWithDay(selectedDateStr)} の詳細</span>
                </div>
                {selectedDateStr === getTodayStr() && (
                  <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">今日</span>
                )}
              </div>

              {selectedRecord && (selectedRecord.study > 0 || selectedRecord.workout > 0) ? (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-indigo-50/60 rounded-xl p-3 border border-indigo-100">
                    <div className="flex items-center space-x-1.5 text-xs text-indigo-600 mb-1">
                      <BookOpen className="w-4 h-4" />
                      <span className="font-medium">学習時間</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-800">
                      {selectedRecord.study || 0} <span className="text-xs font-normal text-slate-500">分</span>
                    </div>
                  </div>
                  <div className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-100">
                    <div className="flex items-center space-x-1.5 text-xs text-emerald-600 mb-1">
                      <Dumbbell className="w-4 h-4" />
                      <span className="font-medium">筋トレ時間</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-800">
                      {selectedRecord.workout || 0} <span className="text-xs font-normal text-slate-500">分</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">この日の記録はありません</p>
                </div>
              )}

              {selectedDateStr === getTodayStr() && (
                <button
                  onClick={() => setActiveTab('today')}
                  className="w-full mt-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all active:scale-95 border border-slate-200"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>今日の記録を入力・編集する</span>
                </button>
              )}
            </div>

            {/* 週別グラフ (履歴用) */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-1">{month + 1}月の週別記録</h3>
              <p className="text-xs text-slate-400 mb-4">週ごとの合計時間 (分)</p>
              <div className="h-44 flex items-end justify-between pt-8 pb-2 px-1 gap-2">
                {weeklyStats.map((stat, idx) => {
                  const studyHeight = (stat.study / maxWeeklyTime) * 100;
                  const workoutHeight = (stat.workout / maxWeeklyTime) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end">
                      <div className="w-full flex justify-center items-end gap-1 h-full">
                        <div 
                          style={{ height: showAnimations ? `${studyHeight}%` : '0%' }} 
                          className="w-full max-w-[16px] bg-indigo-500 rounded-t-sm transition-all duration-700 ease-out relative flex justify-center"
                        >
                          {stat.study > 0 && showAnimations && <span className="absolute -top-4 text-[8px] font-bold text-indigo-600 animate-in fade-in duration-300 delay-500">{stat.study}</span>}
                        </div>
                        <div 
                          style={{ height: showAnimations ? `${workoutHeight}%` : '0%' }} 
                          className="w-full max-w-[16px] bg-emerald-500 rounded-t-sm transition-all duration-700 ease-out relative flex justify-center delay-75"
                        >
                          {stat.workout > 0 && showAnimations && <span className="absolute -top-4 text-[8px] font-bold text-emerald-600 animate-in fade-in duration-300 delay-500">{stat.workout}</span>}
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 mt-2 transition-opacity">第{stat.week}週</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 月別グラフ (履歴用) */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-1">{year}年の月別記録</h3>
              <p className="text-xs text-slate-400 mb-4">月ごとの合計時間 (分)</p>
              <div className="h-44 flex items-end justify-between pt-8 pb-2 px-1 gap-1">
                {monthlyStats.map((stat, idx) => {
                  const studyHeight = (stat.study / maxMonthlyTime) * 100;
                  const workoutHeight = (stat.workout / maxMonthlyTime) * 100;
                  const isCurrentMonth = stat.month === month + 1;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end">
                      <div className="w-full flex justify-center items-end gap-[1px] h-full">
                        <div 
                          style={{ height: showAnimations ? `${studyHeight}%` : '0%' }} 
                          className={`w-full max-w-[12px] ${isCurrentMonth ? 'bg-indigo-400' : 'bg-indigo-500'} rounded-t-sm transition-all duration-700 ease-out relative flex justify-center`}
                        >
                          {stat.study > 0 && showAnimations && <span className="absolute -top-4 text-[8px] font-bold text-indigo-600 animate-in fade-in duration-300 delay-500">{stat.study}</span>}
                        </div>
                        <div 
                          style={{ height: showAnimations ? `${workoutHeight}%` : '0%' }} 
                          className={`w-full max-w-[12px] ${isCurrentMonth ? 'bg-emerald-400' : 'bg-emerald-500'} rounded-t-sm transition-all duration-700 ease-out relative flex justify-center delay-75`}
                        >
                          {stat.workout > 0 && showAnimations && <span className="absolute -top-4 text-[8px] font-bold text-emerald-600 animate-in fade-in duration-300 delay-500">{stat.workout}</span>}
                        </div>
                      </div>
                      <span className={`text-[10px] font-medium mt-2 transition-colors ${isCurrentMonth ? 'text-slate-800 font-bold' : 'text-slate-400'}`}>{stat.month}月</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 設定画面 */}
        {activeTab === 'settings' && (
          <div className={`${pageTransitionClass} pb-6`}>
            <div className="mb-2">
              <h2 className="text-xl font-bold text-slate-800">設定</h2>
              <p className="text-sm text-slate-500">アプリの目標やデータを管理します。</p>
            </div>

            {/* 目標設定カード */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-slate-800 mb-5 flex items-center">
                <div className="p-1.5 bg-indigo-50 rounded-lg mr-2"><Target className="w-5 h-5 text-indigo-600" /></div>
                1日の目標時間
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-slate-700 flex items-center mb-2">
                    <BookOpen className="w-4 h-4 mr-1.5 text-indigo-500" /> 学習の目標
                  </label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number" min="0" value={goalStudy} onChange={(e) => setGoalStudy(Number(e.target.value) || 0)}
                      className="w-full text-3xl font-bold text-slate-800 border-b-2 border-slate-100 focus:border-indigo-500 focus:outline-none pb-1 bg-transparent transition-colors"
                    />
                    <span className="text-slate-500 font-medium">分</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 flex items-center mb-2">
                    <Dumbbell className="w-4 h-4 mr-1.5 text-emerald-500" /> 筋トレの目標
                  </label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number" min="0" value={goalWorkout} onChange={(e) => setGoalWorkout(Number(e.target.value) || 0)}
                      className="w-full text-3xl font-bold text-slate-800 border-b-2 border-slate-100 focus:border-emerald-500 focus:outline-none pb-1 bg-transparent transition-colors"
                    />
                    <span className="text-slate-500 font-medium">分</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button 
                  onClick={handleSaveSettings} disabled={isSettingsSaving}
                  className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white rounded-xl font-bold transition-all duration-300 flex justify-center items-center shadow-md shadow-slate-200"
                >
                  {isSettingsSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : showSettingsSuccess ? <><Check className="w-5 h-5 mr-2 text-emerald-400 animate-in zoom-in duration-300" /><span className="animate-in fade-in slide-in-from-right-2 duration-300">保存しました</span></>
                    : <><Save className="w-5 h-5 mr-2" />目標を保存する</>}
                </button>
              </div>
            </div>

            {/* データ管理カード */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-bold text-red-600 mb-2 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" /> 危険な操作
              </h3>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                アプリ内のすべての記録データを完全に消去します。この操作は取り消せません。
              </p>
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="w-full py-3 bg-white hover:bg-red-50 text-red-600 rounded-xl font-bold transition-all duration-200 border border-red-200 flex justify-center items-center active:scale-95"
              >
                <Trash2 className="w-5 h-5 mr-2" /> すべてのデータを削除
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 削除確認モーダル */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowDeleteModal(false)}></div>
          
          <div className="relative bg-white rounded-3xl p-6 w-[85%] max-w-sm shadow-2xl z-10 animate-in zoom-in-95 fade-in duration-300">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-5 mx-auto animate-bounce">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2 text-center">データを削除しますか？</h3>
            <p className="text-sm text-slate-500 mb-6 text-center leading-relaxed">
              これまでの記録がすべて消去されます。<br/>本当によろしいですか？
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all active:scale-95"
              >
                キャンセル
              </button>
              <button 
                onClick={executeDeleteData}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-200 active:scale-95"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* フッターナビゲーション */}
      <footer className="bg-white/90 backdrop-blur-md border-t border-slate-200 sticky bottom-0 z-10 pb-safe">
        <div className="max-w-md mx-auto flex justify-around py-1.5 px-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="relative flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all active:scale-90"
              >
                {/* 選択中の背景ハイライト */}
                <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${isActive ? 'bg-indigo-50 scale-100 opacity-100' : 'scale-50 opacity-0'}`}></div>
                
                <item.icon className={`w-5 h-5 z-10 transition-all duration-300 ${isActive ? 'text-indigo-600 -translate-y-0.5' : 'text-slate-400'}`} />
                <span className={`text-[9px] font-bold z-10 transition-all duration-300 ${isActive ? 'text-indigo-600 opacity-100' : 'text-slate-400 opacity-80'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </footer>
    </div>
  );
}


