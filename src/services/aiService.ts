import { GoogleGenAI } from "@google/genai";

export interface AIResponse {
  provider: 'gemini-pro' | 'gemini-flash' | 'gemini-legacy' | 'forum_consensus' | 'consensus' | 'unified_eco_mode';
  sources?: string[];
  text: string;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Simple in-memory cache
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function clearCache() {
  cache.clear();
  console.log("AI Cache cleared.");
}

// Expert Reputation System (In-Memory for now, ideally persisted)
const expertReputation: Record<string, number> = {
  "Estatístico": 1.0,
  "Scout de Notícias": 1.0,
  "Historiador": 1.0,
  "Analista de Mercado": 1.0,
  "Caçador de Valor": 1.0,
  "Gestor de Risco": 1.0,
  "Sentimento Social": 1.0
};

function updateExpertReputation(expertName: string, isSuccessful: boolean) {
  if (!expertReputation[expertName]) return;
  const adjustment = isSuccessful ? 0.05 : -0.1; // Penalty is harsher than reward
  expertReputation[expertName] = Math.max(0.1, Math.min(2.0, expertReputation[expertName] + adjustment));
}

function getBrasiliaTime() {
  const now = new Date();
  // Robust way to get Brasilia time regardless of local timezone
  const brTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  return {
    date: brTime.toLocaleDateString('pt-BR'),
    time: brTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    hour: brTime.getHours(),
    minute: brTime.getMinutes(),
    full: brTime
  };
}

// Helper to safely parse JSON from Gemini response
export function cleanAndParseJSON(text: string) {
  try {
    // First, try to find a JSON block within markdown code fences
    const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      return JSON.parse(jsonBlockMatch[1]);
    }

    // If no code block, try to find the first '{' or '[' and the last '}' or ']'
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    const start = (firstBrace === -1) ? firstBracket : (firstBracket === -1) ? firstBrace : Math.min(firstBrace, firstBracket);
    
    const lastBrace = text.lastIndexOf('}');
    const lastBracket = text.lastIndexOf(']');
    const end = Math.max(lastBrace, lastBracket);

    if (start !== -1 && end !== -1 && end > start) {
      const jsonString = text.substring(start, end + 1);
      return JSON.parse(jsonString);
    }

    // Fallback: try parsing the whole text (maybe it was already clean)
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Invalid JSON format");
  }
}

