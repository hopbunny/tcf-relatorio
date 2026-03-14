import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { aiLearning, technicians, services, routeAnalyses } from "../drizzle/schema";
import { eq, desc, and, like, sql } from "drizzle-orm";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============================================
  // AI Router - Sugestões e Aprendizado
  // ============================================
  ai: router({
    getSuggestions: publicProcedure
      .input(z.object({ serviceType: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) return { descriptions: [], procedures: [], observations: [] };

        try {
          const rows = await db
            .select()
            .from(aiLearning)
            .where(eq(aiLearning.serviceType, input.serviceType))
            .orderBy(desc(aiLearning.usageCount))
            .limit(30);

          const descriptions = rows.filter(r => r.field === 'description').map(r => r.content).slice(0, 5);
          const procedures = rows.filter(r => r.field === 'procedure').map(r => r.content).slice(0, 8);
          const observations = rows.filter(r => r.field === 'observation').map(r => r.content).slice(0, 5);

          return { descriptions, procedures, observations };
        } catch {
          return { descriptions: [], procedures: [], observations: [] };
        }
      }),

    learn: publicProcedure
      .input(z.object({
        serviceType: z.string(),
        field: z.enum(['description', 'procedure', 'observation']),
        content: z.string().min(3),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) return { success: false };

        try {
          // Check if this exact content already exists
          const existing = await db
            .select()
            .from(aiLearning)
            .where(
              and(
                eq(aiLearning.serviceType, input.serviceType),
                eq(aiLearning.field, input.field),
                eq(aiLearning.content, input.content)
              )
            )
            .limit(1);

          if (existing.length > 0) {
            // Increment usage count
            const newCount = (existing[0].usageCount || 1) + 1;
            await db
              .update(aiLearning)
              .set({ usageCount: newCount })
              .where(eq(aiLearning.id, existing[0].id));
          } else {
            // Insert new learning
            await db.insert(aiLearning).values({
              serviceType: input.serviceType,
              field: input.field,
              content: input.content,
              usageCount: 1,
            });
          }
          return { success: true };
        } catch {
          return { success: false };
        }
      }),

    improveText: publicProcedure
      .input(z.object({
        text: z.string(),
        context: z.string().optional(),
        type: z.enum(['description', 'procedure', 'observation', 'analysis']),
      }))
      .mutation(async ({ input }) => {
        try {
          const typeLabels: Record<string, string> = {
            description: 'descrição de ocorrência técnica',
            procedure: 'procedimento técnico realizado',
            observation: 'observação técnica',
            analysis: 'análise técnica',
          };
          const response = await invokeLLM({
            messages: [
              {
                role: 'system',
                content: `Você é um assistente especializado em relatórios técnicos de telecomunicações e internet. 
Melhore o texto fornecido para ser mais claro, profissional e técnico. 
Mantenha o mesmo significado mas melhore a clareza e profissionalismo.
Responda APENAS com o texto melhorado, sem explicações adicionais.`,
              },
              {
                role: 'user',
                content: `Melhore este ${typeLabels[input.type]}: "${input.text}"`,
              },
            ],
          });
          const improved = response.choices?.[0]?.message?.content || input.text;
          return { improved: typeof improved === 'string' ? improved.trim() : input.text };
        } catch {
          return { improved: input.text };
        }
      }),
  }),

  // ============================================
  // Route Analysis Router - Otimizador de Rotas
  // ============================================
  route: router({
    analyzeMap: publicProcedure
      .input(z.object({
        imageUrl: z.string().url(),
        name: z.string().default('Análise de Rota'),
        colorLegend: z.record(z.string(), z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: 'system',
                content: `Você é um especialista em análise de mapas e otimização de rotas para a empresa TCF Telecom (provedora de internet fibra óptica).

O SISTEMA DE CORES PADRÃO DA TCF TELECOM É:
- VERMELHO: Urgência máxima — manutenção corretiva, cliente desconectado, falha crítica. PRIORIDADE 1 (executar primeiro)
- ROXO: Pendente — serviço aguardando execução pelo técnico. PRIORIDADE 2
- CINZA: Migração — cliente trocou de plano ou troca de equipamento. PRIORIDADE 3
- AZUL: Instalação nova — não é urgente, mas se ultrapassar o prazo vira prioridade. PRIORIDADE 4
- VERDE: Reservado — visita agendada/reservada. PRIORIDADE 5 (menor urgência)

Analise a imagem do mapa fornecida e:
1. Identifique os pontos marcados e suas cores
2. Aplique o sistema de cores TCF Telecom acima
3. Monte a rota otimizada priorizando pela ordem de prioridade
4. Estime o tempo total de atendimento
5. Dê recomendações práticas para o técnico

Se o usuário fornecer uma legenda personalizada, use ela em vez do padrão acima.

Responda em JSON com o seguinte formato:
{
  "colorMapping": {"vermelho": "Urgência — Cliente Desconectado/Manutenção", "roxo": "Pendente", "cinza": "Migração", "azul": "Instalação Nova", "verde": "Reservado"},
  "points": [
    {"id": "1", "label": "Ponto 1", "color": "vermelho", "priority": 1, "notes": "Cliente desconectado — atender primeiro"}
  ],
  "optimizedRoute": ["1", "2", "3"],
  "routeDescription": "Descrição da rota otimizada",
  "totalPoints": 5,
  "estimatedTime": "2h30min",
  "recommendations": ["Iniciar pelos pontos vermelhos (urgência)", "Agrupar pontos próximos geograficamente"]
}`,
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'image_url',
                    image_url: { url: input.imageUrl, detail: 'high' },
                  },
                  {
                    type: 'text',
                    text: `Analise este mapa de visitas técnicas. ${input.colorLegend ? `Legenda de cores: ${JSON.stringify(input.colorLegend)}` : 'Identifique as cores e prioridades automaticamente.'}`,
                  },
                ],
              },
            ],
            response_format: {
              type: 'json_schema',
              json_schema: {
                name: 'route_analysis',
                strict: true,
                schema: {
                  type: 'object',
                  properties: {
                    colorMapping: { type: 'object', additionalProperties: { type: 'string' } },
                    points: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          label: { type: 'string' },
                          color: { type: 'string' },
                          priority: { type: 'number' },
                          notes: { type: 'string' },
                        },
                        required: ['id', 'label', 'color', 'priority', 'notes'],
                        additionalProperties: false,
                      },
                    },
                    optimizedRoute: { type: 'array', items: { type: 'string' } },
                    routeDescription: { type: 'string' },
                    totalPoints: { type: 'number' },
                    estimatedTime: { type: 'string' },
                    recommendations: { type: 'array', items: { type: 'string' } },
                  },
                  required: ['colorMapping', 'points', 'optimizedRoute', 'routeDescription', 'totalPoints', 'estimatedTime', 'recommendations'],
                  additionalProperties: false,
                },
              },
            },
          });

          const content = response.choices?.[0]?.message?.content;
          const parsed = typeof content === 'string' ? JSON.parse(content) : content;

          // Save to database
          const db = await getDb();
          if (db) {
            await db.insert(routeAnalyses).values({
              name: input.name,
              imageUrl: input.imageUrl,
              colorMapping: parsed.colorMapping,
              points: parsed.points,
              optimizedRoute: parsed.points.filter((p: any) =>
                parsed.optimizedRoute.includes(p.id)
              ).sort((a: any, b: any) => {
                return parsed.optimizedRoute.indexOf(a.id) - parsed.optimizedRoute.indexOf(b.id);
              }),
            });
          }

          return {
            success: true,
            ...parsed,
          };
        } catch (error) {
          console.error('Route analysis error:', error);
          return {
            success: false,
            error: 'Falha ao analisar o mapa. Tente novamente.',
            colorMapping: {},
            points: [],
            optimizedRoute: [],
            routeDescription: '',
            totalPoints: 0,
            estimatedTime: '',
            recommendations: [],
          };
        }
      }),

    getHistory: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      try {
        return await db.select().from(routeAnalyses).orderBy(desc(routeAnalyses.createdAt)).limit(20);
      } catch {
        return [];
      }
    }),

    uploadImage: publicProcedure
      .input(z.object({
        base64: z.string(),
        mimeType: z.string().default('image/png'),
      }))
      .mutation(async ({ input }) => {
        try {
          const buffer = Buffer.from(input.base64, 'base64');
          const key = `route-maps/${nanoid()}.${input.mimeType.split('/')[1] || 'png'}`;
          const { url } = await storagePut(key, buffer, input.mimeType);
          return { success: true, url };
        } catch (error) {
          console.error('Upload error:', error);
          return { success: false, url: '' };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
