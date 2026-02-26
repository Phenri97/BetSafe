import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import { Calculator, CheckCircle2, AlertTriangle, ArrowRight, Activity } from 'lucide-react';

export default function CalculatorTab() {
  const [type, setType] = useState<'2way' | '3way'>('2way');
  const [investment, setInvestment] = useState<number>(1000);
  
  const [odds1, setOdds1] = useState<number>(2.10);
  const [odds2, setOdds2] = useState<number>(2.05);
  const [odds3, setOdds3] = useState<number>(3.40); // For 3-way

  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    let impliedProb = 0;
    
    if (type === '2way') {
      if (!odds1 || !odds2) {
        setResult(null);
        return;
      }
      impliedProb = (1 / odds1) + (1 / odds2);
    } else {
      if (!odds1 || !odds2 || !odds3) {
        setResult(null);
        return;
      }
      impliedProb = (1 / odds1) + (1 / odds2) + (1 / odds3);
    }

    const margin = impliedProb * 100;
    const isArbitrage = margin < 100;
    const roi = isArbitrage ? (100 / margin) - 100 : 0;
    const totalReturn = investment * (1 + (roi / 100));
    const profit = totalReturn - investment;

    let stakes = [];
    if (type === '2way') {
      const stake1 = (investment * (1 / odds1)) / impliedProb;
      const stake2 = (investment * (1 / odds2)) / impliedProb;
      stakes = [stake1, stake2];
    } else {
      const stake1 = (investment * (1 / odds1)) / impliedProb;
      const stake2 = (investment * (1 / odds2)) / impliedProb;
      const stake3 = (investment * (1 / odds3)) / impliedProb;
      stakes = [stake1, stake2, stake3];
    }

    setResult({
      margin,
      isArbitrage,
      roi,
      profit,
      totalReturn,
      stakes
    });
  }, [type, investment, odds1, odds2, odds3]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 font-sans"
    >
      <div className="border-b border-zinc-200 pb-4">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <Calculator className="w-5 h-5 md:w-6 md:h-6 text-zinc-700" />
          Módulo de Cálculo de Arbitragem
        </h2>
        <p className="text-xs md:text-sm text-zinc-500 mt-1 font-mono">
          Validação matemática de discrepâncias de odds. Distribuição de stakes via modelo proporcional.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 pb-4">
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-zinc-700 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Parâmetros de Entrada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex gap-2 p-1 bg-zinc-100 rounded-md w-full md:w-max border border-zinc-200">
              <button
                onClick={() => setType('2way')}
                className={`flex-1 md:flex-none px-4 py-2 md:py-1.5 rounded text-xs font-mono uppercase transition-all ${type === '2way' ? 'bg-white shadow-sm text-zinc-900 border border-zinc-200' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                Mercado 2-Way
              </button>
              <button
                onClick={() => setType('3way')}
                className={`flex-1 md:flex-none px-4 py-2 md:py-1.5 rounded text-xs font-mono uppercase transition-all ${type === '3way' ? 'bg-white shadow-sm text-zinc-900 border border-zinc-200' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                Mercado 3-Way
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1.5 block">Capital Alocado (BRL)</label>
                <Input 
                  type="number" 
                  value={investment} 
                  onChange={(e) => setInvestment(Number(e.target.value))}
                  className="font-mono text-lg bg-zinc-50 border-zinc-200 focus-visible:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1.5 block">Odd Seleção A</label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={odds1} 
                    onChange={(e) => setOdds1(Number(e.target.value))}
                    className="font-mono text-lg bg-zinc-50 border-zinc-200 focus-visible:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1.5 block">
                    {type === '2way' ? 'Odd Seleção B' : 'Odd Empate'}
                  </label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={odds2} 
                    onChange={(e) => setOdds2(Number(e.target.value))}
                    className="font-mono text-lg bg-zinc-50 border-zinc-200 focus-visible:ring-emerald-500"
                  />
                </div>
                {type === '3way' && (
                  <div className="col-span-1 sm:col-span-2">
                    <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1.5 block">Odd Seleção C</label>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={odds3} 
                      onChange={(e) => setOdds3(Number(e.target.value))}
                      className="font-mono text-lg bg-zinc-50 border-zinc-200 focus-visible:ring-emerald-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card className={`border ${result.isArbitrage ? 'border-emerald-500 shadow-sm' : 'border-zinc-200 shadow-sm'}`}>
            <CardHeader className={`border-b ${result.isArbitrage ? 'bg-emerald-50/30 border-emerald-100' : 'bg-zinc-50/50 border-zinc-100'} pb-4`}>
              <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2">
                {result.isArbitrage ? (
                  <><CheckCircle2 className="w-4 h-4 text-emerald-600" /> <span className="text-emerald-800">Arbitragem Validada</span></>
                ) : (
                  <><AlertTriangle className="w-4 h-4 text-zinc-500" /> <span className="text-zinc-700">Margem Negativa (EV-)</span></>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-50 rounded-md p-3 md:p-4 border border-zinc-200">
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Margem Implícita</p>
                  <p className={`text-xl md:text-2xl font-mono font-bold ${result.isArbitrage ? 'text-emerald-600' : 'text-zinc-900'}`}>
                    {result.margin.toFixed(2)}%
                  </p>
                </div>
                <div className="bg-zinc-50 rounded-md p-3 md:p-4 border border-zinc-200">
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Expected ROI</p>
                  <p className={`text-xl md:text-2xl font-mono font-bold ${result.isArbitrage ? 'text-emerald-600' : 'text-zinc-900'}`}>
                    {result.roi.toFixed(2)}%
                  </p>
                </div>
              </div>

              {result.isArbitrage ? (
                <>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                    <span className="text-xs font-mono text-emerald-800 uppercase tracking-wider">Lucro Líquido Projetado</span>
                    <span className="text-xl font-mono font-bold text-emerald-700">BRL {result.profit.toFixed(2)}</span>
                  </div>

                  <div>
                    <h4 className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <ArrowRight className="w-3 h-3" />
                      Distribuição de Stakes (Hedge)
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2.5 bg-white rounded border border-zinc-200">
                        <span className="text-xs font-mono text-zinc-600">Seleção A (@{odds1.toFixed(2)})</span>
                        <span className="font-mono font-bold text-zinc-900">BRL {result.stakes[0].toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2.5 bg-white rounded border border-zinc-200">
                        <span className="text-xs font-mono text-zinc-600">Seleção B (@{odds2.toFixed(2)})</span>
                        <span className="font-mono font-bold text-zinc-900">BRL {result.stakes[1].toFixed(2)}</span>
                      </div>
                      {type === '3way' && (
                        <div className="flex justify-between items-center p-2.5 bg-white rounded border border-zinc-200">
                          <span className="text-xs font-mono text-zinc-600">Seleção C (@{odds3.toFixed(2)})</span>
                          <span className="font-mono font-bold text-zinc-900">BRL {result.stakes[2].toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm font-mono text-zinc-500">
                    A margem combinada de {(result.margin).toFixed(2)}% indica vantagem matemática para a casa de apostas (Vig: {(result.margin - 100).toFixed(2)}%).
                    <br/><br/>
                    Ação recomendada: <strong>ABORTAR OPERAÇÃO</strong>.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}
