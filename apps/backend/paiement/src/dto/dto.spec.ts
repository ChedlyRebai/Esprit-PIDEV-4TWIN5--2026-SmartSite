import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreatePaymentDto } from './create-payment.dto';
import { CreateFactureDto } from './create-facture.dto';

describe('DTOs Validation', () => {
  describe('CreatePaymentDto', () => {
    it('should validate a valid payment DTO', async () => {
      const dto = plainToInstance(CreatePaymentDto, {
        montant: 100,
        projectId: 'proj-123',
        status: 'pending',
        methode: 'carte',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation with negative montant', async () => {
      const dto = plainToInstance(CreatePaymentDto, {
        montant: -100,
        projectId: 'proj-123',
        status: 'pending',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation without required fields', async () => {
      const dto = plainToInstance(CreatePaymentDto, {});

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('CreateFactureDto', () => {
    it('should validate a valid facture DTO', async () => {
      const dto = plainToInstance(CreateFactureDto, {
        numero: 'FAC-001',
        montant: 1000,
        projectId: 'proj-123',
        dateEmission: new Date(),
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation with invalid numero format', async () => {
      const dto = plainToInstance(CreateFactureDto, {
        numero: '',
        montant: 1000,
        projectId: 'proj-123',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation with negative montant', async () => {
      const dto = plainToInstance(CreateFactureDto, {
        numero: 'FAC-001',
        montant: -1000,
        projectId: 'proj-123',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