export async function generateWithFallback(prompt: string, schema: any, force: boolean = false): Promise<AIResponse> {
  // Check cache first
  const cacheKey = prompt + JSON.stringify(schema);
  if (!force) {
    const cached = cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return cached.data;
    }
  }

  const br = getBrasiliaTime();
  const results: any[] = [];

  // --- THE FORUM OF 7 EXPERTS (Frontend Execution) ---

  const callExpert = async (name: string, model: string, specializedPrompt: string, useSearch: boolean = false): Promise<any> => {
    try {
      // Inject reputation weight into the prompt
      const weight = expertReputation[name] || 1.0;
      const reputationContext = `SEU PESO DE DECISÃO ATUAL É: ${weight.toFixed(2)}. ${weight > 1.2 ? "Você está em alta! Mantenha o nível." : weight < 0.8 ? "Você errou recentemente. Seja extremamente criterioso agora." : ""}`;

      const tools = useSearch ? [{ googleSearch: {} }] : [];
      
      // CONFIGURATION SAFETY:
      // Gemini models (especially Flash) often reject 'responseMimeType: application/json' when 'tools' are present.
      // We disable strict JSON mode if search is enabled and rely on prompt engineering + cleanAndParseJSON.
      const config: any = {
        tools: tools
      };

      let finalPrompt = `CONTEXTO BRASIL: Hoje é ${br.date}. Hora em Brasília: ${br.time}.
        PEDIDO: ${prompt}
        
        SUA IDENTIDADE: Você é o ${name}. ${specializedPrompt}
        ${reputationContext}
        
        REGRA ABSOLUTA DE TEMPO REAL:
        1. Use APENAS o Horário de Brasília.
        2. ${useSearch ? "VALIDAÇÃO DUPLA: Cruze os dados com o calendário oficial (Google/Ligas) para garantir que o jogo existe HOJE ou AMANHÃ." : "Use seu conhecimento interno para validar a lógica, mas esteja ciente que sem busca em tempo real você deve ser conservador."}
        3. PRIORIDADE MÁXIMA: Jogos que vão começar nas próximas 1 a 12 horas.
        4. DESCARTE IMEDIATO: Jogos passados, encerrados ou que começam daqui a mais de 48 horas.
        5. Se não houver jogos "quentes" agora, diga explicitamente que não há oportunidades de alto valor imediato.`;

      if (!useSearch) {
        config.responseMimeType = "application/json";
        config.responseSchema = schema;
      } else {
        finalPrompt += `\n\nIMPORTANT: Return ONLY the raw JSON object matching the requested schema. Do not use markdown code blocks or explanations.`;
      }

      const response = await ai.models.generateContent({
        model: model,
        contents: finalPrompt,
        config: config
      });
      
      const data = cleanAndParseJSON(response.text);
      
      // Basic validation: if data is empty or invalid, penalize
      if (!data || (Array.isArray(data) && data.length === 0)) {
        updateExpertReputation(name, false);
      } else {
        updateExpertReputation(name, true);
      }

      return { provider: name, data: data, weight: weight };
    } catch (e: any) {
      console.error(`Expert ${name} failed:`, e);
      // If it's a quota error, throw it up to trigger the Unified Fallback
      if (e.message?.includes('429') || e.message?.includes('quota') || e.status === 429 || e.message?.includes('RESOURCE_EXHAUSTED')) {
        throw new Error("QUOTA_EXCEEDED");
      }
      updateExpertReputation(name, false); // Penalize for other failures
      return null;
    }
  };

  // Unified Expert Fallback (Eco Mode)
  const callUnifiedExpert = async (enableSearch: boolean = true): Promise<AIResponse> => {
    console.log(`Switching to Unified Expert Mode (Eco Mode) - Search: ${enableSearch}...`);
    try {
      let unifiedPrompt = `CONTEXTO BRASIL: Hoje é ${br.date}. Hora em Brasília: ${br.time}.
      PEDIDO: ${prompt}
      
      ATUE COMO O "FÓRUM DE DECISÃO BETSAFE" (MODO UNIFICADO).
      Você deve simular a análise conjunta de 7 especialistas: Estatístico, Scout de Notícias, Historiador, Analista de Mercado, Caçador de Valor, Gestor de Risco e Sentimento Social.
      
      REGRA ABSOLUTA DE TEMPO REAL:
      1. Use APENAS o Horário de Brasília.
      2. ${enableSearch ? "VALIDAÇÃO DUPLA: Cruze os dados com o calendário oficial (Google/Ligas) para garantir que o jogo existe HOJE ou AMANHÃ." : "ATENÇÃO: A busca em tempo real está indisponível. Gere uma simulação realista baseada em jogos típicos ou dados conhecidos, mas marque claramente como simulação se necessário."}
      3. PRIORIDADE MÁXIMA: Jogos que vão começar nas próximas 1 a 12 horas.
      4. DESCARTE IMEDIATO: Jogos passados, encerrados ou que começam daqui a mais de 48 horas.
      
      Sintetize todas as análises e retorne o resultado final no formato JSON solicitado.`;

      const tools = enableSearch ? [{ googleSearch: {} }] : [];
      
      const config: any = {
        tools: tools
      };

      if (!enableSearch) {
        config.responseMimeType = "application/json";
        config.responseSchema = schema;
      } else {
        unifiedPrompt += `\n\nIMPORTANT: Return ONLY the raw JSON object. Do not use markdown code blocks.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // Use a lighter/faster model for fallback
        contents: unifiedPrompt,
        config: config
      });

      return {
        provider: 'unified_eco_mode',
        sources: ['unified_expert'],
        text: response.text
      };
    } catch (e: any) {
      console.error("Unified Expert failed:", e);
      // If search failed (quota or 400 invalid arg), try without search
      if (enableSearch && (e.message?.includes('429') || e.message?.includes('quota') || e.status === 429 || e.message?.includes('RESOURCE_EXHAUSTED') || e.status === 400 || e.message?.includes('unsupported'))) {
        console.log("Search failed in Unified Mode (Quota or Unsupported). Retrying without search...");
        return callUnifiedExpert(false);
      }
      throw e;
    }
  };

  try {
    // Batch 1: Critical Experts (High Priority)
    // ONLY enable search for "Scout de Notícias" to save quota (100 req/day limit)
    const batch1 = [
      callExpert("Estatístico", "gemini-3.1-pro-preview", "Foque puramente em probabilidades matemáticas e modelos de regressão baseados em dados históricos reais.", false),
      callExpert("Scout de Notícias", "gemini-3-flash-preview", "Foque em informações de última hora, lesões e escalações confirmadas. Use googleSearch obrigatoriamente.", true),
      callExpert("Analista de Mercado", "gemini-flash-lite-latest", "Foque na movimentação das odds (Dropping Odds) e comportamento das casas de apostas.", false)
    ];

    // Execute Batch 1
    const results1 = await Promise.all(batch1);
    
    // Check for quota errors in batch 1 (handled via throw in callExpert)
    
    // Small delay to be nice to the API
    await new Promise(resolve => setTimeout(resolve, 500));

    // Batch 2: Secondary Experts
    const batch2 = [
      callExpert("Caçador de Valor", "gemini-flash-latest", "Procure discrepâncias entre a probabilidade real e a odd oferecida. Identifique o 'Value'.", false),
      callExpert("Gestor de Risco", "gemini-3.1-pro-preview", "Avalie a volatilidade do evento e sugira a gestão de banca (Kelly Criterion).", false),
      callExpert("Sentimento Social", "gemini-3-flash-preview", "Analise o 'hype', pressão da torcida e clima emocional no X/Twitter e portais de notícias.", false)
    ];

    // Execute Batch 2
    const results2 = await Promise.all(batch2);

    const validResults = [...results1, ...results2].filter(r => r !== null);

    if (validResults.length === 0) {
      throw new Error("Todos os provedores de IA falharam.");
    }

    let finalResponse: AIResponse;

    // Consensus Logic: The Moderator (Frontend Execution)
    if (validResults.length > 1) {
        // Sort experts by weight (highest first) to give them more prominence in the prompt
        const sortedResults = validResults.sort((a, b) => b.weight - a.weight);

        const consensusPrompt = `Você é o MODERADOR SUPREMO do Fórum de Decisão BetSafe. 
        CONTEXTO: Brasil. Data: ${br.date}. Hora Brasília: ${br.time}.
        Pedido original: "${prompt}".
        
        DEPOIMENTOS DOS ESPECIALISTAS (Ordenados por Reputação/Acerto):
        ${sortedResults.map(r => `--- ${r.provider.toUpperCase()} (Peso: ${r.weight.toFixed(2)}) ---\n${JSON.stringify(r.data)}`).join('\n\n')}
        
        SUA MISSÃO CRÍTICA (DOUBLE CHECK):
        1. VALIDAÇÃO DE CALENDÁRIO: Use o Google Search para confirmar se esses jogos REALMENTE acontecem hoje (${br.date}) ou amanhã.
        2. FILTRO TEMPORAL RIGOROSO: Elimine qualquer jogo que já tenha terminado. Priorize jogos começando em breve.
        3. PONDERAÇÃO: Dê muito mais valor às sugestões dos especialistas com maior PESO. Se um especialista com peso baixo sugerir algo estranho, ignore.
        4. CONSENSO: Gere uma lista final apenas com as oportunidades confirmadas e de alto valor imediato.
        
        Retorne APENAS o objeto JSON final seguindo este esquema: ${JSON.stringify(schema)}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: consensusPrompt,
          config: { 
            responseMimeType: "application/json", 
            responseSchema: schema,
            tools: [{ googleSearch: {} }] // Enable Google Search for moderator validation
          }
        });

        finalResponse = {
          provider: 'forum_consensus',
          sources: validResults.map(r => r.provider),
          text: response.text
        };
    } else {
      finalResponse = {
        provider: validResults[0].provider,
        sources: [validResults[0].provider],
        text: JSON.stringify(validResults[0].data)
      };
    }

    // Cache the result
    cache.set(cacheKey, { data: finalResponse, timestamp: Date.now() });
    return finalResponse;

  } catch (error: any) {
    // Catch Quota Errors and switch to Unified Mode
    if (error.message === "QUOTA_EXCEEDED" || error.message?.includes('429') || error.status === 429 || error.message?.includes('RESOURCE_EXHAUSTED')) {
      return await callUnifiedExpert(true);
    }
    throw error;
  }
}
