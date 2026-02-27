import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import { ShieldCheck, RefreshCcw, Loader2, Zap, ArrowRight, ExternalLink } from 'lucide-react';
import { fetchArbitrageOpportunities, ArbitrageOpp } from '@/services/marketData';
import { toast } from 'sonner';

export default function ArbitrageMonitorTab() {
  const [opportunities, setOpportunities] = useState<ArbitrageOpp[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadData = async () => {
    setIsSyncing(true);
    const toastId = toast.loading('Escaneando discrepâncias de mercado em tempo real...');
    try {
      const data = await fetchArbitrageOpportunities();
      
      // Client-side filter for strictly future games (Brasilia Time)
      const nowBr = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
      
      const filteredOpps = data.filter(opp => {
        try {
          // Parse date DD/MM/YYYY
          const [day, month, year] = opp.date.split('/').map(Number);
          // Parse time HH:mm
          const [hour, minute] = opp.time.split(':').map(Number);
          
          if (!day || !month || !year || isNaN(hour) || isNaN(minute)) {
            return true; 
          }

          const oppDate = new Date(year, month - 1, day, hour, minute);
          
          // STRICT RULE: Game must be in the future.
          if (nowBr.getTime() > oppDate.getTime()) {
            return false;
          }
          
          return true;
        } catch (e) {
          return true;
        }
      });

      setOpportunities(filteredOpps);
      if (filteredOpps.length > 0) {
        toast.success(`${filteredOpps.length} oportunidades de Arbitragem encontradas!`, { id: toastId });
      } else {
        toast.info('Nenhuma arbitragem detectada no momento.', { id: toastId });
      }
    } catch (error) {
      toast.error('Erro ao sincronizar monitor de arbitragem.', { id: toastId });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 font-sans"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-200 pb-4 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
            Monitor de Arbitragem (Surebets)
          </h2>
          <p className="text-xs md:text-sm text-zinc-500 mt-1 font-mono">
            Detecção automática de lucro garantido através de discrepâncias entre casas.
          </p>
        </div>
        <Button 
          variant="outline"
          size="sm" 
          onClick={loadData}
          disabled={isSyncing}
          className="font-mono text-xs h-8 px-3 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
        >
          {isSyncing ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin text-emerald-600" /> : <RefreshCcw className="w-3 h-3 mr-1.5" />}
          Escanear Agora
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {opportunities.length === 0 && !isSyncing ? (
          <div className="h-64 flex flex-col items-center justify-center text-zinc-400 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
            <Zap className="w-12 h-12 mb-4 text-zinc-300" />
            <p className="font-mono text-sm">Aguardando detecção de oportunidades...</p>
          </div>
        ) : (
          opportunities.map((opp) => (
            <Card key={opp.id} className="border-emerald-200 shadow-sm overflow-hidden bg-white hover:border-emerald-400 transition-colors">
              <div className="bg-emerald-50 p-4 border-b border-emerald-100 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                    {opp.match}
                    <span className="text-[10px] font-mono bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded">
                      {opp.league}
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono mt-1">
                    {opp.date === new Date().toLocaleDateString('pt-BR') ? 'Hoje' : opp.date} {opp.time}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-emerald-600 font-mono uppercase tracking-wider font-bold">Lucro Garantido</p>
                  <p className="text-2xl font-mono font-bold text-emerald-600">+{opp.roi.toFixed(2)}%</p>
                </div>
              </div>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-100">
                  {opp.bets.map((bet, idx) => (
                    <div key={idx} className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-mono text-zinc-400 uppercase">Seleção</p>
                          <p className="font-bold text-zinc-900">{bet.outcome}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-mono text-zinc-400 uppercase">Odd</p>
                          <p className="font-mono font-bold text-blue-600 text-lg">{bet.odds.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center bg-zinc-50 p-2 rounded border border-zinc-100">
                        <span className="text-xs font-mono text-zinc-600">{bet.bookmaker}</span>
                        <span className="text-xs font-mono font-bold text-zinc-900">Stake: R$ {bet.stake.toFixed(2)}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="w-full h-7 text-[10px] font-mono text-zinc-500 hover:text-zinc-900">
                        Ir para Casa <ExternalLink className="w-3 h-3 ml-1.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </motion.div>
  );
}
