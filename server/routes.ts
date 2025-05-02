import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertServiceSchema, insertClientSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autorizado" });
    }
    next();
  };

  // Business routes
  app.get("/api/business", requireAuth, async (req, res) => {
    try {
      const business = await storage.getBusinessByUserId(req.user.id);
      if (!business) {
        return res.status(404).json({ message: "Negócio não encontrado" });
      }
      res.json(business);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar informações do negócio" });
    }
  });

  app.get("/api/business/:slug", async (req, res) => {
    try {
      const business = await storage.getBusinessBySlug(req.params.slug);
      if (!business) {
        return res.status(404).json({ message: "Negócio não encontrado" });
      }
      res.json(business);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar informações do negócio" });
    }
  });

  app.patch("/api/business", requireAuth, async (req, res) => {
    try {
      const business = await storage.getBusinessByUserId(req.user.id);
      if (!business) {
        return res.status(404).json({ message: "Negócio não encontrado" });
      }

      // Check if slug is being changed and is unique
      if (req.body.slug && req.body.slug !== business.slug) {
        const existingBusiness = await storage.getBusinessBySlug(req.body.slug);
        if (existingBusiness) {
          return res.status(400).json({ message: "URL personalizada já está em uso" });
        }
      }

      const updatedBusiness = await storage.updateBusiness(business.id, req.body);
      res.json(updatedBusiness);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar informações do negócio" });
    }
  });

  // Service routes
  app.get("/api/services", requireAuth, async (req, res) => {
    try {
      const business = await storage.getBusinessByUserId(req.user.id);
      if (!business) {
        return res.status(404).json({ message: "Negócio não encontrado" });
      }

      const services = await storage.getServicesByBusinessId(business.id);
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar serviços" });
    }
  });

  app.get("/api/business/:businessId/services", async (req, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      const services = await storage.getServicesByBusinessId(businessId);
      res.json(services.filter(service => service.isActive));
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar serviços" });
    }
  });

  app.post("/api/services", requireAuth, async (req, res) => {
    try {
      const business = await storage.getBusinessByUserId(req.user.id);
      if (!business) {
        return res.status(404).json({ message: "Negócio não encontrado" });
      }

      const validatedData = insertServiceSchema.parse({
        ...req.body,
        businessId: business.id
      });

      const service = await storage.createService(validatedData);
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar serviço" });
    }
  });

  app.patch("/api/services/:id", requireAuth, async (req, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      const service = await storage.getService(serviceId);
      
      if (!service) {
        return res.status(404).json({ message: "Serviço não encontrado" });
      }

      const business = await storage.getBusinessByUserId(req.user.id);
      if (!business || service.businessId !== business.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const updatedService = await storage.updateService(serviceId, req.body);
      res.json(updatedService);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar serviço" });
    }
  });

  app.delete("/api/services/:id", requireAuth, async (req, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      const service = await storage.getService(serviceId);
      
      if (!service) {
        return res.status(404).json({ message: "Serviço não encontrado" });
      }

      const business = await storage.getBusinessByUserId(req.user.id);
      if (!business || service.businessId !== business.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      await storage.deleteService(serviceId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir serviço" });
    }
  });

  // Client routes
  app.get("/api/clients", requireAuth, async (req, res) => {
    try {
      const business = await storage.getBusinessByUserId(req.user.id);
      if (!business) {
        return res.status(404).json({ message: "Negócio não encontrado" });
      }

      const clients = await storage.getClientsByBusinessId(business.id);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar clientes" });
    }
  });

  app.post("/api/clients", requireAuth, async (req, res) => {
    try {
      const business = await storage.getBusinessByUserId(req.user.id);
      if (!business) {
        return res.status(404).json({ message: "Negócio não encontrado" });
      }

      const validatedData = insertClientSchema.parse({
        ...req.body,
        businessId: business.id
      });

      // Check if client with same email already exists for this business
      const existingClient = await storage.getClientByEmailAndBusiness(validatedData.email, business.id);
      if (existingClient) {
        return res.status(400).json({ message: "Cliente com este email já existe" });
      }

      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar cliente" });
    }
  });

  app.patch("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }

      const business = await storage.getBusinessByUserId(req.user.id);
      if (!business || client.businessId !== business.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const updatedClient = await storage.updateClient(clientId, req.body);
      res.json(updatedClient);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar cliente" });
    }
  });

  app.delete("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }

      const business = await storage.getBusinessByUserId(req.user.id);
      if (!business || client.businessId !== business.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      await storage.deleteClient(clientId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir cliente" });
    }
  });

  // Business Hours routes
  app.get("/api/business/:businessId/hours", async (req, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      const hours = await storage.getBusinessHoursByBusinessId(businessId);
      res.json(hours);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar horários" });
    }
  });

  app.get("/api/hours", requireAuth, async (req, res) => {
    try {
      const business = await storage.getBusinessByUserId(req.user.id);
      if (!business) {
        return res.status(404).json({ message: "Negócio não encontrado" });
      }

      const hours = await storage.getBusinessHoursByBusinessId(business.id);
      res.json(hours);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar horários" });
    }
  });

  app.post("/api/hours", requireAuth, async (req, res) => {
    try {
      const business = await storage.getBusinessByUserId(req.user.id);
      if (!business) {
        return res.status(404).json({ message: "Negócio não encontrado" });
      }

      // Validate time format
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(req.body.openTime) || !timeRegex.test(req.body.closeTime)) {
        return res.status(400).json({ message: "Formato de horário inválido. Use HH:MM" });
      }

      const updatedHours = await storage.createOrUpdateBusinessHours({
        businessId: business.id,
        ...req.body
      });
      
      res.status(201).json(updatedHours);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar horários" });
    }
  });

  // Appointment routes
  app.get("/api/appointments", requireAuth, async (req, res) => {
    try {
      const business = await storage.getBusinessByUserId(req.user.id);
      if (!business) {
        return res.status(404).json({ message: "Negócio não encontrado" });
      }

      const filter = req.query.date ? { date: req.query.date as string } : {};
      const appointments = await storage.getAppointmentsByBusinessId(business.id, filter);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar agendamentos" });
    }
  });

  app.get("/api/business/:businessId/appointments", async (req, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      const filter = req.query.date ? { date: req.query.date as string } : {};
      const appointments = await storage.getAppointmentsByBusinessId(businessId, filter);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar agendamentos" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      const { businessId, serviceId, date, time, clientData } = req.body;

      // Validate that business and service exist
      const business = await storage.getBusinessBySlug(req.body.businessSlug) || 
                      (businessId ? await storage.getBusinessBySlug(businessId) : null);
                      
      if (!business) {
        return res.status(404).json({ message: "Negócio não encontrado" });
      }

      const service = await storage.getService(serviceId);
      if (!service || service.businessId !== business.id) {
        return res.status(404).json({ message: "Serviço não encontrado" });
      }

      // Create or get existing client
      let client = await storage.getClientByEmailAndBusiness(clientData.email, business.id);
      
      if (!client) {
        client = await storage.createClient({
          businessId: business.id,
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone
        });
      }

      // Create appointment
      const appointment = await storage.createAppointment({
        businessId: business.id,
        clientId: client.id,
        serviceId: service.id,
        date,
        time,
        notes: clientData.notes,
        status: 'pending',
        isRead: false
      });

      res.status(201).json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar agendamento" });
    }
  });

  app.patch("/api/appointments/:id", requireAuth, async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const appointment = await storage.getAppointment(appointmentId);
      
      if (!appointment) {
        return res.status(404).json({ message: "Agendamento não encontrado" });
      }

      const business = await storage.getBusinessByUserId(req.user.id);
      if (!business || appointment.businessId !== business.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const updatedAppointment = await storage.updateAppointment(appointmentId, req.body);
      res.json(updatedAppointment);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar agendamento" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const business = await storage.getBusinessByUserId(req.user.id);
      if (!business) {
        return res.status(404).json({ message: "Negócio não encontrado" });
      }

      const stats = await storage.getDashboardStats(business.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
