import { GoogleGenAI, Type } from '@google/genai';

export interface BetOutcome {
  outcome: string;
  odds: number;
  bookmaker: string;
  impliedProb: number;
}

export interface Opportunity {
  id: string;
  match: string;
  sport: string;
  league: string;
  time: string;
  type: 'Surebet' | 'ValueBet';
  roi: number;
  aiConfidence: number;
  trueProbability: number;
  expectedValue: number;
  lastUpdated: Date;
  bets: BetOutcome[];
}

export interface TicketItem {
  id: string;
  match: string;
  league: string;
  time: string;
  selection: string;
  odds: number;
  aiConfidence: number;
  market: string;
}

export interface DailyTicket {
  id: string;
  title: string;
  description: string;
  riskLevel: 'Baixo' | 'Médio' | 'Alto';
  totalOdds: number;
  expectedValue: number;
  items: TicketItem[];
}

export interface TrendAlert {
  id: string;
  match: string;
  league: string;
  time: string;
  market: string;
  selection: string;
  oldOdds: number;
  newOdds: number;
  dropPercentage: number;
  reason: string;
  heatLevel: number;
  type: 'Dropping Odds' | 'Smart Money';
}

export interface MarketData {
  opportunities: Opportunity[];
  tickets: DailyTicket[];
}

let cachedData: MarketData | null = null;
let fetchPromise: Promise<MarketData> | null = null;
let cachedTrends: TrendAlert[] | null = null;

// Helper to safely parse JSON from Gemini response
function cleanAndParseJSON(text: string) {
  try {
    // Remove markdown code blocks if present
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Invalid JSON format");
  }
}

// Helper to fetch with fallback
async function fetchWithFallback(prompt: string, schema: any) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const config = {
    tools: [{ googleSearch: {} }],
    responseMimeType: "application/json",
    responseSchema: schema
  };

  try {
    return await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config
    });
  } catch (error) {
    // Silently fallback to flash model
    return await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config
    });
  }
}

export async function fetchMarketTrends(force = false): Promise<TrendAlert[]> {
  if (cachedTrends && !force) return cachedTrends;

  try {
    const prompt = `Hoje é 26 de Fevereiro de 2026. A hora atual é 14:30 (Fuso Horário do Pacífico). É OBRIGATÓRIO pesquisar na internet (usando googleSearch) os jogos REAIS de futebol e basquete que estão acontecendo HOJE ou VÃO COMEÇAR em breve.
    Atue como um radar de "Dropping Odds" (Queda de Odds) e "Smart Money" (Dinheiro Inteligente).
    Identifique 8 jogos REAIS de hoje onde houve uma QUEDA SIGNIFICATIVA nas odds de uma seleção (ex: abriu a 2.10 e caiu para 1.65).
    Isso geralmente ocorre por volume anormal de apostas, lesões de última hora ou informações privilegiadas.
    Classifique cada um como 'Dropping Odds' (foco na queda matemática) ou 'Smart Money' (foco no volume financeiro/informação).
    REGRA CRÍTICA: NÃO inclua jogos que já terminaram.
    NÃO INVENTE JOGOS. Use apenas jogos reais encontrados na sua pesquisa de hoje.`;

    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          match: { type: Type.STRING },
          league: { type: Type.STRING },
          time: { type: Type.STRING },
          market: { type: Type.STRING },
          selection: { type: Type.STRING },
          oldOdds: { type: Type.NUMBER },
          newOdds: { type: Type.NUMBER },
          dropPercentage: { type: Type.NUMBER },
          reason: { type: Type.STRING },
          heatLevel: { type: Type.NUMBER },
          type: { type: Type.STRING, description: "Classifique como 'Dropping Odds' ou 'Smart Money'" }
        }
      }
    };

    const response = await fetchWithFallback(prompt, schema);
    const parsed = cleanAndParseJSON(response.text);
    cachedTrends = parsed;
    return parsed;
  } catch (error) {
    console.error("Error fetching market trends:", error);
    return [];
  }
}

