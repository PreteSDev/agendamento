import { db } from "@db";
import { users, businesses, services, clients, appointments, businessHours } from "@shared/schema";
import { eq, and, desc, asc, gte, lte, or, sql } from "drizzle-orm";
import { createHash, randomBytes } from "crypto";
import { format } from "date-fns";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser: (id: number) => Promise<any>;
  getUserByUsername: (username: string) => Promise<any>;
  createUser: (userData: any) => Promise<any>;

  // Business methods
  getBusinessByUserId: (userId: number) => Promise<any>;
  getBusinessBySlug: (slug: string) => Promise<any>;
  createBusiness: (businessData: any) => Promise<any>;
  updateBusiness: (id: number, businessData: any) => Promise<any>;

  // Service methods
  getServicesByBusinessId: (businessId: number) => Promise<any[]>;
  getService: (id: number) => Promise<any>;
  createService: (serviceData: any) => Promise<any>;
  updateService: (id: number, serviceData: any) => Promise<any>;
  deleteService: (id: number) => Promise<void>;

  // Client methods
  getClientsByBusinessId: (businessId: number) => Promise<any[]>;
  getClient: (id: number) => Promise<any>;
  getClientByEmailAndBusiness: (email: string, businessId: number) => Promise<any>;
  createClient: (clientData: any) => Promise<any>;
  updateClient: (id: number, clientData: any) => Promise<any>;
  deleteClient: (id: number) => Promise<void>;

  // Appointment methods
  getAppointmentsByBusinessId: (businessId: number, filter?: any) => Promise<any[]>;
  getAppointment: (id: number) => Promise<any>;
  createAppointment: (appointmentData: any) => Promise<any>;
  updateAppointment: (id: number, appointmentData: any) => Promise<any>;
  deleteAppointment: (id: number) => Promise<void>;

  // Business Hours methods
  getBusinessHoursByBusinessId: (businessId: number) => Promise<any[]>;
  createOrUpdateBusinessHours: (hoursData: any) => Promise<any>;

  // Dashboard methods
  getDashboardStats: (businessId: number) => Promise<any>;

  // Session store
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      },
      createTableIfMissing: true
    });
  }

  // USER METHODS
  async getUser(id: number) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  async getUserByUsername(username: string) {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0] || null;
  }

  async createUser(userData: any) {
    const [newUser] = await db.insert(users).values(userData).returning();
    return newUser;
  }

  // BUSINESS METHODS
  async getBusinessByUserId(userId: number) {
    const result = await db.select().from(businesses).where(eq(businesses.userId, userId)).limit(1);
    
    if (result[0]) {
      const result2 = await db.query.appointments.findMany({
        where: and(
          eq(appointments.businessId, result[0].id),
          eq(appointments.isRead, false),
          eq(appointments.status, 'pending')
        ),
        with: {
          client: true,
          service: true
        },
        orderBy: [desc(appointments.createdAt)],
        limit: 5
      });
      
      const unreadCount = await db.select({ count: sql<number>`count(*)` })
        .from(appointments)
        .where(and(
          eq(appointments.businessId, result[0].id),
          eq(appointments.isRead, false),
          eq(appointments.status, 'pending')
        ));
  
      return {
        ...result[0],
        recentAppointments: result2,
        unreadAppointments: unreadCount[0]?.count || 0
      };
    }
    
    return null;
  }

  async getBusinessBySlug(slug: string) {
    const result = await db.select().from(businesses).where(eq(businesses.slug, slug)).limit(1);
    return result[0] || null;
  }

  async createBusiness(businessData: any) {
    const [newBusiness] = await db.insert(businesses).values(businessData).returning();
    
    // Create default business hours
    const days = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
    const hoursData = days.map(day => ({
      businessId: newBusiness.id,
      dayOfWeek: day,
      isOpen: day !== 'domingo', // Closed on Sundays by default
      openTime: '09:00',
      closeTime: '18:00'
    }));
    
    await db.insert(businessHours).values(hoursData);
    
    return newBusiness;
  }

  async updateBusiness(id: number, businessData: any) {
    const [updatedBusiness] = await db.update(businesses)
      .set({ ...businessData, updatedAt: new Date() })
      .where(eq(businesses.id, id))
      .returning();
    return updatedBusiness;
  }

  // SERVICE METHODS
  async getServicesByBusinessId(businessId: number) {
    return db.select().from(services)
      .where(eq(services.businessId, businessId))
      .orderBy(asc(services.name));
  }

  async getService(id: number) {
    const result = await db.select().from(services).where(eq(services.id, id)).limit(1);
    return result[0] || null;
  }

  async createService(serviceData: any) {
    const [newService] = await db.insert(services).values(serviceData).returning();
    return newService;
  }

  async updateService(id: number, serviceData: any) {
    const [updatedService] = await db.update(services)
      .set({ ...serviceData, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }

  async deleteService(id: number) {
    await db.delete(services).where(eq(services.id, id));
  }

  // CLIENT METHODS
  async getClientsByBusinessId(businessId: number) {
    return db.select().from(clients)
      .where(eq(clients.businessId, businessId))
      .orderBy(asc(clients.name));
  }

  async getClient(id: number) {
    const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
    return result[0] || null;
  }

  async getClientByEmailAndBusiness(email: string, businessId: number) {
    const result = await db.select().from(clients)
      .where(and(
        eq(clients.email, email),
        eq(clients.businessId, businessId)
      ))
      .limit(1);
    return result[0] || null;
  }

  async createClient(clientData: any) {
    const [newClient] = await db.insert(clients).values(clientData).returning();
    return newClient;
  }

  async updateClient(id: number, clientData: any) {
    const [updatedClient] = await db.update(clients)
      .set({ ...clientData, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }

  async deleteClient(id: number) {
    await db.delete(clients).where(eq(clients.id, id));
  }

  // APPOINTMENT METHODS
  async getAppointmentsByBusinessId(businessId: number, filter: any = {}) {
    let query = db.query.appointments.findMany({
      where: eq(appointments.businessId, businessId),
      with: {
        client: true,
        service: true
      },
      orderBy: [desc(appointments.date), asc(appointments.time)]
    });

    if (filter.date) {
      query = db.query.appointments.findMany({
        where: and(
          eq(appointments.businessId, businessId),
          eq(appointments.date, filter.date)
        ),
        with: {
          client: true,
          service: true
        },
        orderBy: [asc(appointments.time)]
      });
    }

    return query;
  }

  async getAppointment(id: number) {
    const result = await db.query.appointments.findFirst({
      where: eq(appointments.id, id),
      with: {
        client: true,
        service: true
      }
    });
    return result;
  }

  async createAppointment(appointmentData: any) {
    const [newAppointment] = await db.insert(appointments).values(appointmentData).returning();
    
    // Increment unread appointments counter
    await db.update(businesses)
      .set({ 
        unreadAppointments: sql`${businesses.unreadAppointments} + 1`,
        updatedAt: new Date()
      })
      .where(eq(businesses.id, appointmentData.businessId));
      
    return newAppointment;
  }

  async updateAppointment(id: number, appointmentData: any) {
    const [updatedAppointment] = await db.update(appointments)
      .set({ ...appointmentData, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    
    // If marking as read, decrement unread counter
    if (appointmentData.isRead === true) {
      const appointment = await this.getAppointment(id);
      await db.update(businesses)
        .set({ 
          unreadAppointments: sql`GREATEST(${businesses.unreadAppointments} - 1, 0)`,
          updatedAt: new Date()
        })
        .where(eq(businesses.id, appointment.businessId));
    }
    
    return updatedAppointment;
  }

  async deleteAppointment(id: number) {
    await db.delete(appointments).where(eq(appointments.id, id));
  }

  // BUSINESS HOURS METHODS
  async getBusinessHoursByBusinessId(businessId: number) {
    return db.select().from(businessHours)
      .where(eq(businessHours.businessId, businessId))
      .orderBy(asc(businessHours.id));
  }

  async createOrUpdateBusinessHours(hoursData: any) {
    const { businessId, dayOfWeek } = hoursData;
    
    // Check if record exists
    const existingHours = await db.select().from(businessHours)
      .where(and(
        eq(businessHours.businessId, businessId),
        eq(businessHours.dayOfWeek, dayOfWeek)
      ))
      .limit(1);
    
    if (existingHours.length > 0) {
      // Update
      const [updatedHours] = await db.update(businessHours)
        .set({ ...hoursData, updatedAt: new Date() })
        .where(and(
          eq(businessHours.businessId, businessId),
          eq(businessHours.dayOfWeek, dayOfWeek)
        ))
        .returning();
      return updatedHours;
    } else {
      // Insert
      const [newHours] = await db.insert(businessHours).values(hoursData).returning();
      return newHours;
    }
  }

  // DASHBOARD METHODS
  async getDashboardStats(businessId: number) {
    // Today's appointments
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayAppointments = await db.select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(and(
        eq(appointments.businessId, businessId),
        eq(appointments.date, today),
        or(
          eq(appointments.status, 'pending'),
          eq(appointments.status, 'confirmed')
        )
      ));
    
    // New clients in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newClients = await db.select({ count: sql<number>`count(*)` })
      .from(clients)
      .where(and(
        eq(clients.businessId, businessId),
        gte(clients.createdAt, thirtyDaysAgo)
      ));
    
    // Previous 30 days clients for percent change
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const prevPeriodClients = await db.select({ count: sql<number>`count(*)` })
      .from(clients)
      .where(and(
        eq(clients.businessId, businessId),
        gte(clients.createdAt, sixtyDaysAgo),
        lte(clients.createdAt, thirtyDaysAgo)
      ));
    
    // Total services
    const totalServices = await db.select({ count: sql<number>`count(*)` })
      .from(services)
      .where(and(
        eq(services.businessId, businessId),
        eq(services.isActive, true)
      ));
    
    // Weekly revenue
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoFormatted = format(sevenDaysAgo, 'yyyy-MM-dd');
    
    const weeklyAppointments = await db.query.appointments.findMany({
      where: and(
        eq(appointments.businessId, businessId),
        gte(appointments.date, sevenDaysAgoFormatted),
        eq(appointments.status, 'completed')
      ),
      with: {
        service: true
      }
    });
    
    const weeklyRevenue = weeklyAppointments.reduce((sum, appointment) => 
      sum + parseFloat(appointment.service.price.toString()), 0);
    
    // Previous week revenue for percent change
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const fourteenDaysAgoFormatted = format(fourteenDaysAgo, 'yyyy-MM-dd');
    
    const prevWeekAppointments = await db.query.appointments.findMany({
      where: and(
        eq(appointments.businessId, businessId),
        gte(appointments.date, fourteenDaysAgoFormatted),
        lte(appointments.date, sevenDaysAgoFormatted),
        eq(appointments.status, 'completed')
      ),
      with: {
        service: true
      }
    });
    
    const prevWeekRevenue = prevWeekAppointments.reduce((sum, appointment) => 
      sum + parseFloat(appointment.service.price.toString()), 0);
    
    // Calculate percent changes
    const clientsPercentChange = prevPeriodClients[0]?.count 
      ? Math.round(((newClients[0]?.count - prevPeriodClients[0]?.count) / prevPeriodClients[0]?.count) * 100) 
      : 0;
    
    const revenuePercentChange = prevWeekRevenue 
      ? Math.round(((weeklyRevenue - prevWeekRevenue) / prevWeekRevenue) * 100) 
      : 0;
    
    return {
      todayAppointments: todayAppointments[0]?.count || 0,
      newClients: newClients[0]?.count || 0,
      totalServices: totalServices[0]?.count || 0,
      weeklyRevenue,
      percentChange: {
        clients: clientsPercentChange,
        revenue: revenuePercentChange
      }
    };
  }
}

export const storage = new DatabaseStorage();
