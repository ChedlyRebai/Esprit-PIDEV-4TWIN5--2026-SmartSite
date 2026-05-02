import { Payment } from './payment.entity';
import { Facture } from './facture.entity';
import { Types } from 'mongoose';

describe('Entities', () => {
  describe('Payment Entity', () => {
    it('should create a payment entity', () => {
      const payment = new Payment();
      payment.amount = 1000;
      payment.siteId = new Types.ObjectId('507f1f77bcf86cd799439011');
      payment.description = 'Test payment';
      payment.paymentMethod = 'card';
      payment.status = 'pending';

      expect(payment).toBeDefined();
      expect(payment.amount).toBe(1000);
      expect(payment.siteId).toBeInstanceOf(Types.ObjectId);
      expect(payment.description).toBe('Test payment');
      expect(payment.paymentMethod).toBe('card');
      expect(payment.status).toBe('pending');
    });

    it('should have default values', () => {
      const payment = new Payment();

      expect(payment.status).toBeUndefined();
      expect(payment.paymentDate).toBeUndefined();
    });
  });

  describe('Facture Entity', () => {
    it('should create a facture entity', () => {
      const facture = new Facture();
      facture.numeroFacture = 'FAC-2024-001';
      facture.paymentId = new Types.ObjectId('507f1f77bcf86cd799439011');
      facture.siteId = new Types.ObjectId('507f1f77bcf86cd799439012');
      facture.siteNom = 'Site A';
      facture.amount = 1000;
      facture.paymentMethod = 'card';

      expect(facture).toBeDefined();
      expect(facture.numeroFacture).toBe('FAC-2024-001');
      expect(facture.paymentId).toBeInstanceOf(Types.ObjectId);
      expect(facture.siteId).toBeInstanceOf(Types.ObjectId);
      expect(facture.siteNom).toBe('Site A');
      expect(facture.amount).toBe(1000);
      expect(facture.paymentMethod).toBe('card');
    });

    it('should have default values', () => {
      const facture = new Facture();

      expect(facture.paymentDate).toBeUndefined();
      expect(facture.numeroFacture).toBeUndefined();
    });
  });
});