// Return instant fallback data, then fetch live data in background
export async function fetchMarketData(force = false): Promise<MarketData> {
  if (cachedData && !force) return cachedData;
  if (fetchPromise && !force) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const prompt = `Hoje é 26 de Fevereiro de 2026. A hora atual é 13:41 (Fuso Horário do Pacífico). É OBRIGATÓRIO pesquisar na internet (usando googleSearch) os jogos REAIS de futebol (Estaduais do Brasil, Libertadores, Europa) e basquete (NBA) que estão acontecendo HOJE (26/02/2026).
      REGRA CRÍTICA: NÃO inclua jogos que já terminaram ou que já foram encerrados hoje. Busque apenas jogos que AINDA VÃO COMEÇAR ou que estão AO VIVO neste momento.
      NÃO INVENTE JOGOS. Use apenas jogos reais encontrados na sua pesquisa de hoje.
      Com base nesses jogos reais de hoje, gere:
      1. 6 oportunidades de apostas (ValueBets e Surebets) variando mercados (Escanteios, Gols, Vencedor, Cartões).
      2. 3 bilhetes prontos (múltiplas) combinando essas oportunidades reais de hoje, categorizados por risco (Baixo, Médio, Alto).
      Utilize estritamente casas de apostas licenciadas no Brasil (Betano, Superbet, Sportingbet, KTO, Bet365).`;

      const schema = {
        type: Type.OBJECT,
        properties: {
          opportunities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                match: { type: Type.STRING },
                sport: { type: Type.STRING },
                league: { type: Type.STRING },
                time: { type: Type.STRING },
                type: { type: Type.STRING },
                roi: { type: Type.NUMBER },
                aiConfidence: { type: Type.NUMBER },
                trueProbability: { type: Type.NUMBER },
                expectedValue: { type: Type.NUMBER },
                bets: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      outcome: { type: Type.STRING },
                      odds: { type: Type.NUMBER },
                      bookmaker: { type: Type.STRING },
                      impliedProb: { type: Type.NUMBER }
                    }
                  }
                }
              }
            }
          },
          tickets: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                riskLevel: { type: Type.STRING },
                totalOdds: { type: Type.NUMBER },
                expectedValue: { type: Type.NUMBER },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      match: { type: Type.STRING },
                      league: { type: Type.STRING },
                      time: { type: Type.STRING },
                      selection: { type: Type.STRING },
                      odds: { type: Type.NUMBER },
                      aiConfidence: { type: Type.NUMBER },
                      market: { type: Type.STRING }
                    }
                  }
                }
              }
            }
          }
        }
      };

      const response = await fetchWithFallback(prompt, schema);
      const data = cleanAndParseJSON(response.text);
      
      data.opportunities = data.opportunities.map((o: any) => ({
        ...o,
        lastUpdated: new Date()
      }));

      cachedData = data;
      return data;
    } catch (error) {
      console.error("Error fetching live market data:", error);
      const fallback = getFallbackData();
      cachedData = fallback;
      return fallback;
    }
  })();

  return fetchPromise;
}

export async function searchTeamMarkets(team: string): Promise<Opportunity[]> {
  try {
    const prompt = `Hoje é 26 de Fevereiro de 2026. A hora atual é 13:41 (Fuso Horário do Pacífico). É OBRIGATÓRIO pesquisar na internet (usando googleSearch) os PRÓXIMOS jogos reais do time "${team}".
    REGRA CRÍTICA: NÃO inclua jogos que já terminaram. Busque apenas jogos que AINDA VÃO COMEÇAR ou que estão AO VIVO neste momento.
    NÃO INVENTE JOGOS. Use apenas jogos reais encontrados na sua pesquisa.
    Com base nesses próximos jogos reais, gere 3 oportunidades de apostas (ValueBets ou Surebets) variando mercados (Escanteios, Gols, Vencedor, Cartões, Props).
    Utilize estritamente casas de apostas licenciadas no Brasil (Betano, Superbet, Sportingbet, KTO, Bet365).`;

    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          match: { type: Type.STRING },
          sport: { type: Type.STRING },
          league: { type: Type.STRING },
          time: { type: Type.STRING },
          type: { type: Type.STRING },
          roi: { type: Type.NUMBER },
          aiConfidence: { type: Type.NUMBER },
          trueProbability: { type: Type.NUMBER },
          expectedValue: { type: Type.NUMBER },
          bets: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                outcome: { type: Type.STRING },
                odds: { type: Type.NUMBER },
                bookmaker: { type: Type.STRING },
                impliedProb: { type: Type.NUMBER }
              }
            }
          }
        }
      }
    };

    const response = await fetchWithFallback(prompt, schema);
    const data = cleanAndParseJSON(response.text);
    return data.map((o: any) => ({
      ...o,
      lastUpdated: new Date()
    }));
  } catch (error) {
    console.error("Error searching team markets:", error);
    return [];
  }
}

