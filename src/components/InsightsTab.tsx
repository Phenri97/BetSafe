import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import { BrainCircuit, RefreshCcw, Loader2, TrendingUp, TrendingDown, Minus, Info, CheckCircle2 } from 'lucide-react';
import { fetchMatchInsights, MatchInsight } from '@/services/marketData';
import { toast } from 'sonner';

export default function InsightsTab() {
  const [insights, setInsights] = useState<MatchInsight[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadData = async () => {
    setIsSyncing(true);
    const toastId = toast.loading('Analisando sentimentos e notícias de mercado...');
    try {
      const data = await fetchMatchInsights();
      
      // Client-side filter for strictly future games (Brasilia Time)
      const nowBr = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
      
      const filteredInsights = data.filter(insight => {
        try {
          // Parse date DD/MM/YYYY
          const [day, month, year] = insight.date.split('/').map(Number);
          // Parse time HH:mm
          const [hour, minute] = insight.time.split(':').map(Number);
          
          if (!day || !month || !year || isNaN(hour) || isNaN(minute)) {
            return true; 
          }

          const insightDate = new Date(year, month - 1, day, hour, minute);
          
          // STRICT RULE: Game must be in the future.
          if (nowBr.getTime() > insightDate.getTime()) {
            return false;
          }
          
          return true;
        } catch (e) {
          return true;
        }
      });

      setInsights(filteredInsights);
      toast.success('Insights atualizados com base nas últimas notícias!', { id: toastId });
    } catch (error) {
      toast.error('Erro ao sincronizar insights da IA.', { id: toastId });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'Bullish': return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'Bearish': return <TrendingDown className="w-4 h-4 text-rose-500" />;
      default: return <Minus className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Bullish': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'Bearish': return 'text-rose-600 bg-rose-50 border-rose-100';
      default: return 'text-zinc-600 bg-zinc-50 border-zinc-100';
    }
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
            <BrainCircuit className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
            Insights e Sentimento de Mercado
          </h2>
          <p className="text-xs md:text-sm text-zinc-500 mt-1 font-mono">
            Análise em tempo real de notícias, escalações e volume social.
          </p>
        </div>
        <Button 
          variant="outline"
          size="sm" 
          onClick={loadData}
          disabled={isSyncing}
          className="font-mono text-xs h-8 px-3 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
        >
          {isSyncing ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin text-purple-600" /> : <RefreshCcw className="w-3 h-3 mr-1.5" />}
          Atualizar Insights
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.map((insight) => (
          <Card key={insight.id} className="border-zinc-200 shadow-sm overflow-hidden bg-white hover:border-purple-200 transition-colors">
            <CardHeader className="pb-3 border-b border-zinc-50">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base font-bold text-zinc-900">{insight.match}</CardTitle>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase mt-1">
                    {insight.league} • {insight.date === new Date().toLocaleDateString('pt-BR') ? 'Hoje' : insight.date} {insight.time}
                  </p>
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-mono font-bold uppercase ${getSentimentColor(insight.sentiment)}`}>
                  {getSentimentIcon(insight.sentiment)}
                  {insight.sentiment}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-[10px] font-mono text-zinc-400 uppercase mb-1">Confiança da IA</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full rounded-full" style={{ width: `${insight.confidence}%` }}></div>
                    </div>
                    <span className="text-xs font-mono font-bold text-zinc-700">{insight.confidence}%</span>
                  </div>
                </div>
                <div className="ml-6 text-right">
                  <p className="text-[10px] font-mono text-zinc-400 uppercase mb-1">Market Score</p>
                  <p className="text-xl font-mono font-bold text-zinc-900">{insight.score}/100</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-mono text-zinc-400 uppercase flex items-center gap-1">
                  <Info className="w-3 h-3" /> Fatores Determinantes
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {insight.keyFactors.map((factor, idx) => (
                    <span key={idx} className="text-[10px] font-mono bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded border border-zinc-200">
                      {factor}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                <p className="text-[10px] font-mono text-purple-600 uppercase font-bold mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Predição Sugerida
                </p>
                <p className="text-sm text-purple-900 font-medium leading-relaxed">
                  {insight.prediction}
                </p>
              </div>

              {insight.forumContributors && insight.forumContributors.length > 0 && (
                <div className="pt-2 border-t border-zinc-50">
                  <p className="text-[9px] font-mono text-zinc-400 uppercase mb-1">Especialistas Consultados</p>
                  <div className="flex flex-wrap gap-1">
                    {insight.forumContributors.map((expert, idx) => (
                      <span key={idx} className="text-[8px] font-mono bg-zinc-50 text-zinc-400 px-1 py-0.5 rounded border border-zinc-100">
                        {expert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
