import { z } from 'zod';

// Validation pour création
export const CreateSupplierSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^[0-9]{6}$/, 'Code must be 6 digits'),
  email: z.string().email('Invalid email format').max(100),
  phone: z.string().min(1, 'Phone is required').max(20),
  address: z.string().min(1, 'Address is required').max(200),
});

// Validation pour mise à jour (tous champs optionnels)
export const UpdateSupplierSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^[0-9]{6}$/, 'Code must be 6 digits')
    .optional(),
  email: z.string().email('Invalid email format').max(100).optional(),
  phone: z.string().min(1, 'Phone is required').max(20).optional(),
  address: z.string().min(1, 'Address is required').max(200).optional(),
});

export type CreateSupplierInput = z.infer<typeof CreateSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof UpdateSupplierSchema>;
