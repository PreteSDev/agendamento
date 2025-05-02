import { pgTable, text, serial, integer, boolean, timestamp, decimal, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users, {
  username: (schema) => schema.min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  password: (schema) => schema.min(6, "Senha deve ter pelo menos 6 caracteres")
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Business table - for salons, repair shops, etc.
export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull().default("salon"), // salon, repair_shop, etc.
  slug: text("slug").notNull().unique(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  logo: text("logo"), // URL to logo
  isActive: boolean("is_active").notNull().default(true),
  unreadAppointments: integer("unread_appointments").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBusinessSchema = createInsertSchema(businesses, {
  name: (schema) => schema.min(2, "Nome do negócio deve ter pelo menos 2 caracteres"),
  slug: (schema) => schema.min(3, "URL personalizada deve ter pelo menos 3 caracteres").regex(/^[a-z0-9-]+$/, "URL personalizada deve conter apenas letras minúsculas, números e hífens")
});

export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businesses.$inferSelect;

// Services table
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").notNull(), // in minutes
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertServiceSchema = createInsertSchema(services, {
  name: (schema) => schema.min(3, "Nome do serviço deve ter pelo menos 3 caracteres"),
  duration: (schema) => schema.min(5, "Duração mínima de 5 minutos"),
  price: (schema) => schema.min(0, "Preço não pode ser negativo")
});

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

// Business Hours table
export const businessHours = pgTable("business_hours", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  dayOfWeek: text("day_of_week").notNull(), // Monday, Tuesday, etc.
  isOpen: boolean("is_open").notNull().default(true),
  openTime: text("open_time").notNull().default("09:00"), // 24h format
  closeTime: text("close_time").notNull().default("18:00"), // 24h format
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    businessDayIndex: uniqueIndex("business_day_idx").on(table.businessId, table.dayOfWeek),
  };
});

export const insertBusinessHoursSchema = createInsertSchema(businessHours);
export type InsertBusinessHours = z.infer<typeof insertBusinessHoursSchema>;
export type BusinessHours = typeof businessHours.$inferSelect;

// Clients table
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    businessEmailIndex: uniqueIndex("business_email_idx").on(table.businessId, table.email),
  };
});

export const insertClientSchema = createInsertSchema(clients, {
  name: (schema) => schema.min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: (schema) => schema.email("Email inválido"),
  phone: (schema) => schema.min(10, "Telefone deve ter pelo menos 10 dígitos"),
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// Appointments table
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  serviceId: integer("service_id").references(() => services.id).notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  time: text("time").notNull(), // HH:MM
  status: text("status").notNull().default("pending"), // pending, confirmed, completed, cancelled
  notes: text("notes"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAppointmentSchema = createInsertSchema(appointments);
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  business: one(businesses, {
    fields: [users.id],
    references: [businesses.userId],
  }),
}));

export const businessesRelations = relations(businesses, ({ many }) => ({
  services: many(services),
  businessHours: many(businessHours),
  clients: many(clients),
  appointments: many(appointments),
}));

export const servicesRelations = relations(services, ({ one }) => ({
  business: one(businesses, {
    fields: [services.businessId],
    references: [businesses.id],
  }),
}));

export const businessHoursRelations = relations(businessHours, ({ one }) => ({
  business: one(businesses, {
    fields: [businessHours.businessId],
    references: [businesses.id],
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  business: one(businesses, {
    fields: [clients.businessId],
    references: [businesses.id],
  }),
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  business: one(businesses, {
    fields: [appointments.businessId],
    references: [businesses.id],
  }),
  client: one(clients, {
    fields: [appointments.clientId],
    references: [clients.id],
  }),
  service: one(services, {
    fields: [appointments.serviceId],
    references: [services.id],
  }),
}));

// Custom types for joined queries
export type AppointmentWithClientAndService = Appointment & {
  client: Client;
  service: Service;
};

export type BusinessWithAppointments = Business & {
  recentAppointments?: AppointmentWithClientAndService[];
  unreadAppointments?: number;
};
