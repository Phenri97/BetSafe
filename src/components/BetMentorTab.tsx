import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wand2, Target, Coins, Loader2, Copy, Check, Ticket, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { generateCustomTicket, DailyTicket } from '@/services/marketData';
import { toast } from 'sonner';

export default function BetMentorTab() {
  const [stake, setStake] = useState<number>(50);
  const [targetWin, setTargetWin] = useState<number>(500);
  const [riskLevel, setRiskLevel] = useState<string>('Médio');
  
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<DailyTicket | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedBankroll = localStorage.getItem('betsafe_history');
    if (savedBankroll) {
      try {
        const history = JSON.parse(savedBankroll);
        if (history.length > 0) {
          const currentBal = history[history.length - 1].balanceAfter;
          // Suggest 5% of bankroll as stake
          setStake(Math.floor(currentBal * 0.05));
          // Suggest 10x return
          setTargetWin(Math.floor(currentBal * 0.05) * 10);
        }
      } catch (e) {}
    }
  }, []);

  const handleGenerate = async () => {
    if (stake <= 0 || targetWin <= stake) {
      toast.error('O valor de retorno deve ser maior que o valor apostado.');
      return;
    }

    setLoading(true);
    setTicket(null);
    toast.loading('A IA está analisando os jogos de hoje para montar seu bilhete...', { id: 'mentor' });

    try {
      const newTicket = await generateCustomTicket(stake, targetWin, riskLevel);
      if (newTicket) {
        setTicket(newTicket);
        toast.success('Bilhete gerado com sucesso!', { id: 'mentor' });
      } else {
        toast.error('Não foi possível encontrar jogos suficientes para essa odd no momento.', { id: 'mentor' });
      }
    } catch (error) {
      toast.error('Erro ao gerar bilhete. Tente novamente.', { id: 'mentor' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!ticket) return;
    const text = `BetSafe_AI | Bet Mentor\nObjetivo: R$ ${targetWin.toFixed(2)} com R$ ${stake.toFixed(2)}\nOdd Total: ${ticket.totalOdds.toFixed(2)}\n\n` + 
      ticket.items.map(item => `- ${item.match} (${item.market})\n  Seleção: ${item.selection} @${item.odds.toFixed(2)}`).join('\n\n');
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Bilhete copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2000);
  };

  const targetOdds = targetWin / stake;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 font-sans"
    >
      <div className="border-b border-zinc-200 pb-4">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <Wand2 className="w-5 h-5 md:w-6 md:h-6 text-zinc-700" />
          Bet Mentor AI
        </h2>
        <p className="text-xs md:text-sm text-zinc-500 mt-1 font-mono">
          Diga quanto quer apostar e quanto quer ganhar. A IA vasculha os jogos reais de hoje e monta a múltipla ideal.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 pb-4">
              <CardTitle className="text-sm font-mono uppercase tracking-wider text-zinc-700 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-600" />
                Parâmetros do Bilhete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2 block">Quanto quer apostar? (R$)</label>
                <div className="relative">
                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input 
                    type="number" 
                    value={stake}
                    onChange={(e) => setStake(Number(e.target.value))}
                    className="pl-9 font-mono text-sm bg-zinc-50 border-zinc-200 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2 block">Quanto quer ganhar? (R$)</label>
                <div className="relative">
                  <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input 
                    type="number" 
                    value={targetWin}
                    onChange={(e) => setTargetWin(Number(e.target.value))}
                    className="pl-9 font-mono text-sm bg-zinc-50 border-zinc-200 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>
              
              <div className="p-3 bg-zinc-100 rounded-md border border-zinc-200 flex justify-between items-center">
                <span className="text-xs font-mono text-zinc-600 uppercase">Odd Necessária:</span>
                <span className="text-sm font-mono font-bold text-zinc-900">{isFinite(targetOdds) && targetOdds > 0 ? targetOdds.toFixed(2) : '0.00'}</span>
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2 block">Nível de Risco</label>
                <select 
                  className="w-full h-10 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value)}
                >
                  <option value="Baixo">Baixo (Favoritos, Menos Seleções)</option>
                  <option value="Médio">Médio (Equilibrado)</option>
                  <option value="Alto">Alto (Zebras, Muitas Seleções)</option>
                </select>
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs uppercase tracking-wider h-10 mt-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...</>
                ) : (
                  <><Wand2 className="w-4 h-4 mr-2" /> Gerar Bilhete Mágico</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {loading ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-zinc-400 space-y-4 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              <p className="font-mono text-sm">A IA está buscando os melhores jogos reais de hoje...</p>
            </div>
          ) : ticket ? (
            <Card className="border-zinc-200 shadow-sm overflow-hidden">
              <div className="bg-zinc-900 p-4 md:p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                      Risco {ticket.riskLevel}
                    </span>
                    <span className="bg-blue-500/20 text-blue-400 text-[10px] font-mono px-2 py-0.5 rounded border border-blue-500/30">
                      EV+ {ticket.expectedValue.toFixed(1)}%
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold font-sans">{ticket.title}</h3>
                  <p className="text-xs text-zinc-400 font-mono mt-1">{ticket.description}</p>
                </div>
                <div className="text-left md:text-right bg-zinc-800 p-3 rounded-lg border border-zinc-700 w-full md:w-auto">
                  <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider mb-1">Odd Total</p>
                  <p className="text-2xl md:text-3xl font-mono font-bold text-emerald-400">{ticket.totalOdds.toFixed(2)}</p>
                </div>
              </div>
              
              <CardContent className="p-0">
                <div className="divide-y divide-zinc-100">
                  {ticket.items.map((item, idx) => (
                    <div key={idx} className="p-4 md:p-6 hover:bg-zinc-50 transition-colors">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded border border-zinc-200">
                              {item.date === new Date().toLocaleDateString('pt-BR') ? 'Hoje' : item.date} {item.time}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                              {item.league}
                            </span>
                          </div>
                          <p className="font-bold text-sm md:text-base text-zinc-900">{item.match}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-zinc-500">Mercado:</span>
                            <span className="text-xs font-mono text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded">
                              {item.market}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 bg-zinc-50 md:bg-transparent p-3 md:p-0 rounded-md border border-zinc-200 md:border-none">
                          <div className="text-left md:text-right">
                            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Seleção</p>
                            <p className="text-sm font-bold text-zinc-900">{item.selection}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Odd</p>
                            <p className="text-lg font-mono font-bold text-blue-600">{item.odds.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 md:p-6 bg-zinc-50 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>As odds podem sofrer alterações nas casas de apostas.</span>
                  </div>
                  <Button 
                    onClick={handleCopy}
                    variant="outline"
                    className="w-full sm:w-auto font-mono text-xs border-zinc-300 hover:bg-zinc-100"
                  >
                    {copied ? <Check className="w-4 h-4 mr-2 text-emerald-600" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? 'Copiado!' : 'Copiar Bilhete'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-zinc-400 space-y-4 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50 p-6 text-center">
              <Ticket className="w-12 h-12 text-zinc-300" />
              <div>
                <p className="font-mono text-sm text-zinc-600 font-bold mb-1">Nenhum bilhete gerado</p>
                <p className="font-mono text-xs text-zinc-500 max-w-sm">
                  Preencha os parâmetros ao lado e clique em "Gerar Bilhete Mágico" para a IA montar sua múltipla personalizada com os jogos de hoje.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
