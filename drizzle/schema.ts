import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Tabela de técnicos (relatórios diários)
export const technicians = mysqlTable("technicians", {
  id: int("id").autoincrement().primaryKey(),
  technicianName: varchar("technicianName", { length: 255 }).notNull(),
  responsibleName: varchar("responsibleName", { length: 255 }).notNull(),
  date: varchar("date", { length: 20 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Technician = typeof technicians.$inferSelect;
export type InsertTechnician = typeof technicians.$inferInsert;

// Tabela de serviços por técnico
export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  technicianId: int("technicianId").notNull(),
  clientCode: varchar("clientCode", { length: 100 }).notNull(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  serviceType: varchar("serviceType", { length: 100 }).notNull(),
  description: text("description").notNull().default(""),
  procedures: json("procedures").$type<string[]>(),
  analysis: text("analysis"),
  observations: json("observations").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

// Tabela de aprendizado da IA (histórico de preenchimentos)
export const aiLearning = mysqlTable("ai_learning", {
  id: int("id").autoincrement().primaryKey(),
  serviceType: varchar("serviceType", { length: 100 }).notNull(),
  field: varchar("field", { length: 50 }).notNull(), // 'description', 'procedure', 'observation'
  content: text("content").notNull(),
  usageCount: int("usageCount").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AiLearning = typeof aiLearning.$inferSelect;
export type InsertAiLearning = typeof aiLearning.$inferInsert;

// Tabela de análises de mapas e rotas
export const routeAnalyses = mysqlTable("route_analyses", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  imageUrl: text("imageUrl").notNull(),
  colorMapping: json("colorMapping").$type<Record<string, string>>(),
  points: json("points").$type<RoutePoint[]>(),
  optimizedRoute: json("optimizedRoute").$type<RoutePoint[]>(),
  routeImageUrl: text("routeImageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RouteAnalysis = typeof routeAnalyses.$inferSelect;
export type InsertRouteAnalysis = typeof routeAnalyses.$inferInsert;

export interface RoutePoint {
  id: string;
  label: string;
  color: string;
  priority: number;
  address?: string;
  notes?: string;
  x?: number;
  y?: number;
}
