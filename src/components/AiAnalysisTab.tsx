import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import { BrainCircuit, Loader2, Terminal } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { toast } from 'sonner';

export default function AiAnalysisTab() {
  const [prompt, setPrompt] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setAnalysis('');
    toast.loading('Processando modelo preditivo...', { id: 'ai' });
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const promptText = `Você é uma inteligência artificial avançada especializada em modelagem quantitativa para apostas esportivas (Arbitragem, Value Bets, Mercados Asiáticos, Escanteios, Cartões e Props).
        
Analise o seguinte cenário de mercado fornecido pelo usuário:
"${prompt}"

Sua resposta deve ser estritamente analítica, sem emoção, focada em números e probabilidades. Inclua:
1. Avaliação de EV (Expected Value) ou Arbitragem.
2. Cálculos de probabilidade implícita vs probabilidade real estimada.
3. Fatores de risco sistêmico (ex: liquidez, regras de cancelamento, limites).
4. Veredito final (Recomendação de ação quantitativa).

Responda em português, usando jargão técnico apropriado e formatação limpa.`;

      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: promptText,
        });
      } catch (proError) {
        // Silently fallback to flash model without alerting the user
        response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: promptText,
        });
      }
      
      setAnalysis(response.text || 'Erro de processamento: Output vazio.');
      toast.success('Análise concluída com sucesso.', { id: 'ai' });
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      setAnalysis('Erro de conexão com o modelo preditivo. Verifique as credenciais de API ou tente novamente mais tarde.');
      toast.error('Falha na execução do modelo.', { id: 'ai' });
    } finally {
      setLoading(false);
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
          <BrainCircuit className="w-5 h-5 md:w-6 md:h-6 text-zinc-700" />
          Modelagem Preditiva IA
        </h2>
        <p className="text-xs md:text-sm text-zinc-500 mt-1 font-mono">
          Avaliação de cenários complexos, cálculo de EV e análise de risco sistêmico via LLM.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 pb-4">
              <CardTitle className="text-sm font-mono uppercase tracking-wider text-zinc-700 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-600" />
                Input de Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <label className="text-[10px] md:text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2 block">Cenário / Parâmetros:</label>
                <textarea
                  className="w-full min-h-[120px] md:min-h-[150px] rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs md:text-sm font-mono placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 resize-none"
                  placeholder="Ex: Jogo Lakers vs Warriors. Odd 2.10 Lakers (Betano), 2.05 Warriors (Pinnacle). Capital: BRL 1000."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
              <Button 
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-[10px] md:text-xs uppercase tracking-wider h-10 md:h-9" 
                onClick={handleAnalyze}
                disabled={loading || !prompt.trim()}
              >
                {loading ? (
                  <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> Processando...</>
                ) : (
                  'Executar Modelo'
                )}
              </Button>
            </CardContent>
          </Card>
          
          <div className="bg-zinc-100 border border-zinc-200 rounded-md p-3 md:p-4 text-[10px] md:text-xs font-mono text-zinc-600">
            <h4 className="font-bold text-zinc-800 mb-2 uppercase tracking-wider">Diretrizes de Input:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Forneça odds e bookmakers.</li>
              <li>Especifique esporte/mercado.</li>
              <li>Questione regras de liquidação.</li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full min-h-[300px] md:min-h-[400px] flex flex-col border-zinc-200 shadow-sm">
            <CardHeader className="bg-zinc-900 text-zinc-100 border-b border-zinc-800 pb-4">
              <CardTitle className="text-[10px] md:text-sm font-mono uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-3 h-3 md:w-4 md:h-4 text-emerald-500" />
                Output Analítico
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4 md:p-6 overflow-auto bg-zinc-950 text-zinc-300 font-mono text-xs md:text-sm">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4 py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                  <p className="animate-pulse text-center px-4">Calculando vetores de probabilidade...</p>
                </div>
              ) : analysis ? (
                <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-headings:text-zinc-100 prose-a:text-emerald-400 prose-sm md:prose-base">
                  {analysis.split('\n').map((line, i) => {
                    if (line.startsWith('##')) return <h3 key={i} className="text-sm md:text-base font-bold mt-4 mb-2 text-emerald-400">{line.replace(/##/g, '')}</h3>;
                    if (line.startsWith('#')) return <h2 key={i} className="text-base md:text-lg font-bold mt-5 mb-3 text-emerald-500">{line.replace(/#/g, '')}</h2>;
                    if (line.startsWith('* **') || line.startsWith('- **')) {
                      const parts = line.split('**');
                      return <p key={i} className="my-1 text-zinc-300"><span className="text-emerald-500 mr-2">{'>'}</span><strong className="text-zinc-100">{parts[1]}</strong>{parts.slice(2).join('**')}</p>;
                    }
                    if (line.startsWith('*') || line.startsWith('-')) return <p key={i} className="my-1 ml-2 md:ml-4 text-zinc-400"><span className="text-zinc-600 mr-2">-</span>{line.substring(1)}</p>;
                    if (line.trim() === '') return <br key={i} />;
                    return <p key={i} className="my-2">{line}</p>;
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2 py-12">
                  <Terminal className="w-6 h-6 md:w-8 md:h-8 text-zinc-800 mb-2" />
                  <p className="text-center px-4">Aguardando input de dados...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
