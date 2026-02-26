import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import { Radar, Flame, TrendingDown, AlertCircle, RefreshCcw, Loader2, ArrowRight } from 'lucide-react';
import { fetchMarketTrends, TrendAlert } from '@/services/marketData';
import { toast } from 'sonner';

const fallbackTrends: TrendAlert[] = [
  {
    id: "t1",
    match: "Flamengo x Fluminense",
    league: "Campeonato Carioca",
    time: "Hoje, 21:30",
    market: "Ambas Marcam",
    selection: "Sim",
    oldOdds: 2.15,
    newOdds: 1.75,
    dropPercentage: 18.6,
    reason: "Volume anormal de apostas (Smart Money)",
    heatLevel: 5
  },
  {
    id: "t2",
    match: "Golden State Warriors x LA Lakers",
    league: "NBA",
    time: "Hoje, 23:00",
    market: "Handicap",
    selection: "Lakers +5.5",
    oldOdds: 1.90,
    newOdds: 1.65,
    dropPercentage: 13.1,
    reason: "Stephen Curry confirmado fora (Lesão)",
    heatLevel: 4
  },
  {
    id: "t3",
    match: "Palmeiras x São Paulo",
    league: "Campeonato Paulista",
    time: "Amanhã, 16:00",
    market: "Gols Totais",
    selection: "Menos de 2.5",
    oldOdds: 1.85,
    newOdds: 1.55,
    dropPercentage: 16.2,
    reason: "Previsão de chuva forte no horário do jogo",
    heatLevel: 3
  }
];

