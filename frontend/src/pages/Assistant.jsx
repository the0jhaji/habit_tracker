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
      window.dispatchEvent(new Event('habit-added'));
      setMessages(prev => [...prev, { role: 'ai', text: `Successfully integrated [${habit.name}] into your daily protocol.`, type: 'text' }]);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] animate-in fade-in duration-500">
      <header className="mb-6 flex items-center justify-between border-b border-outline-variant/30 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">smart_toy</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">Core AI</h1>
            <p className="text-xs text-primary font-mono">v2.0.4 // ONLINE</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
          </span>
          <span className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">System Nominal</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pr-2 scrollbar-hide flex flex-col gap-4 pb-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            {msg.type === 'text' ? (
              <div className={`max-w-[80%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-primary text-on-primary rounded-br-none'
                  : 'bg-surface-container text-on-surface rounded-bl-none shadow-sm'
              }`}>
                {msg.text}
              </div>
            ) : (
              <div className="max-w-[90%] md:max-w-[80%] bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-5 shadow-sm flex flex-col gap-4 rounded-bl-none">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {msg.data.habits.map(habit => (
                    <div key={habit.name} className="bg-surface border border-outline-variant/30 rounded-xl p-4 flex flex-col gap-3 hover:border-primary/50 transition-colors">
                      <div className="flex items-center gap-3 text-on-surface">
                        <span className="material-symbols-outlined text-primary">{habit.icon}</span>
                        <span className="font-bold text-sm">{habit.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <span className="px-2 py-1 bg-surface-container rounded-md">{habit.category}</span>
                        <span className="px-2 py-1 bg-surface-container rounded-md">{habit.duration}</span>
                      </div>
                      <button 
                        onClick={() => addHabit(habit)}
                        className="mt-2 w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-bold tracking-wider transition-colors border border-primary/20"
                      >
                        INTEGRATE HABIT
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="bg-secondary-container border border-secondary-container/50 rounded-xl p-4 flex gap-3 items-start">
                  <span className="material-symbols-outlined text-on-secondary-container mt-0.5">timeline</span>
                  <div>
                    <span className="text-xs font-bold text-on-secondary-container uppercase tracking-wider block mb-1">Consistency Prediction</span>
                    <p className="text-sm text-on-secondary-container/90">{msg.data.prediction}</p>
                  </div>
                </div>

                <div className="bg-tertiary-container border border-tertiary-container/50 rounded-xl p-4 flex gap-3 items-start">
                  <span className="material-symbols-outlined text-on-tertiary-container mt-0.5">lightbulb</span>
                  <div>
                    <span className="text-xs font-bold text-on-tertiary-container uppercase tracking-wider block mb-1">Insight Optimization</span>
                    <p className="text-sm text-on-tertiary-container/90">{msg.data.tip}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start animate-in fade-in">
            <div className="bg-surface-container text-on-surface rounded-2xl rounded-bl-none p-4 flex items-center gap-2 shadow-sm">
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="pt-4 border-t border-outline-variant/20 mt-auto bg-background">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="E.g., I want to improve my focus..."
            className="w-full bg-surface-container-low border border-outline-variant/50 rounded-full py-4 pl-6 pr-14 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary/50 transition-colors"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-on-primary hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
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
              className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant hover:text-primary transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}
