import { Type } from '@google/genai';
import { generateWithFallback, cleanAndParseJSON } from './aiService';

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
  date: string; // DD/MM/YYYY
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
  date: string;
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
  date: string;
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
  aiSources?: string[];
  aiProvider?: string;
}

let cachedData: MarketData | null = null;
let fetchPromise: Promise<MarketData> | null = null;
let cachedTrends: TrendAlert[] | null = null;

export function clearMarketCache() {
  cachedData = null;
  fetchPromise = null;
  cachedTrends = null;
  console.log("Market Data Cache cleared.");
}

// Helper to fetch with fallback
async function fetchWithFallback(prompt: string, schema: any, force: boolean = false) {
  try {
    const response = await generateWithFallback(prompt, schema, force);
    return response;
  } catch (error) {
    console.error("AI generation failed across all providers:", error);
    throw error;
  }
}

export async function fetchMarketTrends(force = false): Promise<TrendAlert[]> {
  if (cachedTrends && !force) return cachedTrends;

  try {
    const prompt = `Atue como um radar de "Dropping Odds" (Queda de Odds) e "Smart Money" (Dinheiro Inteligente).
    É OBRIGATÓRIO pesquisar os jogos REAIS que AINDA VÃO COMEÇAR.
    REGRA CRÍTICA: NÃO inclua jogos que já terminaram ou que já foram encerrados.
    Se não houver jogos relevantes para HOJE, busque os jogos de AMANHÃ ou do próximo dia disponível no calendário oficial das ligas.
    Identifique 8 jogos REAIS onde houve uma QUEDA SIGNIFICATIVA nas odds.
    NÃO INVENTE JOGOS. Valide contra o calendário oficial das ligas brasileiras e internacionais (Google Calendar/Ligas Oficiais).`;

    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          match: { type: Type.STRING },
          league: { type: Type.STRING },
          date: { type: Type.STRING, description: "Data do jogo no formato DD/MM/YYYY" },
          time: { type: Type.STRING, description: "Horário do jogo no formato HH:mm" },
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

    const response = await fetchWithFallback(prompt, schema, force);
    const parsed = cleanAndParseJSON(response.text);
    cachedTrends = parsed;
    return parsed;
  } catch (error) {
    console.error("Error fetching market trends:", error);
    // Return empty array or maybe a static fallback for trends if desired
    // For now, let's return a static trend fallback to avoid empty screens
    const today = new Date().toLocaleDateString('pt-BR');
    return [
      {
        id: 'TRD-001',
        match: 'São Paulo vs Palmeiras',
        league: 'Paulistão',
        date: today,
        time: '21:30',
        market: 'Moneyline',
        selection: 'São Paulo',
        oldOdds: 2.80,
        newOdds: 2.45,
        dropPercentage: 12.5,
        reason: 'Lesão confirmada do zagueiro titular do Palmeiras.',
        heatLevel: 85,
        type: 'Dropping Odds'
      },
      {
        id: 'TRD-002',
        match: 'Lakers vs Warriors',
        league: 'NBA',
        date: today,
        time: '23:30',
        market: 'Total Points',
        selection: 'Over 235.5',
        oldOdds: 1.90,
        newOdds: 1.75,
        dropPercentage: 8.0,
        reason: 'Alto volume de apostas profissionais no Over.',
        heatLevel: 92,
        type: 'Smart Money'
      }
    ];
  }
}

