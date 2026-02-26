import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'motion/react';
import { Wallet, TrendingUp, TrendingDown, Target, Activity, DollarSign, Percent, Plus, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { toast } from 'sonner';

interface BetRecord {
  id: string;
  date: string;
  amount: number;
  odds: number;
  status: 'win' | 'loss' | 'refund';
  profit: number;
  balanceAfter: number;
}

export default function BankrollTab() {
  const [initialBankroll, setInitialBankroll] = useState(1000);
  const [kellyFraction, setKellyFraction] = useState(0.25);
  const [history, setHistory] = useState<BetRecord[]>([]);
  
  // New bet form state
  const [newBetAmount, setNewBetAmount] = useState('');
  const [newBetOdds, setNewBetOdds] = useState('');
  const [newBetStatus, setNewBetStatus] = useState<'win' | 'loss' | 'refund'>('win');

  // Load from local storage on mount
  useEffect(() => {
    const savedInitial = localStorage.getItem('betsafe_initial_bankroll');
    const savedKelly = localStorage.getItem('betsafe_kelly');
    const savedHistory = localStorage.getItem('betsafe_history');

    if (savedInitial) setInitialBankroll(Number(savedInitial));
    if (savedKelly) setKellyFraction(Number(savedKelly));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  // Save settings
  const handleSaveSettings = () => {
    localStorage.setItem('betsafe_initial_bankroll', initialBankroll.toString());
    localStorage.setItem('betsafe_kelly', kellyFraction.toString());
    
    // If history is empty, we just set the initial bankroll.
    // If there is history, changing initial bankroll requires recalculating all balances.
    if (history.length > 0) {
      let currentBal = initialBankroll;
      const updatedHistory = history.map(bet => {
        currentBal += bet.profit;
        return { ...bet, balanceAfter: currentBal };
      });
      setHistory(updatedHistory);
      localStorage.setItem('betsafe_history', JSON.stringify(updatedHistory));
    }
    
    toast.success('Configurações salvas com sucesso!');
  };

  const currentBankroll = history.length > 0 
    ? history[history.length - 1].balanceAfter 
    : initialBankroll;

  const profit = currentBankroll - initialBankroll;
  const roi = (profit / initialBankroll) * 100;
  const unitSize = currentBankroll * 0.01;

  const handleAddBet = () => {
    const amount = Number(newBetAmount);
    const odds = Number(newBetOdds);

    if (!amount || amount <= 0 || !odds || odds <= 1) {
      toast.error('Preencha os valores de Stake e Odd corretamente.');
      return;
    }

    let betProfit = 0;
    if (newBetStatus === 'win') {
      betProfit = amount * (odds - 1);
    } else if (newBetStatus === 'loss') {
      betProfit = -amount;
    } else {
      betProfit = 0; // refund
    }

    const newBalance = currentBankroll + betProfit;

    const newBet: BetRecord = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      amount,
      odds,
      status: newBetStatus,
      profit: betProfit,
      balanceAfter: newBalance
    };

    const updatedHistory = [...history, newBet];
    setHistory(updatedHistory);
    localStorage.setItem('betsafe_history', JSON.stringify(updatedHistory));
    
    setNewBetAmount('');
    setNewBetOdds('');
    toast.success('Aposta registrada com sucesso!');
  };

  const clearHistory = () => {
    if (confirm('Tem certeza que deseja apagar todo o histórico?')) {
      setHistory([]);
      localStorage.removeItem('betsafe_history');
      toast.success('Histórico apagado.');
    }
  };

  // Prepare chart data
  const chartData = [
    { date: 'Início', value: initialBankroll },
    ...history.map(bet => ({ date: bet.date, value: bet.balanceAfter }))
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 font-sans"
    >
      <div className="border-b border-zinc-200 pb-4">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <Wallet className="w-5 h-5 md:w-6 md:h-6 text-zinc-700" />
          Gestão de Banca
        </h2>
        <p className="text-xs md:text-sm text-zinc-500 mt-1 font-mono">
          Controle de capital real, dimensionamento de stakes e histórico de rentabilidade.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-zinc-200 shadow-sm bg-zinc-900 text-white">
          <CardContent className="p-4 md:p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] md:text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">Banca Atual</p>
                <p className="text-xl md:text-3xl font-mono font-bold">R$ {currentBankroll.toFixed(2)}</p>
              </div>
              <div className="p-2 bg-zinc-800 rounded-md">
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className={`mt-4 text-[10px] md:text-xs font-mono flex items-center gap-1 ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {profit >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} 
              {profit >= 0 ? '+' : ''}R$ {profit.toFixed(2)} (Lucro)
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] md:text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1">ROI Total</p>
                <p className={`text-xl md:text-3xl font-mono font-bold ${roi >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {roi > 0 ? '+' : ''}{roi.toFixed(2)}%
                </p>
              </div>
              <div className={`p-2 rounded-md ${roi >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <Activity className={`w-4 h-4 ${roi >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
              </div>
            </div>
            <div className="mt-4 text-[10px] md:text-xs font-mono text-zinc-500">
              Desde o início (R$ {initialBankroll.toFixed(2)})
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] md:text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1">Unidade (1%)</p>
                <p className="text-xl md:text-3xl font-mono font-bold text-zinc-900">R$ {unitSize.toFixed(2)}</p>
              </div>
              <div className="p-2 bg-zinc-100 rounded-md">
                <Target className="w-4 h-4 text-zinc-600" />
              </div>
            </div>
            <div className="mt-4 text-[10px] md:text-xs font-mono text-zinc-500">
              Stake base recomendada
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] md:text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1">Critério Kelly</p>
                <p className="text-xl md:text-3xl font-mono font-bold text-blue-600">{(kellyFraction * 100).toFixed(0)}%</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-md">
                <Percent className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 text-[10px] md:text-xs font-mono text-zinc-500">
              Fração de segurança
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-zinc-200 shadow-sm">
          <CardHeader className="border-b border-zinc-100 pb-4">
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-zinc-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Evolução do Capital (Equity Curve)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={profit >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={profit >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a', fontFamily: 'monospace' }} dy={10} />
                  <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a', fontFamily: 'monospace' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff', fontFamily: 'monospace', fontSize: '12px' }}
                    itemStyle={{ color: profit >= 0 ? '#10b981' : '#ef4444' }}
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Banca']}
                  />
                  <Area type="stepAfter" dataKey="value" stroke={profit >= 0 ? "#10b981" : "#ef4444"} strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 pb-4">
              <CardTitle className="text-sm font-mono uppercase tracking-wider text-zinc-700 flex items-center gap-2">
                <Plus className="w-4 h-4 text-zinc-600" />
                Registrar Aposta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2 block">Stake (R$)</label>
                  <Input 
                    type="number" 
                    placeholder="Ex: 50"
                    value={newBetAmount}
                    onChange={(e) => setNewBetAmount(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2 block">Odd</label>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="Ex: 1.95"
                    value={newBetOdds}
                    onChange={(e) => setNewBetOdds(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2 block">Resultado</label>
                <div className="flex gap-2">
                  <Button 
                    variant={newBetStatus === 'win' ? 'default' : 'outline'} 
                    className={`flex-1 text-xs font-mono ${newBetStatus === 'win' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                    onClick={() => setNewBetStatus('win')}
                  >
                    Green
                  </Button>
                  <Button 
                    variant={newBetStatus === 'loss' ? 'default' : 'outline'} 
                    className={`flex-1 text-xs font-mono ${newBetStatus === 'loss' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                    onClick={() => setNewBetStatus('loss')}
                  >
                    Red
                  </Button>
                  <Button 
                    variant={newBetStatus === 'refund' ? 'default' : 'outline'} 
                    className={`flex-1 text-xs font-mono ${newBetStatus === 'refund' ? 'bg-zinc-600 hover:bg-zinc-700 text-white' : ''}`}
                    onClick={() => setNewBetStatus('refund')}
                  >
                    Void
                  </Button>
                </div>
              </div>
              <Button onClick={handleAddBet} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-xs uppercase tracking-wider mt-2">
                Adicionar ao Histórico
              </Button>
            </CardContent>
          </Card>

          <Card className="border-zinc-200 shadow-sm">
            <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 pb-4 flex flex-row justify-between items-center">
              <CardTitle className="text-sm font-mono uppercase tracking-wider text-zinc-700 flex items-center gap-2">
                <Target className="w-4 h-4 text-zinc-600" />
                Configurações
              </CardTitle>
              {history.length > 0 && (
                <Button variant="ghost" size="icon" onClick={clearHistory} className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2 block">Banca Inicial (R$)</label>
                <Input 
                  type="number" 
                  value={initialBankroll}
                  onChange={(e) => setInitialBankroll(Number(e.target.value))}
                  className="font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2 block">Fração de Kelly</label>
                <select 
                  className="w-full h-10 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                  value={kellyFraction}
                  onChange={(e) => setKellyFraction(Number(e.target.value))}
                >
                  <option value={1}>Full Kelly (Agressivo)</option>
                  <option value={0.5}>Half Kelly (Moderado)</option>
                  <option value={0.25}>Quarter Kelly (Conservador)</option>
                  <option value={0.1}>1/10 Kelly (Muito Seguro)</option>
                </select>
              </div>
              <Button onClick={handleSaveSettings} className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-300 font-mono text-xs uppercase tracking-wider mt-4">
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
