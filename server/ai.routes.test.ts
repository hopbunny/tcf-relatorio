import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

// Mock the LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            colorMapping: { red: "Alta Prioridade", green: "Baixa Prioridade" },
            points: [
              { id: "1", label: "Ponto 1", color: "red", priority: 1, notes: "Urgente" },
              { id: "2", label: "Ponto 2", color: "green", priority: 3, notes: "Normal" },
            ],
            optimizedRoute: ["1", "2"],
            routeDescription: "Iniciar pelos pontos vermelhos",
            totalPoints: 2,
            estimatedTime: "1h30min",
            recommendations: ["Priorizar pontos vermelhos"],
          }),
        },
      },
    ],
  }),
}));

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://example.com/test.png", key: "test.png" }),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("AI Router", () => {
  it("getSuggestions returns empty arrays when DB is unavailable", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.getSuggestions({ serviceType: "Instalação" });

    expect(result).toEqual({
      descriptions: [],
      procedures: [],
      observations: [],
    });
  });

  it("learn returns success false when DB is unavailable", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.learn({
      serviceType: "Manutenção",
      field: "description",
      content: "Substituição de cabo de rede",
    });

    expect(result).toEqual({ success: false });
  });

  it("improveText returns improved text from LLM", async () => {
    const { invokeLLM } = await import("./_core/llm");
    vi.mocked(invokeLLM).mockResolvedValueOnce({
      id: "test",
      created: Date.now(),
      model: "test",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: "Substituição do cabo de rede danificado." },
          finish_reason: "stop",
        },
      ],
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.improveText({
      text: "troquei o cabo",
      type: "procedure",
    });

    expect(result.improved).toBe("Substituição do cabo de rede danificado.");
  });

  it("improveText falls back to original text on LLM error", async () => {
    const { invokeLLM } = await import("./_core/llm");
    vi.mocked(invokeLLM).mockRejectedValueOnce(new Error("LLM unavailable"));

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.improveText({
      text: "texto original",
      type: "description",
    });

    expect(result.improved).toBe("texto original");
  });
});

describe("Route Router", () => {
  it("uploadImage returns success with URL", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.route.uploadImage({
      base64: "dGVzdA==", // "test" in base64
      mimeType: "image/png",
    });

    expect(result.success).toBe(true);
    expect(result.url).toBe("https://example.com/test.png");
  });

  it("getHistory returns empty array when DB is unavailable", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.route.getHistory();

    expect(result).toEqual([]);
  });
});

describe("Auth Router", () => {
  it("me returns null for unauthenticated user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toBeNull();
  });
});