export async function generateCustomTicket(stake: number, targetWin: number, riskLevel: string): Promise<DailyTicket | null> {
  try {
    const targetOdds = targetWin / stake;
    
    const oppsContext = cachedData ? JSON.stringify(cachedData.opportunities.slice(0, 10)) : "Nenhum dado em cache.";
    const trendsContext = cachedTrends ? JSON.stringify(cachedTrends.slice(0, 5)) : "Nenhuma tendência em cache.";

    const prompt = `Hoje é 26 de Fevereiro de 2026. A hora atual é 14:30 (Fuso Horário do Pacífico).
    O usuário quer apostar R$ ${stake} para ganhar R$ ${targetWin}, o que exige uma Odd Total de aproximadamente ${targetOdds.toFixed(2)}.
    O nível de risco desejado é: ${riskLevel}.
    
    Abaixo estão as melhores oportunidades (ValueBets/Surebets) e tendências (Dropping Odds/Smart Money) mapeadas pelo nosso sistema hoje:
    OPORTUNIDADES: ${oppsContext}
    TENDÊNCIAS: ${trendsContext}
    
    Sua tarefa é criar UM bilhete (múltipla) combinando de 2 a 6 seleções.
    PRIORIZE FORTEMENTE usar os jogos fornecidos nas OPORTUNIDADES e TENDÊNCIAS acima. Se não houver jogos suficientes para atingir a odd, você PODE pesquisar na internet (usando googleSearch) outros PRÓXIMOS jogos reais de futebol e basquete.
    REGRA CRÍTICA: NÃO inclua jogos que já terminaram.
    NÃO INVENTE JOGOS. Use apenas casas de apostas licenciadas no Brasil.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        riskLevel: { type: Type.STRING },
        totalOdds: { type: Type.NUMBER },
        expectedValue: { type: Type.NUMBER },
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              match: { type: Type.STRING },
              league: { type: Type.STRING },
              time: { type: Type.STRING },
              selection: { type: Type.STRING },
              odds: { type: Type.NUMBER },
              aiConfidence: { type: Type.NUMBER },
              market: { type: Type.STRING }
            }
          }
        }
      }
    };

    const response = await fetchWithFallback(prompt, schema);
    return cleanAndParseJSON(response.text);
  } catch (error) {
    console.error("Error generating custom ticket:", error);
    return null;
  }
}

export function getFallbackData(): MarketData {
  return {
    opportunities: [
      {
        id: 'OPP-001',
        match: 'São Paulo vs Palmeiras',
        sport: 'Futebol',
        league: 'Paulistão',
        time: '21:30',
        type: 'ValueBet',
        roi: 4.2,
        aiConfidence: 92.5,
        trueProbability: 58.0,
        expectedValue: 3.8,
        lastUpdated: new Date(),
        bets: [
          { outcome: 'Mais de 5.5 Cartões', odds: 1.85, bookmaker: 'Betano', impliedProb: 54.05 }
        ]
      },
      {
        id: 'OPP-002',
        match: 'Flamengo vs Vasco',
        sport: 'Futebol',
        league: 'Carioca',
        time: '20:00',
        type: 'Surebet',
        roi: 1.5,
        aiConfidence: 99.1,
        trueProbability: 99.9,
        expectedValue: 1.5,
        lastUpdated: new Date(),
        bets: [
          { outcome: 'Flamengo', odds: 1.95, bookmaker: 'Superbet', impliedProb: 51.28 },
          { outcome: 'Vasco ou Empate', odds: 2.15, bookmaker: 'Bet365', impliedProb: 46.51 }
        ]
      },
      {
        id: 'OPP-003',
        match: 'Lakers vs Warriors',
        sport: 'Basquete',
        league: 'NBA',
        time: '23:30',
        type: 'ValueBet',
        roi: 5.2,
        aiConfidence: 88.2,
        trueProbability: 55.0,
        expectedValue: 4.5,
        lastUpdated: new Date(),
        bets: [
          { outcome: 'Lakers (ML)', odds: 2.10, bookmaker: 'Betano', impliedProb: 47.61 },
        ]
      },
      {
        id: 'OPP-004',
        match: 'Arsenal vs Man City',
        sport: 'Futebol',
        league: 'Premier League',
        time: '14:00',
        type: 'ValueBet',
        roi: 4.5,
        aiConfidence: 95.2,
        trueProbability: 68.5,
        expectedValue: 6.2,
        lastUpdated: new Date(),
        bets: [
          { outcome: 'Mais de 9.5 Escanteios', odds: 1.95, bookmaker: 'Sportingbet', impliedProb: 51.28 },
        ]
      }
    ],
    tickets: [
      {
        id: 'TKT-001',
        title: 'Dupla Clássicos Estaduais',
        description: 'Foco em cartões e gols nos clássicos de hoje.',
        riskLevel: 'Médio',
        totalOdds: 3.42,
        expectedValue: 10.5,
        items: [
          { id: '1', match: 'São Paulo vs Palmeiras', league: 'Paulistão', time: '21:30', selection: 'Mais de 5.5 Cartões', odds: 1.85, aiConfidence: 92.5, market: 'Cartões' },
          { id: '2', match: 'Flamengo vs Vasco', league: 'Carioca', time: '20:00', selection: 'Ambas Marcam', odds: 1.85, aiConfidence: 88.0, market: 'BTTS' }
        ]
      },
      {
        id: 'TKT-002',
        title: 'Props de Jogadores (NBA)',
        description: 'Projeção estatística de pontuação baseada em matchups e usage rate.',
        riskLevel: 'Alto',
        totalOdds: 5.80,
        expectedValue: 18.4,
        items: [
          { id: '6', match: 'Mavericks vs Nuggets', league: 'NBA', time: '22:00', selection: 'L. Dončić Over 32.5 Pts', odds: 1.90, aiConfidence: 89.5, market: 'Player Props' },
          { id: '7', match: 'Lakers vs Warriors', league: 'NBA', time: '23:30', selection: 'S. Curry Over 4.5 3PM', odds: 1.85, aiConfidence: 86.2, market: 'Player Props' },
          { id: '8', match: 'Lakers vs Warriors', league: 'NBA', time: '23:30', selection: 'A. Davis Over 12.5 Reb', odds: 1.65, aiConfidence: 88.8, market: 'Player Props' },
        ]
      }
    ]
  };
}