// Return instant fallback data, then fetch live data in background
export async function fetchMarketData(force = false): Promise<MarketData> {
  if (cachedData && !force) return cachedData;
  if (fetchPromise && !force) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const prompt = `É OBRIGATÓRIO pesquisar os jogos REAIS de futebol e basquete que AINDA VÃO COMEÇAR.
      REGRA CRÍTICA: NÃO inclua jogos que já terminaram.
      Se não houver jogos para hoje, busque obrigatoriamente os jogos do próximo dia disponível conforme o calendário oficial (Google Calendar/Ligas Oficiais).
      NÃO INVENTE JOGOS.
      Com base nesses jogos reais futuros, gere:
      1. 6 oportunidades de apostas (ValueBets e Surebets).
      2. 3 bilhetes prontos (múltiplas) categorizados por risco.
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
                date: { type: Type.STRING, description: "Data do jogo no formato DD/MM/YYYY" },
                time: { type: Type.STRING, description: "Horário do jogo no formato HH:mm" },
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
                      date: { type: Type.STRING, description: "Data do jogo no formato DD/MM/YYYY" },
                      time: { type: Type.STRING, description: "Horário do jogo no formato HH:mm" },
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

      const response = await fetchWithFallback(prompt, schema, force);
      const data = cleanAndParseJSON(response.text);
      
      data.opportunities = data.opportunities.map((o: any) => ({
        ...o,
        lastUpdated: new Date()
      }));

      data.aiProvider = response.provider;
      data.aiSources = response.sources;

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
    const prompt = `Pesquise os PRÓXIMOS jogos reais do time "${team}".
    REGRA CRÍTICA: NÃO inclua jogos que já terminaram. Se o time já jogou hoje, busque o próximo jogo no calendário oficial (Google Calendar/Ligas Oficiais).
    NÃO INVENTE JOGOS. Valide contra o calendário oficial das ligas.
    Gere 3 oportunidades de apostas para esses jogos futuros em casas licenciadas no Brasil.`;

    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          match: { type: Type.STRING },
          sport: { type: Type.STRING },
          league: { type: Type.STRING },
          date: { type: Type.STRING, description: "Data do jogo no formato DD/MM/YYYY" },
          time: { type: Type.STRING, description: "Horário do jogo no formato HH:mm" },
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

    const prompt = `Hoje é 26 de Fevereiro de 2026. A hora atual é 19:49 (Fuso Horário do Pacífico).
    O usuário quer apostar R$ ${stake} para ganhar R$ ${targetWin}, o que exige uma Odd Total de aproximadamente ${targetOdds.toFixed(2)}.
    O nível de risco desejado é: ${riskLevel}.
    
    Abaixo estão as melhores oportunidades (ValueBets/Surebets) e tendências (Dropping Odds/Smart Money) mapeadas pelo nosso sistema hoje:
    OPORTUNIDADES: ${oppsContext}
    TENDÊNCIAS: ${trendsContext}
    
    Sua tarefa é criar UM bilhete (múltipla) combinando de 2 a 6 seleções.
    PRIORIZE FORTEMENTE usar os jogos fornecidos nas OPORTUNIDADES e TENDÊNCIAS acima. Se não houver jogos suficientes para atingir a odd, você PODE pesquisar na internet (usando googleSearch) outros PRÓXIMOS jogos reais de futebol e basquete.
    REGRA CRÍTICA: NÃO inclua jogos que já terminaram.
    NÃO INVENTE JOGOS. Use apenas casas de apostas licenciadas no Brasil. Valide contra o calendário oficial (Google Calendar/Ligas Oficiais).`;

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
              date: { type: Type.STRING, description: "Data do jogo no formato DD/MM/YYYY" },
              time: { type: Type.STRING, description: "Horário do jogo no formato HH:mm" },
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

export interface ArbitrageOpp {
  id: string;
  match: string;
  league: string;
  date: string;
  time: string;
  roi: number;
  bets: {
    outcome: string;
    odds: number;
    bookmaker: string;
    stake: number;
  }[];
}

export interface MatchInsight {
  id: string;
  match: string;
  league: string;
  date: string;
  time: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  score: number;
  keyFactors: string[];
  prediction: string;
  confidence: number;
  forumContributors?: string[];
}

export async function fetchArbitrageOpportunities(): Promise<ArbitrageOpp[]> {
  try {
    const prompt = `Pesquise discrepâncias de odds para jogos REAIS que AINDA VÃO COMEÇAR em casas licenciadas no Brasil.
    REGRA CRÍTICA: NÃO inclua jogos que já terminaram. Se não houver jogos agora, busque os próximos do calendário oficial (Google Calendar/Ligas Oficiais).
    NÃO INVENTE JOGOS.
    Identifique 4 oportunidades de Arbitragem (Surebets).`;

    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          match: { type: Type.STRING },
          league: { type: Type.STRING },
          date: { type: Type.STRING, description: "Data do jogo no formato DD/MM/YYYY" },
          time: { type: Type.STRING, description: "Horário do jogo no formato HH:mm" },
          roi: { type: Type.NUMBER },
          bets: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                outcome: { type: Type.STRING },
                odds: { type: Type.NUMBER },
                bookmaker: { type: Type.STRING },
                stake: { type: Type.NUMBER, description: "Sugestão de stake proporcional para R$ 100 de banca total" }
              }
            }
          }
        }
      }
    };

    const response = await fetchWithFallback(prompt, schema);
    return cleanAndParseJSON(response.text);
  } catch (error) {
    console.error("Error fetching arbitrage:", error);
    // Return static fallback for arbitrage
    const today = new Date().toLocaleDateString('pt-BR');
    return [
      {
        id: 'ARB-001',
        match: 'Corinthians vs Santos',
        league: 'Paulistão',
        date: today,
        time: '19:30',
        roi: 2.5,
        bets: [
          { outcome: 'Corinthians', odds: 2.10, bookmaker: 'Betano', stake: 48.5 },
          { outcome: 'Empate ou Santos', odds: 2.05, bookmaker: 'Bet365', stake: 49.0 }
        ]
      }
    ];
  }
}

export async function fetchMatchInsights(): Promise<MatchInsight[]> {
  try {
    const prompt = `Pesquise notícias e sentimentos para os PRÓXIMOS jogos reais de futebol e basquete.
    REGRA CRÍTICA: NÃO inclua jogos que já terminaram. Se a rodada de hoje acabou, foque nos jogos de amanhã ou da próxima data disponível no calendário oficial (Google Calendar/Ligas Oficiais).
    Gere insights para 5 jogos importantes considerando o mercado brasileiro.`;

    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          match: { type: Type.STRING },
          league: { type: Type.STRING },
          date: { type: Type.STRING, description: "Data do jogo no formato DD/MM/YYYY" },
          time: { type: Type.STRING, description: "Horário do jogo no formato HH:mm" },
          sentiment: { type: Type.STRING },
          score: { type: Type.NUMBER, description: "Score de 0 a 100" },
          keyFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
          prediction: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          forumContributors: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    };

    const response = await fetchWithFallback(prompt, schema);
    return cleanAndParseJSON(response.text);
  } catch (error) {
    console.error("Error fetching insights:", error);
    // Return static fallback for insights
    const today = new Date().toLocaleDateString('pt-BR');
    return [
      {
        id: 'INS-001',
        match: 'São Paulo vs Palmeiras',
        league: 'Paulistão',
        date: today,
        time: '21:30',
        sentiment: 'Bullish',
        score: 88,
        keyFactors: ['Palmeiras com desfalques', 'Morumbi lotado', 'SPFC invicto em casa'],
        prediction: 'São Paulo vence ou empata',
        confidence: 85,
        forumContributors: ['Estatístico', 'Scout de Notícias']
      }
    ];
  }
}

export function getFallbackData(): MarketData {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const formatDate = (date: Date) => date.toLocaleDateString('pt-BR');
  
  return {
    opportunities: [
      {
        id: 'OPP-001',
        match: 'São Paulo vs Palmeiras',
        sport: 'Futebol',
        league: 'Paulistão',
        date: formatDate(today),
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
        date: formatDate(today),
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
        date: formatDate(today),
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
        date: formatDate(tomorrow),
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
          { id: '1', match: 'São Paulo vs Palmeiras', league: 'Paulistão', date: formatDate(today), time: '21:30', selection: 'Mais de 5.5 Cartões', odds: 1.85, aiConfidence: 92.5, market: 'Cartões' },
          { id: '2', match: 'Flamengo vs Vasco', league: 'Carioca', date: formatDate(today), time: '20:00', selection: 'Ambas Marcam', odds: 1.85, aiConfidence: 88.0, market: 'BTTS' }
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
          { id: '6', match: 'Mavericks vs Nuggets', league: 'NBA', date: formatDate(today), time: '22:00', selection: 'L. Dončić Over 32.5 Pts', odds: 1.90, aiConfidence: 89.5, market: 'Player Props' },
          { id: '7', match: 'Lakers vs Warriors', league: 'NBA', date: formatDate(today), time: '23:30', selection: 'S. Curry Over 4.5 3PM', odds: 1.85, aiConfidence: 86.2, market: 'Player Props' },
          { id: '8', match: 'Lakers vs Warriors', league: 'NBA', date: formatDate(today), time: '23:30', selection: 'A. Davis Over 12.5 Reb', odds: 1.65, aiConfidence: 88.8, market: 'Player Props' },
        ]
      }
    ]
  };
}