export default function RadarTab() {
  const [trends, setTrends] = useState<TrendAlert[]>(fallbackTrends);
  const [isSyncing, setIsSyncing] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number>(5);
  const [minHeat, setMinHeat] = useState<number>(0);
  const [trendType, setTrendType] = useState<string>('all');

  const loadTrends = async () => {
    setIsSyncing(true);
    toast.loading('O Radar está varrendo as casas de apostas em busca de Dropping Odds...', { id: 'radar' });
    try {
      const data = await fetchMarketTrends(true); // Force refresh
      if (data && data.length > 0) {
        setTrends(data);
        setVisibleCount(5); // Reset pagination
        toast.success('Radar atualizado com as últimas tendências do mercado!', { id: 'radar' });
      } else {
        toast.error('Nenhuma tendência forte encontrada no momento. Mantendo dados anteriores.', { id: 'radar' });
      }
    } catch (error) {
      toast.error('Erro ao conectar com o Radar. Verifique sua conexão.', { id: 'radar' });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Initial silent load
    fetchMarketTrends().then(data => {
      if (data && data.length > 0) setTrends(data);
    });
  }, []);

  const filteredTrends = trends
    .filter(t => t.heatLevel >= minHeat)
    .filter(t => trendType === 'all' || t.type === trendType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 font-sans"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-200 pb-4 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Radar className="w-5 h-5 md:w-6 md:h-6 text-rose-600" />
            Radar de Tendências
          </h2>
          <p className="text-xs md:text-sm text-zinc-500 mt-1 font-mono">
            Monitoramento de "Dropping Odds" e "Smart Money" em tempo real.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-zinc-200">
            <span className="text-xs font-mono text-zinc-500 uppercase">Tipo:</span>
            <select 
              className="text-xs font-mono bg-transparent outline-none text-zinc-900 font-bold"
              value={trendType}
              onChange={(e) => setTrendType(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="Dropping Odds">Dropping Odds</option>
              <option value="Smart Money">Smart Money</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-zinc-200">
            <span className="text-xs font-mono text-zinc-500 uppercase">Heat Mín:</span>
            <select 
              className="text-xs font-mono bg-transparent outline-none text-zinc-900 font-bold"
              value={minHeat}
              onChange={(e) => setMinHeat(Number(e.target.value))}
            >
              <option value="0">Todos</option>
              <option value="3">🔥 3+</option>
              <option value="4">🔥🔥 4+</option>
              <option value="5">🔥🔥🔥 5</option>
            </select>
          </div>
          <Button 
            variant="outline"
            size="sm" 
            onClick={loadTrends}
            disabled={isSyncing}
            className="font-mono text-xs h-8 px-3 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
          >
            {isSyncing ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin text-rose-600" /> : <RefreshCcw className="w-3 h-3 mr-1.5" />}
            Escanear Mercado
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-rose-50 border-rose-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-md">
              <TrendingDown className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-rose-600/80 uppercase tracking-wider font-bold">Dropping Odds</p>
              <p className="text-xs text-rose-900 mt-0.5">Quedas bruscas indicam onde o dinheiro profissional está entrando.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-md">
              <Flame className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-amber-600/80 uppercase tracking-wider font-bold">Heat Level</p>
              <p className="text-xs text-amber-900 mt-0.5">Quanto mais chamas, maior a confiança e o volume de apostas.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-md">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-blue-600/80 uppercase tracking-wider font-bold">Informação</p>
              <p className="text-xs text-blue-900 mt-0.5">Lesões, clima ou notícias de última hora que afetam as linhas.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {filteredTrends.length === 0 ? (
          <div className="text-center py-12 bg-white border border-zinc-200 rounded-lg">
            <Radar className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500 font-mono text-sm">Nenhuma tendência encontrada com este filtro.</p>
          </div>
        ) : (
          filteredTrends.slice(0, visibleCount).map((trend) => (
            <Card key={trend.id} className="border-zinc-200 shadow-sm overflow-hidden hover:border-rose-300 transition-colors">
            <div className="flex flex-col md:flex-row">
              {/* Left Side: Match Info */}
              <div className="flex-1 p-4 md:p-6 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-mono bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded border border-zinc-200">
                    {trend.time}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                    {trend.league}
                  </span>
                  <div className="ml-auto flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Flame 
                        key={i} 
                        className={`w-3.5 h-3.5 ${i < trend.heatLevel ? 'text-rose-500 fill-rose-500' : 'text-zinc-200'}`} 
                      />
                    ))}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mb-1">{trend.match}</h3>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-zinc-500 font-mono text-xs">Mercado:</span>
                  <span className="font-medium text-zinc-800">{trend.market}</span>
                  <span className="text-zinc-300">|</span>
                  <span className="text-zinc-500 font-mono text-xs">Seleção:</span>
                  <span className="font-bold text-zinc-900">{trend.selection}</span>
                </div>
                <div className="mt-4 inline-flex items-center gap-2 bg-rose-50 text-rose-700 text-xs px-2.5 py-1.5 rounded-md border border-rose-100 font-mono">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {trend.reason}
                </div>
              </div>

              {/* Right Side: Odds Movement */}
              <div className="w-full md:w-64 bg-zinc-50 p-4 md:p-6 border-t md:border-t-0 md:border-l border-zinc-200 flex flex-col justify-center items-center md:items-end text-center md:text-right">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">Movimento da Odd</p>
                <div className="flex items-center justify-center md:justify-end gap-3 w-full">
                  <div className="text-center">
                    <p className="text-xs text-zinc-400 font-mono line-through mb-1">Abertura</p>
                    <p className="text-xl font-mono text-zinc-400 line-through decoration-rose-500/50">{trend.oldOdds.toFixed(2)}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-zinc-300" />
                  <div className="text-center">
                    <p className="text-xs text-emerald-600 font-mono font-bold mb-1">Atual</p>
                    <p className="text-3xl font-mono font-bold text-emerald-600">{trend.newOdds.toFixed(2)}</p>
                  </div>
                </div>
                <div className="mt-3 text-xs font-mono text-rose-600 bg-rose-100/50 px-2 py-1 rounded border border-rose-200/50 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" />
                  Queda de {trend.dropPercentage.toFixed(1)}%
                </div>
              </div>
            </div>
          </Card>
          ))
        )}
        
        {visibleCount < filteredTrends.length && (
          <div className="flex justify-center pt-4">
            <Button 
              variant="outline" 
              onClick={() => setVisibleCount(prev => prev + 5)}
              className="font-mono text-xs bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            >
              Carregar Mais Tendências
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
