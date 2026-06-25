import { z } from 'zod';
import { FuelType, TransmissionType } from '../models/car';
import { MaintenanceType } from '../models/maintenance';

export const CarSchema = z.object({
  vin: z.string().min(1, 'VIN is required'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().int().min(1886).max(new Date().getFullYear() + 2),
  color: z.string().min(1, 'Color is required'),
  licensePlate: z.string().min(1, 'License plate is required'),
  fuel: z.nativeEnum(FuelType),
  transmission: z.nativeEnum(TransmissionType),
  odometer: z.number().int().min(0),
  ownerId: z.string().min(1, 'Owner ID is required'),
  notes: z.string().optional(),
});

export const CarUpdateSchema = CarSchema.partial().omit({ licensePlate: true });

export const MaintenanceRequestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.nativeEnum(MaintenanceType),
  product: z.string().min(1, 'Product is required'),
  odometer: z.number().int().min(0),
  carId: z.string().min(1, 'Car ID is required'),
  ownerId: z.string().min(1, 'Owner ID is required'),
  intervalMonths: z.number().int().min(1).max(60).optional().default(6),
});

export const MaintenanceUpdateSchema = MaintenanceRequestSchema.partial().omit({ name: true });

export const CarOwnerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  notificationPreferences: z.object({
    emailEnabled: z.boolean(),
    daysBeforeReminder: z.array(z.number().int().min(0).max(365)).min(1),
  }).optional(),
});

export const CarOwnerUpdateSchema = CarOwnerSchema.partial();

export const parseBody = <T>(schema: z.ZodSchema<T>, body: string | null): { data: T } | { error: string } => {
  if (!body) {
    return { error: 'Request body cannot be empty' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return { error: 'Invalid JSON in request body' };
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    const messages = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return { error: messages };
  }

  return { data: result.data };
};
