import React, { useState } from 'react';
import { LayoutDashboard, Calculator, BrainCircuit, AlertTriangle, Activity, Menu, X, Ticket, Wallet, Wand2, Radar, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toaster } from 'sonner';
import DashboardTab from '@/components/DashboardTab';
import CalculatorTab from '@/components/CalculatorTab';
import AiAnalysisTab from '@/components/AiAnalysisTab';
import TicketsTab from '@/components/TicketsTab';
import BankrollTab from '@/components/BankrollTab';
import BetMentorTab from '@/components/BetMentorTab';
import RadarTab from '@/components/RadarTab';
import LeverageTab from '@/components/LeverageTab';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-zinc-50 text-zinc-900 font-sans overflow-hidden">
      <Toaster position="top-center" richColors theme="light" />
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-950 text-zinc-100 flex items-center justify-between px-4 z-50 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-500" />
          <h1 className="text-base font-mono font-bold tracking-tight">BetSafe_AI</h1>
        </div>
        <button onClick={toggleMenu} className="p-2 text-zinc-400 hover:text-white">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar (Desktop) & Mobile Menu */}
      <aside className={cn(
        "fixed md:static inset-y-0 left-0 z-40 w-64 bg-zinc-950 text-zinc-300 flex flex-col border-r border-zinc-800 transition-transform duration-300 ease-in-out md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0 pt-16 md:pt-0" : "-translate-x-full"
      )}>
        <div className="hidden md:flex p-6 items-center gap-3 border-b border-zinc-800">
          <Activity className="w-6 h-6 text-emerald-500" />
          <h1 className="text-lg font-mono font-bold tracking-tight text-zinc-100">BetSafe_AI</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button
            onClick={() => handleTabChange('dashboard')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 md:py-2.5 rounded-md text-sm font-mono transition-colors",
              activeTab === 'dashboard' ? "bg-emerald-900/50 text-emerald-400 border border-emerald-800/50" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent"
            )}
          >
            <LayoutDashboard className="w-5 h-5 md:w-4 md:h-4" />
            Terminal de Dados
          </button>
          <button
            onClick={() => handleTabChange('radar')}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 md:py-2.5 rounded-md text-sm font-mono transition-colors",
              activeTab === 'radar' ? "bg-emerald-900/50 text-emerald-400 border border-emerald-800/50" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent"
            )}
          >
            <div className="flex items-center gap-3">
              <Radar className="w-5 h-5 md:w-4 md:h-4 text-rose-500" />
              Radar de Tendências
            </div>
            <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded-sm font-bold">HOT</span>
          </button>
          <button
            onClick={() => handleTabChange('leverage')}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 md:py-2.5 rounded-md text-sm font-mono transition-colors",
              activeTab === 'leverage' ? "bg-emerald-900/50 text-emerald-400 border border-emerald-800/50" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent"
            )}
          >
            <div className="flex items-center gap-3">
              <Rocket className="w-5 h-5 md:w-4 md:h-4 text-purple-500" />
              Alavancagem
            </div>
          </button>
          <button
            onClick={() => handleTabChange('mentor')}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 md:py-2.5 rounded-md text-sm font-mono transition-colors",
              activeTab === 'mentor' ? "bg-emerald-900/50 text-emerald-400 border border-emerald-800/50" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent"
            )}
          >
            <div className="flex items-center gap-3">
              <Wand2 className="w-5 h-5 md:w-4 md:h-4 text-purple-400" />
              Bet Mentor AI
            </div>
          </button>
          <button
            onClick={() => handleTabChange('tickets')}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 md:py-2.5 rounded-md text-sm font-mono transition-colors",
              activeTab === 'tickets' ? "bg-emerald-900/50 text-emerald-400 border border-emerald-800/50" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent"
            )}
          >
            <div className="flex items-center gap-3">
              <Ticket className="w-5 h-5 md:w-4 md:h-4" />
              Bilhetes do Dia
            </div>
          </button>
          <button
            onClick={() => handleTabChange('calculator')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 md:py-2.5 rounded-md text-sm font-mono transition-colors",
              activeTab === 'calculator' ? "bg-emerald-900/50 text-emerald-400 border border-emerald-800/50" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent"
            )}
          >
            <Calculator className="w-5 h-5 md:w-4 md:h-4" />
            Cálculo de Arbitragem
          </button>
          <button
            onClick={() => handleTabChange('ai')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 md:py-2.5 rounded-md text-sm font-mono transition-colors",
              activeTab === 'ai' ? "bg-emerald-900/50 text-emerald-400 border border-emerald-800/50" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent"
            )}
          >
            <BrainCircuit className="w-5 h-5 md:w-4 md:h-4" />
            Modelagem IA
          </button>
          <button
            onClick={() => handleTabChange('bankroll')}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 md:py-2.5 rounded-md text-sm font-mono transition-colors",
              activeTab === 'bankroll' ? "bg-emerald-900/50 text-emerald-400 border border-emerald-800/50" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent"
            )}
          >
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 md:w-4 md:h-4" />
              Gestão de Banca
            </div>
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="bg-zinc-900 rounded-md p-3 flex items-start gap-3 border border-zinc-800">
            <AlertTriangle className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
            <p className="text-[10px] font-mono text-zinc-500 leading-relaxed uppercase">
              Aviso de Risco: O modelo estatístico não garante ganhos. Risco de liquidez e limitação de contas aplicável.
            </p>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-zinc-100 pt-16 md:pt-0 w-full">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'radar' && <RadarTab />}
          {activeTab === 'leverage' && <LeverageTab />}
          {activeTab === 'mentor' && <BetMentorTab />}
          {activeTab === 'tickets' && <TicketsTab />}
          {activeTab === 'calculator' && <CalculatorTab />}
          {activeTab === 'ai' && <AiAnalysisTab />}
          {activeTab === 'bankroll' && <BankrollTab />}
        </div>
      </main>
    </div>
  );
}
