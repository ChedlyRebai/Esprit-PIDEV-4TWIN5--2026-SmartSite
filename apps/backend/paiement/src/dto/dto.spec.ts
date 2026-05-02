import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreatePaymentDto } from './create-payment.dto';
import { UpdatePaymentDto } from './update-payment.dto';

describe('DTOs', () => {
  describe('CreatePaymentDto', () => {
    it('should validate a valid payment DTO', async () => {
      const dto = plainToClass(CreatePaymentDto, {
        amount: 1000,
        siteId: '507f1f77bcf86cd799439011',
        description: 'Test payment',
        paymentMethod: 'card',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when amount is missing', async () => {
      const dto = plainToClass(CreatePaymentDto, {
        siteId: '507f1f77bcf86cd799439011',
        description: 'Test payment',
        paymentMethod: 'card',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const amountError = errors.find(e => e.property === 'amount');
      expect(amountError).toBeDefined();
    });

    it('should fail validation when siteId is missing', async () => {
      const dto = plainToClass(CreatePaymentDto, {
        amount: 1000,
        description: 'Test payment',
        paymentMethod: 'card',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const siteIdError = errors.find(e => e.property === 'siteId');
      expect(siteIdError).toBeDefined();
    });

    it('should allow optional fields to be undefined', async () => {
      const dto = plainToClass(CreatePaymentDto, {
        amount: 1000,
        siteId: '507f1f77bcf86cd799439011',
        paymentMethod: 'card',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation for invalid payment method', async () => {
      const dto = plainToClass(CreatePaymentDto, {
        amount: 1000,
        siteId: '507f1f77bcf86cd799439011',
        paymentMethod: 'invalid',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const methodError = errors.find(e => e.property === 'paymentMethod');
      expect(methodError).toBeDefined();
    });
  });

  describe('UpdatePaymentDto', () => {
    it('should validate a valid update DTO', async () => {
      const dto = plainToClass(UpdatePaymentDto, {
        status: 'completed',
        description: 'Updated description',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should allow partial updates', async () => {
      const dto = plainToClass(UpdatePaymentDto, {
        status: 'pending',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should allow empty update DTO', async () => {
      const dto = plainToClass(UpdatePaymentDto, {});

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
