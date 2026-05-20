import { useState, useEffect, useRef } from 'react';
import { api } from '../api';

const MOCK_AI_RESPONSES = {
  productivity: {
    message: "Based on your current trajectory, optimizing your deep work hours will yield the highest ROI. Here is a custom routine tailored for maximum productivity:",
    habits: [
      { name: "Deep Work (90m)", icon: "psychology", category: "Focus", duration: "90 min" },
      { name: "Evening Planning", icon: "edit_calendar", category: "Planning", duration: "10 min" }
    ],
    prediction: "If you maintain this for 14 days, your output efficiency is predicted to increase by 42%.",
    tip: "Tip: Keep your phone in another room during the 90-minute deep work block."
  },
  health: {
    message: "Analyzing your physical wellness matrix... I recommend starting with fundamental hydration and movement to build a solid baseline.",
    habits: [
      { name: "Morning Hydration", icon: "water_drop", category: "Health", duration: "5 min" },
      { name: "Zone 2 Cardio", icon: "directions_run", category: "Fitness", duration: "30 min" }
    ],
    prediction: "Consistency here will improve your baseline energy levels by 30% within a week.",
    tip: "Tip: Drink a full glass of water immediately after waking up before checking any screens."
  },
  mindfulness: {
    message: "I detect high cognitive load. Let's introduce some mental decompression protocols to your daily schedule.",
    habits: [
      { name: "NSDR / Meditation", icon: "self_improvement", category: "Mindfulness", duration: "15 min" },
      { name: "Gratitude Journal", icon: "book", category: "Mindfulness", duration: "5 min" }
    ],
    prediction: "Implementing this will decrease perceived stress levels and improve sleep latency.",
    tip: "Tip: Use Non-Sleep Deep Rest (NSDR) protocols in the mid-afternoon to avoid the 3PM crash."
  }
};

export default function Assistant() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Initializing Habit Core AI... I am ready to optimize your routine. What is your primary objective today?", type: 'text' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText, type: 'text' }]);
    setIsTyping(true);

    // Simulate AI thinking
    setTimeout(() => {
      let intent = 'productivity';
      const lower = userText.toLowerCase();
      if (lower.includes('health') || lower.includes('sleep') || lower.includes('fit')) intent = 'health';
      if (lower.includes('mind') || lower.includes('stress') || lower.includes('relax')) intent = 'mindfulness';

      const response = MOCK_AI_RESPONSES[intent];
      
      setMessages(prev => [
        ...prev,
        { role: 'ai', text: response.message, type: 'text' },
        { role: 'ai', data: response, type: 'recommendation' }
      ]);
      setIsTyping(false);
    }, 1500);
  };

  const addHabit = async (habit) => {
    try {
      await api.createHabit({ ...habit, frequency: 'daily' });
      // Dispatch event so Layout can update if necessary, or just show feedback
      window.dispatchEvent(new Event('habit-added'));
      setMessages(prev => [...prev, { role: 'ai', text: `Successfully integrated [${habit.name}] into your daily protocol.`, type: 'text' }]);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white -m-4 p-4 md:-m-8 md:p-8 relative overflow-hidden font-sans flex flex-col">
      {/* Ambient background */}
      <div className="absolute top-[20%] left-[50%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none transform -translate-x-1/2" />
      
      <header className="relative z-10 max-w-4xl mx-auto w-full mb-6 flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <span className="material-symbols-outlined text-blue-400">smart_toy</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Core AI</h1>
            <p className="text-xs text-blue-400/80 font-mono">v2.0.4 // ONLINE</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-xs text-white/50 uppercase tracking-widest font-bold">System Nominal</span>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto w-full flex-1 flex flex-col gap-4 overflow-y-auto mb-20 md:mb-24 pr-2 scrollbar-hide">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            {msg.type === 'text' ? (
              <div className={`max-w-[80%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] rounded-br-none'
                  : 'bg-white/5 backdrop-blur-md border border-white/10 text-white/90 rounded-bl-none'
              }`}>
                {msg.text}
              </div>
            ) : (
              <div className="max-w-[90%] md:max-w-[80%] bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {msg.data.habits.map(habit => (
                    <div key={habit.name} className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col gap-3 hover:border-blue-500/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-blue-400">{habit.icon}</span>
                        <span className="font-bold text-sm">{habit.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <span className="px-2 py-1 bg-white/5 rounded-md">{habit.category}</span>
                        <span className="px-2 py-1 bg-white/5 rounded-md">{habit.duration}</span>
                      </div>
                      <button 
                        onClick={() => addHabit(habit)}
                        className="mt-2 w-full py-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 rounded-lg text-xs font-bold tracking-wider transition-colors border border-blue-500/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                      >
                        INTEGRATE HABIT
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-4 flex gap-3 items-start">
                  <span className="material-symbols-outlined text-blue-400 mt-0.5">timeline</span>
                  <div>
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-1">Consistency Prediction</span>
                    <p className="text-sm text-white/80">{msg.data.prediction}</p>
                  </div>
                </div>

                <div className="bg-purple-900/20 border border-purple-500/20 rounded-xl p-4 flex gap-3 items-start">
                  <span className="material-symbols-outlined text-purple-400 mt-0.5">lightbulb</span>
                  <div>
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block mb-1">Insight Optimization</span>
                    <p className="text-sm text-white/80">{msg.data.tip}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start animate-in fade-in">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl rounded-bl-none p-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="fixed bottom-0 left-0 w-full md:pl-64 p-4 z-20">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="E.g., I want to improve my focus..."
              className="w-full bg-[#121826]/80 backdrop-blur-xl border border-white/10 rounded-full py-4 pl-6 pr-14 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-lg"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </form>
          <div className="flex justify-center gap-4 mt-3">
            {['Productivity', 'Health', 'Stress Relief'].map(suggestion => (
              <button 
                key={suggestion}
                type="button"
                onClick={() => setInput(`I want to focus on ${suggestion.toLowerCase()}`)}
                className="text-[10px] uppercase tracking-wider font-bold text-white/40 hover:text-blue-400 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
