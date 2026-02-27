import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ticket, Calendar, TrendingUp, CheckCircle2, AlertTriangle, Copy, Check, Loader2, RefreshCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { fetchMarketData, getFallbackData, DailyTicket } from '@/services/marketData';
import { toast } from 'sonner';

export default function TicketsTab() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tickets, setTickets] = useState<DailyTicket[]>(getFallbackData().tickets);
  const [isSyncing, setIsSyncing] = useState(true);

  const loadData = async (force = false) => {
    setIsSyncing(true);
    const toastId = force ? toast.loading('Gerando bilhetes otimizados com o Fórum de Especialistas...') : undefined;
    try {
      const data = await fetchMarketData(force);
      
      // Client-side filter for strictly future games (Brasilia Time)
      const nowBr = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
      
      const filteredTickets = data.tickets.filter(ticket => {
        // A ticket is valid if ALL its items are in the future
        return ticket.items.every(item => {
          try {
            // Parse date DD/MM/YYYY
            const [day, month, year] = item.date.split('/').map(Number);
            // Parse time HH:mm
            const [hour, minute] = item.time.split(':').map(Number);
            
            if (!day || !month || !year || isNaN(hour) || isNaN(minute)) {
              return true; 
            }

            const itemDate = new Date(year, month - 1, day, hour, minute);
            
            // STRICT RULE: Game must be in the future.
            if (nowBr.getTime() > itemDate.getTime()) {
              return false;
            }
            
            return true;
          } catch (e) {
            return true;
          }
        });
      });

      setTickets(filteredTickets);
      if (force) toast.success('Bilhetes atualizados com sucesso!', { id: toastId });
    } catch (error) {
      if (force) toast.error('Erro ao atualizar bilhetes.', { id: toastId });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const handleCopy = (ticket: DailyTicket) => {
    const text = `BetSafe_AI | ${ticket.title}\nOdd Total: ${ticket.totalOdds.toFixed(2)}\n\n` + 
      ticket.items.map(item => `- ${item.match} (${item.market})\n  Seleção: ${item.selection} @${item.odds.toFixed(2)}`).join('\n\n');
    
    navigator.clipboard.writeText(text);
    setCopiedId(ticket.id);
    toast.success('Bilhete copiado para a área de transferência!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 font-sans"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-200 pb-4 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Ticket className="w-5 h-5 md:w-6 md:h-6 text-zinc-700" />
            Bilhetes do Dia
          </h2>
          <p className="text-xs md:text-sm text-zinc-500 mt-1 font-mono">
            Sugestões de múltiplas geradas pela IA com base no maior EV+ diário.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            size="sm" 
            onClick={() => loadData(true)}
            disabled={isSyncing}
            className="font-mono text-[10px] md:text-xs h-8 px-2 md:px-3 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
          >
            {isSyncing ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin text-emerald-600" /> : <RefreshCcw className="w-3 h-3 mr-1.5" />}
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
          <div className="flex items-center gap-2 text-xs font-mono bg-zinc-100 px-3 py-2 rounded border border-zinc-200 w-max">
            {isSyncing ? <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" /> : <Calendar className="w-4 h-4 text-emerald-600" />}
            <span>{isSyncing ? 'Sincronizando...' : `${currentTime.toLocaleDateString('pt-BR')} - ${currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tickets.map((ticket) => (
          <Card key={ticket.id} className="border-zinc-200 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-zinc-900 p-4 border-b border-zinc-800 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {ticket.id}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    ticket.riskLevel === 'Baixo' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800/50' : 
                    ticket.riskLevel === 'Médio' ? 'bg-blue-900/50 text-blue-400 border border-blue-800/50' : 
                    'bg-orange-900/50 text-orange-400 border border-orange-800/50'
                  }`}>
                    Risco {ticket.riskLevel}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-zinc-100">{ticket.title}</h3>
                <p className="text-xs text-zinc-400 font-mono mt-1">{ticket.description}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-mono text-zinc-500 uppercase">Odd Total</p>
                <p className="text-2xl font-mono font-bold text-emerald-400">{ticket.totalOdds.toFixed(2)}</p>
              </div>
            </div>

            <CardContent className="p-0 flex-1 flex flex-col">
              <div className="flex-1 divide-y divide-zinc-100">
                {ticket.items.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-zinc-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                          {item.league} • {item.date === new Date().toLocaleDateString('pt-BR') ? 'Hoje' : item.date} {item.time}
                        </span>
                        <h4 className="font-bold text-zinc-900 text-sm mt-0.5">{item.match}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase block">Confiança</span>
                        <span className="text-xs font-mono font-bold text-blue-600">{item.aiConfidence.toFixed(1)}%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-3 bg-zinc-100 p-2 rounded border border-zinc-200">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">{item.market}</span>
                        <span className="font-medium text-zinc-800 text-sm">{item.selection}</span>
                      </div>
                      <span className="font-mono font-bold text-zinc-900 text-base">@{item.odds.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-zinc-50 border-t border-zinc-200 mt-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-600">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>EV+ Projetado: <strong className="text-emerald-700">+{ticket.expectedValue.toFixed(1)}%</strong></span>
                  </div>
                </div>
                <Button 
                  onClick={() => handleCopy(ticket)}
                  className="w-full font-mono text-xs uppercase tracking-wider bg-zinc-900 hover:bg-zinc-800 text-white"
                >
                  {copiedId === ticket.id ? (
                    <><Check className="w-4 h-4 mr-2" /> Copiado para a área de transferência</>
                  ) : (
                    <><Copy className="w-4 h-4 mr-2" /> Copiar Bilhete</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
