import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Activity, Database, Percent, TrendingUp, RefreshCcw, Cpu, Search, Filter, Loader2, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { fetchMarketData, searchTeamMarkets, getFallbackData, Opportunity } from '@/services/marketData';
import { toast } from 'sonner';

export default function DashboardTab() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(getFallbackData().opportunities);
  const [isLive, setIsLive] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSyncing, setIsSyncing] = useState(true);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [minRoi, setMinRoi] = useState<number>(0);
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState<number>(5);

  const loadData = async (force = false) => {
    setIsSyncing(true);
    try {
      const data = await fetchMarketData(force);
      setOpportunities(data.opportunities);
      setVisibleCount(5); // Reset visible count on new data
      if (force) toast.success('Dados sincronizados com sucesso!');
    } catch (error) {
      toast.error('Erro ao sincronizar dados. Usando cache local.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Fetch real data in background
  useEffect(() => {
    loadData();
  }, []);

  // Clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time market simulation
  useEffect(() => {
    if (!isLive || opportunities.length === 0) return;

    const interval = setInterval(() => {
      setOpportunities(current => 
        current.map(opp => {
          // Simulate micro-fluctuations in odds and ROI
          const fluctuation = (Math.random() - 0.5) * 0.04;
          // Clamp ROI between 0.1 and 15
          const newRoi = Math.min(Math.max(0.1, opp.roi + fluctuation), 15);
          // Clamp EV between 0.1 and 20
          const newEv = Math.min(Math.max(0.1, opp.expectedValue + fluctuation), 20);
          
          return {
            ...opp,
            roi: newRoi,
            expectedValue: opp.type === 'Surebet' ? newRoi : newEv,
            lastUpdated: new Date(),
            bets: opp.bets.map(bet => ({
              ...bet,
              // Clamp odds between 1.01 and 50
              odds: Math.min(Math.max(1.01, bet.odds + (Math.random() - 0.5) * 0.02), 50)
            }))
          };
        })
      );
    }, 3000); // Updates every 3 seconds

    return () => clearInterval(interval);
  }, [isLive, opportunities.length]);

  const handleDeepSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsSearchingOnline(true);
    toast.loading(`Buscando jogos reais de "${searchTerm}"...`, { id: 'search' });
    
    try {
      const newOpps = await searchTeamMarkets(searchTerm);
      if (newOpps.length > 0) {
        // Prepend new opportunities and remove duplicates by ID
        setOpportunities(current => {
          const combined = [...newOpps, ...current];
          const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
          return unique;
        });
        toast.success(`${newOpps.length} oportunidades encontradas para "${searchTerm}"!`, { id: 'search' });
      } else {
        toast.error(`Nenhum jogo próximo encontrado para "${searchTerm}".`, { id: 'search' });
      }
    } catch (error) {
      toast.error(`Erro ao buscar dados para "${searchTerm}".`, { id: 'search' });
    } finally {
      setIsSearchingOnline(false);
    }
  };

  const filteredOpportunities = opportunities
    .filter(opp => 
      opp.match.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.league.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.sport.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.bets.some(b => b.outcome.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .filter(opp => opp.roi >= minRoi)
    .filter(opp => selectedSport === 'all' || opp.sport.toLowerCase() === selectedSport.toLowerCase())
    .sort((a, b) => b.aiConfidence - a.aiConfidence); // Sort by highest confidence first

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 font-sans"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-200 pb-4 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Database className="w-5 h-5 md:w-6 md:h-6 text-zinc-700" />
            Terminal Analítico
          </h2>
          <p className="text-xs md:text-sm text-zinc-500 mt-1 font-mono">
            Monitoramento algorítmico de discrepâncias de mercado.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between md:justify-end gap-2 md:gap-4 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-mono bg-zinc-100 px-2 py-1.5 rounded border border-zinc-200 text-zinc-600">
            {currentTime.toLocaleDateString('pt-BR')} {currentTime.toLocaleTimeString('pt-BR')}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button 
              variant="outline"
              size="sm" 
              onClick={() => loadData(true)}
              disabled={isSyncing}
              className="font-mono text-[10px] md:text-xs h-8 px-2 md:px-3 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
            >
              {isSyncing ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin text-emerald-600" /> : <RefreshCcw className="w-3 h-3 mr-1.5" />}
              <span className="hidden sm:inline">Sincronizar</span>
              <span className="sm:hidden">Sync</span>
            </Button>
            <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-mono bg-zinc-100 px-2 py-1.5 rounded border border-zinc-200">
              {isSyncing ? <Loader2 className="w-3 h-3 md:w-4 md:h-4 text-emerald-600 animate-spin" /> : <Cpu className="w-3 h-3 md:w-4 md:h-4 text-emerald-600" />}
              <span className="hidden sm:inline">{isSyncing ? 'Sincronizando...' : 'Modelo IA: v2.4.1'}</span>
              <span className="sm:hidden">{isSyncing ? 'Sync...' : 'v2.4.1'}</span>
            </div>
            <Button 
              variant={isLive ? "default" : "outline"}
              size="sm" 
              onClick={() => setIsLive(!isLive)}
              className={`font-mono text-[10px] md:text-xs h-8 px-2 md:px-3 flex-1 sm:flex-none ${isLive ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
            >
              <Activity className={`w-3 h-3 mr-1.5 ${isLive ? 'animate-pulse' : ''}`} />
              {isLive ? 'FEED ATIVO' : 'PAUSADO'}
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-lg border border-zinc-200 shadow-sm">
        <div className="relative flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input 
              placeholder="Pesquisar time, liga ou esporte..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 font-mono text-sm bg-zinc-50 border-zinc-200 focus-visible:ring-emerald-500"
            />
          </div>
          <Button 
            onClick={handleDeepSearch}
            disabled={isSearchingOnline || !searchTerm.trim()}
            className="bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-xs whitespace-nowrap"
          >
            {isSearchingOnline ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Globe className="w-4 h-4 mr-2" />
            )}
            <span className="hidden sm:inline">Buscar nas Casas</span>
            <span className="sm:hidden">Buscar</span>
          </Button>
        </div>
        <Button 
          variant={showFilters ? "default" : "outline"} 
          onClick={() => setShowFilters(!showFilters)}
          className={`font-mono text-xs border-zinc-200 ${showFilters ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-50'}`}
        >
          <Filter className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Filtros Avançados</span>
          <span className="sm:hidden">Filtros</span>
        </Button>
      </div>

      {showFilters && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
        >
          <div>
            <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2 block">Esporte</label>
            <select 
              className="w-full h-9 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
            >
              <option value="all">Todos os Esportes</option>
              <option value="futebol">Futebol</option>
              <option value="basquete">Basquete</option>
              <option value="tênis">Tênis</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2 block">ROI Mínimo (%)</label>
            <Input 
              type="number" 
              min="0"
              step="0.5"
              value={minRoi}
              onChange={(e) => setMinRoi(Number(e.target.value))}
              className="h-9 font-mono text-sm bg-zinc-50 border-zinc-200 focus-visible:ring-emerald-500"
            />
          </div>
          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={() => { setMinRoi(0); setSelectedSport('all'); }}
              className="w-full h-9 font-mono text-xs text-zinc-600 border-zinc-200 hover:bg-zinc-50"
            >
              Limpar Filtros
            </Button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <Card className="bg-zinc-900 text-zinc-50 border-zinc-800">
          <CardContent className="p-3 md:p-5">
            <p className="text-[10px] md:text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1 truncate">Mercados</p>
            <p className="text-lg md:text-2xl font-mono font-bold">14,203</p>
            <div className="mt-1 md:mt-2 text-[10px] md:text-xs text-emerald-400 flex items-center gap-1">
              <Activity className="w-3 h-3" /> +124/min
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-zinc-200">
          <CardContent className="p-3 md:p-5">
            <p className="text-[10px] md:text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1 truncate">EV+ Ativos</p>
            <p className="text-lg md:text-2xl font-mono font-bold text-zinc-900">{filteredOpportunities.length}</p>
            <div className="mt-1 md:mt-2 text-[10px] md:text-xs text-zinc-500 flex items-center gap-1 truncate">
              Confiança &gt; 85%
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-zinc-200">
          <CardContent className="p-3 md:p-5">
            <p className="text-[10px] md:text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1 truncate">ROI Médio</p>
            <p className="text-lg md:text-2xl font-mono font-bold text-emerald-600">2.10%</p>
            <div className="mt-1 md:mt-2 text-[10px] md:text-xs text-zinc-500 flex items-center gap-1 truncate">
              <TrendingUp className="w-3 h-3" /> Risco Zero
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-zinc-200">
          <CardContent className="p-3 md:p-5">
            <p className="text-[10px] md:text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1 truncate">Precisão IA</p>
            <p className="text-lg md:text-2xl font-mono font-bold text-blue-600">94.2%</p>
            <div className="mt-1 md:mt-2 text-[10px] md:text-xs text-zinc-500 flex items-center gap-1 truncate">
              <Percent className="w-3 h-3" /> 30 dias
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {filteredOpportunities.length === 0 ? (
          <div className="text-center py-12 bg-white border border-zinc-200 rounded-lg">
            <Search className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500 font-mono text-sm">Nenhuma oportunidade encontrada para "{searchTerm}".</p>
          </div>
        ) : (
          filteredOpportunities.slice(0, visibleCount).map((opp) => (
            <div key={opp.id} className="bg-white border border-zinc-200 rounded-lg overflow-hidden flex flex-col lg:flex-row text-sm transition-all hover:border-zinc-300 shadow-sm">
              {/* Left Column: Match Info & Stats */}
              <div className="p-4 lg:w-1/3 border-b lg:border-b-0 lg:border-r border-zinc-200 bg-zinc-50/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] md:text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">{opp.league} • {opp.time}</span>
                    <span className={`text-[10px] md:text-xs font-mono font-bold px-2 py-0.5 rounded ${opp.type === 'Surebet' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                      {opp.type}
                    </span>
                  </div>
                  <h3 className="font-bold text-zinc-900 text-base md:text-lg mb-4 leading-tight">{opp.match}</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 mt-2 pt-4 border-t border-zinc-200">
                  <div>
                    <p className="text-[9px] md:text-[10px] font-mono text-zinc-500 uppercase">Confiança IA</p>
                    <p className="font-mono font-semibold text-zinc-900 text-xs md:text-sm">{opp.aiConfidence.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] md:text-[10px] font-mono text-zinc-500 uppercase">Prob. Real</p>
                    <p className="font-mono font-semibold text-zinc-900 text-xs md:text-sm">{opp.trueProbability.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] md:text-[10px] font-mono text-zinc-500 uppercase">Expected Value</p>
                    <p className="font-mono font-semibold text-emerald-600 text-xs md:text-sm">+{opp.expectedValue.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] md:text-[10px] font-mono text-zinc-500 uppercase">Atualização</p>
                    <p className="font-mono font-semibold text-zinc-900 text-xs md:text-sm">{opp.lastUpdated.toLocaleTimeString([], { hour12: false, second: '2-digit' })}</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Odds Data Grid */}
              <div className="p-0 lg:w-2/3 flex flex-col bg-white">
                {/* Desktop Grid Header */}
                <div className="hidden sm:grid grid-cols-12 bg-zinc-100 border-b border-zinc-200 p-2 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                  <div className="col-span-5">Mercado / Seleção</div>
                  <div className="col-span-3 text-right">Casa de Aposta</div>
                  <div className="col-span-2 text-right">Odd Atual</div>
                  <div className="col-span-2 text-right">Prob. Implícita</div>
                </div>
                
                <div className="flex-1 p-2 space-y-2 sm:space-y-1">
                  {opp.bets.map((bet, idx) => (
                    <div key={idx} className="flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center p-2.5 sm:p-2 hover:bg-zinc-50 rounded border border-zinc-100 sm:border-transparent gap-1 sm:gap-0">
                      {/* Mobile: Selection name */}
                      <div className="col-span-5 font-medium text-zinc-800 text-sm sm:text-xs w-full truncate pr-2" title={bet.outcome}>
                        {bet.outcome}
                      </div>
                      
                      {/* Mobile: Data row */}
                      <div className="flex justify-between w-full sm:contents mt-1 sm:mt-0">
                        <div className="col-span-3 text-left sm:text-right text-zinc-600 text-[11px] sm:text-xs flex items-center">
                          <span className="sm:hidden text-zinc-400 mr-1">Casa:</span>
                          {bet.bookmaker}
                        </div>
                        <div className="col-span-2 text-right font-mono font-bold text-zinc-900 text-sm sm:text-xs flex items-center">
                          <span className="sm:hidden text-zinc-400 mr-1 text-[10px] font-sans font-normal">Odd:</span>
                          {bet.odds.toFixed(3)}
                        </div>
                        <div className="col-span-2 text-right font-mono text-zinc-500 text-xs flex items-center">
                          <span className="sm:hidden text-zinc-400 mr-1 text-[10px] font-sans font-normal">Prob:</span>
                          {(100 / bet.odds).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-zinc-50 border-t border-zinc-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                  <div className="text-[11px] md:text-xs font-mono text-zinc-500 leading-relaxed">
                    <span className="font-bold text-zinc-700 block sm:inline mb-1 sm:mb-0">Ação Recomendada:</span> {opp.type === 'Surebet' ? 'Distribuir stakes proporcionalmente.' : 'Aplicar Critério de Kelly fracionado.'}
                  </div>
                  <Button variant="outline" size="sm" className="h-8 text-[10px] md:text-xs font-mono w-full sm:w-auto">
                    Exportar Dados
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
        
        {visibleCount < filteredOpportunities.length && (
          <div className="flex justify-center pt-4">
            <Button 
              variant="outline" 
              onClick={() => setVisibleCount(prev => prev + 5)}
              className="font-mono text-xs bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            >
              Carregar Mais Oportunidades
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
