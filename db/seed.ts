import { db } from "./index";
import * as schema from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  try {
    console.log("Starting seed...");

    // Check if admin user exists
    const existingUsers = await db.select().from(schema.users).where(({ eq }) => eq(schema.users.username, "admin"));

    if (existingUsers.length === 0) {
      console.log("Creating admin user...");
      // Create admin user
      const [adminUser] = await db.insert(schema.users).values({
        username: "admin",
        password: await hashPassword("123456"),
      }).returning();

      console.log("Creating sample business...");
      // Create a sample business
      const [salonBusiness] = await db.insert(schema.businesses).values({
        userId: adminUser.id,
        name: "Salão Beleza Total",
        description: "Salão de beleza completo com os melhores profissionais",
        type: "salon",
        slug: "belezatotal",
        phone: "(11) 99999-9999",
        email: "contato@belezatotal.com.br",
        address: "Av. Paulista, 1000 - São Paulo, SP",
      }).returning();

      console.log("Creating business hours...");
      // Create business hours
      const days = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
      
      for (const day of days) {
        await db.insert(schema.businessHours).values({
          businessId: salonBusiness.id,
          dayOfWeek: day,
          isOpen: day !== 'domingo', // Closed on Sundays
          openTime: '09:00',
          closeTime: '18:00',
        });
      }

      console.log("Creating services...");
      // Create services
      const services = [
        {
          businessId: salonBusiness.id,
          name: "Corte de Cabelo Feminino",
          description: "Corte moderno e personalizado",
          duration: 45,
          price: 80.00,
        },
        {
          businessId: salonBusiness.id,
          name: "Coloração",
          description: "Tintura profissional com produtos de qualidade",
          duration: 120,
          price: 180.00,
        },
        {
          businessId: salonBusiness.id,
          name: "Escova",
          description: "Escova modeladora para todos os tipos de cabelo",
          duration: 60,
          price: 65.00,
        },
        {
          businessId: salonBusiness.id,
          name: "Corte de Cabelo Masculino",
          description: "Corte moderno para homens",
          duration: 30,
          price: 50.00,
        },
        {
          businessId: salonBusiness.id,
          name: "Barba",
          description: "Modelagem e hidratação da barba",
          duration: 20,
          price: 35.00,
        },
      ];

      for (const service of services) {
        await db.insert(schema.services).values(service);
      }

      console.log("Creating clients...");
      // Create clients
      const clients = [
        {
          businessId: salonBusiness.id,
          name: "Ana Silva",
          email: "ana.silva@exemplo.com",
          phone: "(11) 98765-4321",
        },
        {
          businessId: salonBusiness.id,
          name: "João Pereira",
          email: "joao.pereira@exemplo.com",
          phone: "(11) 91234-5678",
        },
        {
          businessId: salonBusiness.id,
          name: "Mariana Santos",
          email: "mariana.santos@exemplo.com",
          phone: "(11) 99876-5432",
        },
        {
          businessId: salonBusiness.id,
          name: "Carlos Oliveira",
          email: "carlos.oliveira@exemplo.com",
          phone: "(11) 95555-1234",
        },
        {
          businessId: salonBusiness.id,
          name: "Paula Rodrigues",
          email: "paula.rodrigues@exemplo.com",
          phone: "(11) 92222-3333",
        },
      ];

      const createdClients = [];
      for (const client of clients) {
        const [createdClient] = await db.insert(schema.clients).values(client).returning();
        createdClients.push(createdClient);
      }

      console.log("Creating appointments...");
      // Create some appointments
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const dayAfterTomorrow = new Date(today);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

      const todayStr = today.toISOString().split('T')[0];
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];

      const appointments = [
        {
          businessId: salonBusiness.id,
          clientId: createdClients[0].id,
          serviceId: 1, // Corte de Cabelo Feminino
          date: todayStr,
          time: "10:00",
          status: "confirmed",
        },
        {
          businessId: salonBusiness.id,
          clientId: createdClients[1].id,
          serviceId: 3, // Escova
          date: todayStr,
          time: "14:30",
          status: "pending",
        },
        {
          businessId: salonBusiness.id,
          clientId: createdClients[2].id,
          serviceId: 1, // Corte de Cabelo Feminino
          date: tomorrowStr,
          time: "11:00",
          status: "pending",
        },
        {
          businessId: salonBusiness.id,
          clientId: createdClients[3].id,
          serviceId: 5, // Barba
          date: tomorrowStr,
          time: "9:00",
          status: "pending",
        },
        {
          businessId: salonBusiness.id,
          clientId: createdClients[4].id,
          serviceId: 1, // Corte de Cabelo Feminino
          date: tomorrowStr,
          time: "11:30",
          status: "pending",
        },
        {
          businessId: salonBusiness.id,
          clientId: createdClients[1].id,
          serviceId: 2, // Coloração
          date: dayAfterTomorrowStr,
          time: "15:00",
          status: "pending",
        },
      ];

      for (const appointment of appointments) {
        await db.insert(schema.appointments).values(appointment);
      }

      // Update unread appointments count
      const unreadCount = appointments.filter(a => a.status === "pending").length;
      await db.update(schema.businesses)
        .set({ unreadAppointments: unreadCount })
        .where(({ eq }) => eq(schema.businesses.id, salonBusiness.id));

      console.log("Seed completed successfully");
    } else {
      console.log("Admin user already exists, skipping seed");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
