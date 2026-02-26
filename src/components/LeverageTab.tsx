import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'motion/react';
import { Rocket, Target, Calendar, TrendingUp, CheckCircle2, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
import { generateCustomTicket, DailyTicket } from '@/services/marketData';
import { toast } from 'sonner';

interface LeverageStep {
  day: number;
  startBalance: number;
  targetBalance: number;
  requiredProfit: number;
  status: 'pending' | 'completed' | 'failed';
}

export default function LeverageTab() {
  const [initialAmount, setInitialAmount] = useState<number>(100);
  const [targetAmount, setTargetAmount] = useState<number>(1000);
  const [days, setDays] = useState<number>(10);
  const [dailyOdds, setDailyOdds] = useState<number>(1.50);
  
  const [plan, setPlan] = useState<LeverageStep[]>([]);
  const [currentDay, setCurrentDay] = useState<number>(1);
  
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [suggestedTicket, setSuggestedTicket] = useState<DailyTicket | null>(null);

  // Load bankroll if available
  useEffect(() => {
    const savedBankroll = localStorage.getItem('betsafe_history');
    if (savedBankroll) {
      try {
        const history = JSON.parse(savedBankroll);
        if (history.length > 0) {
          const currentBal = history[history.length - 1].balanceAfter;
          // Optionally suggest using 10% of current bankroll for leverage
          setInitialAmount(Math.floor(currentBal * 0.1));
        }
      } catch (e) {}
    }
  }, []);

  const generatePlan = () => {
    if (initialAmount <= 0 || targetAmount <= initialAmount || days <= 0) {
      toast.error('Parâmetros inválidos para alavancagem.');
      return;
    }

    // Calculate required daily multiplier
    const multiplier = Math.pow(targetAmount / initialAmount, 1 / days);
    // Required odds if betting the entire daily balance (All-in compound)
    // Or we can calculate based on fixed odds.
    
    // Let's build the step-by-step
    let current = initialAmount;
    const newPlan: LeverageStep[] = [];
    
    for (let i = 1; i <= days; i++) {
      const next = current * multiplier;
      newPlan.push({
        day: i,
        startBalance: current,
        targetBalance: next,
        requiredProfit: next - current,
        status: i < currentDay ? 'completed' : i === currentDay ? 'pending' : 'pending'
      });
      current = next;
    }
    
    setPlan(newPlan);
    setDailyOdds(multiplier);
    toast.success('Plano de alavancagem gerado!');
  };

  const getTodaySuggestion = async () => {
    if (plan.length === 0) return;
    const todayStep = plan[currentDay - 1];
    if (!todayStep) return;

    setLoadingTicket(true);
    toast.loading(`Buscando aposta para o Dia ${currentDay}...`, { id: 'leverage' });
    
    try {
      // We need a ticket that turns startBalance into targetBalance
      const ticket = await generateCustomTicket(todayStep.startBalance, todayStep.targetBalance, 'Baixo');
      if (ticket) {
        setSuggestedTicket(ticket);
        toast.success('Sugestão encontrada!', { id: 'leverage' });
      } else {
        toast.error('Não foi possível encontrar uma aposta segura para esta odd hoje.', { id: 'leverage' });
      }
    } catch (error) {
      toast.error('Erro ao buscar sugestão.', { id: 'leverage' });
    } finally {
      setLoadingTicket(false);
    }
  };

  const markDayCompleted = () => {
    if (currentDay < days) {
      setCurrentDay(prev => prev + 1);
      setSuggestedTicket(null);
      toast.success(`Dia ${currentDay} concluído! Parabéns.`);
      
      // Update plan status
      setPlan(prev => prev.map(step => 
        step.day === currentDay ? { ...step, status: 'completed' } : step
      ));
    } else {
      toast.success('ALAVANCAGEM CONCLUÍDA COM SUCESSO! 🎉');
      setPlan(prev => prev.map(step => 
        step.day === currentDay ? { ...step, status: 'completed' } : step
      ));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 font-sans"
    >
      <div className="border-b border-zinc-200 pb-4">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <Rocket className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
          Projeto de Alavancagem
        </h2>
        <p className="text-xs md:text-sm text-zinc-500 mt-1 font-mono">
          Cálculo de juros compostos para atingir metas financeiras com apostas diárias de baixo risco.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 pb-4">
              <CardTitle className="text-sm font-mono uppercase tracking-wider text-zinc-700 flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                Definir Meta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2 block">Caixa Inicial (R$)</label>
                <Input 
                  type="number" 
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(Number(e.target.value))}
                  className="font-mono text-sm bg-zinc-50 border-zinc-200 focus-visible:ring-purple-500"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2 block">Meta Final (R$)</label>
                <Input 
                  type="number" 
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(Number(e.target.value))}
                  className="font-mono text-sm bg-zinc-50 border-zinc-200 focus-visible:ring-purple-500"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2 block">Prazo (Dias)</label>
                <Input 
                  type="number" 
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="font-mono text-sm bg-zinc-50 border-zinc-200 focus-visible:ring-purple-500"
                />
              </div>
              
              {plan.length > 0 && (
                <div className="p-3 bg-purple-50 rounded-md border border-purple-100 flex justify-between items-center">
                  <span className="text-xs font-mono text-purple-700 uppercase">Odd Diária Necessária:</span>
                  <span className="text-sm font-mono font-bold text-purple-900">@{dailyOdds.toFixed(2)}</span>
                </div>
              )}

              <Button 
                onClick={generatePlan}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-xs uppercase tracking-wider h-10 mt-2"
              >
                Calcular Rota
              </Button>
            </CardContent>
          </Card>

          {plan.length > 0 && (
            <Card className="border-zinc-200 shadow-sm bg-zinc-900 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Progresso</div>
                  <div className="text-xs font-mono text-purple-400 font-bold">Dia {currentDay} de {days}</div>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2.5 mb-6">
                  <div className="bg-purple-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${((currentDay - 1) / days) * 100}%` }}></div>
                </div>
                
                <Button 
                  onClick={getTodaySuggestion}
                  disabled={loadingTicket || currentDay > days}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-mono text-xs uppercase tracking-wider h-10"
                >
                  {loadingTicket ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
                  Gerar Aposta do Dia {currentDay}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {suggestedTicket && (
            <Card className="border-purple-200 shadow-sm overflow-hidden bg-purple-50/30">
              <div className="bg-purple-900 p-4 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold font-sans flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-300" />
                    Missão do Dia {currentDay}
                  </h3>
                  <p className="text-xs text-purple-200 font-mono mt-1">
                    Transformar R$ {plan[currentDay-1].startBalance.toFixed(2)} em R$ {plan[currentDay-1].targetBalance.toFixed(2)}
                  </p>
                </div>
                <div className="text-right bg-purple-800 p-2 rounded-lg border border-purple-700">
                  <p className="text-[10px] text-purple-300 font-mono uppercase tracking-wider mb-0.5">Odd Alvo</p>
                  <p className="text-xl font-mono font-bold text-white">{suggestedTicket.totalOdds.toFixed(2)}</p>
                </div>
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-purple-100">
                  {suggestedTicket.items.map((item, idx) => (
                    <div key={idx} className="p-4 hover:bg-white transition-colors">
                      <div className="flex justify-between items-center gap-4">
                        <div>
                          <p className="font-bold text-sm text-zinc-900">{item.match}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono text-zinc-500">{item.market}</span>
                            <span className="text-[10px] font-mono text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded">
                              {item.selection}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-mono font-bold text-blue-600">{item.odds.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-white border-t border-purple-100 flex justify-end">
                  <Button 
                    onClick={markDayCompleted}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Marcar Dia como Concluído (Green!)
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {plan.length > 0 ? (
            <Card className="border-zinc-200 shadow-sm">
              <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 pb-4">
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-zinc-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-zinc-500" />
                  Cronograma de Alavancagem
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left font-mono">
                    <thead className="text-[10px] text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-200">
                      <tr>
                        <th className="px-4 py-3">Dia</th>
                        <th className="px-4 py-3">Entrada</th>
                        <th className="px-4 py-3">Lucro Req.</th>
                        <th className="px-4 py-3">Meta Dia</th>
                        <th className="px-4 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.map((step) => (
                        <tr 
                          key={step.day} 
                          className={`border-b border-zinc-100 last:border-0 ${
                            step.status === 'completed' ? 'bg-emerald-50/50' : 
                            step.day === currentDay ? 'bg-purple-50/30 border-l-2 border-l-purple-500' : ''
                          }`}
                        >
                          <td className="px-4 py-3 font-bold text-zinc-900">Dia {step.day}</td>
                          <td className="px-4 py-3 text-zinc-600">R$ {step.startBalance.toFixed(2)}</td>
                          <td className="px-4 py-3 text-emerald-600">+R$ {step.requiredProfit.toFixed(2)}</td>
                          <td className="px-4 py-3 font-bold text-zinc-900">R$ {step.targetBalance.toFixed(2)}</td>
                          <td className="px-4 py-3 text-center">
                            {step.status === 'completed' ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600">
                                <CheckCircle2 className="w-4 h-4" />
                              </span>
                            ) : step.day === currentDay ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 animate-pulse">
                                <TrendingUp className="w-4 h-4" />
                              </span>
                            ) : (
                              <span className="text-zinc-300">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-zinc-400 space-y-4 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50 p-6 text-center">
              <Rocket className="w-12 h-12 text-zinc-300" />
              <div>
                <p className="font-mono text-sm text-zinc-600 font-bold mb-1">Nenhum projeto ativo</p>
                <p className="font-mono text-xs text-zinc-500 max-w-sm">
                  Defina seu caixa inicial, sua meta e o prazo em dias. O sistema calculará a rota exata de juros compostos para você.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
