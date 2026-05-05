import { PaymentSchema } from './payment.entity';
import { FactureSchema } from './facture.entity';

describe('Entities Schemas', () => {
  describe('PaymentSchema', () => {
    it('should be defined', () => {
      expect(PaymentSchema).toBeDefined();
    });

    it('should have required paths', () => {
      expect(PaymentSchema.path('siteId')).toBeDefined();
      expect(PaymentSchema.path('amount')).toBeDefined();
      expect(PaymentSchema.path('paymentMethod')).toBeDefined();
      expect(PaymentSchema.path('paymentDate')).toBeDefined();
      expect(PaymentSchema.path('status')).toBeDefined();
    });

    it('should have optional paths', () => {
      expect(PaymentSchema.path('reference')).toBeDefined();
      expect(PaymentSchema.path('description')).toBeDefined();
      expect(PaymentSchema.path('siteBudget')).toBeDefined();
    });

    it('should have status enum values', () => {
      const statusPath = PaymentSchema.path('status') as any;
      expect(statusPath.enumValues).toContain('pending');
      expect(statusPath.enumValues).toContain('completed');
      expect(statusPath.enumValues).toContain('cancelled');
      expect(statusPath.enumValues).toContain('refunded');
      expect(statusPath.enumValues).toContain('paid');
    });

    it('should have timestamps enabled', () => {
      expect((PaymentSchema as any).options.timestamps).toBe(true);
    });

    it('should have correct collection name', () => {
      expect((PaymentSchema as any).options.collection).toBe('payments');
    });
  });

  describe('FactureSchema', () => {
    it('should be defined', () => {
      expect(FactureSchema).toBeDefined();
    });

    it('should have required paths', () => {
      expect(FactureSchema.path('numeroFacture')).toBeDefined();
      expect(FactureSchema.path('paymentId')).toBeDefined();
      expect(FactureSchema.path('siteId')).toBeDefined();
      expect(FactureSchema.path('siteNom')).toBeDefined();
      expect(FactureSchema.path('amount')).toBeDefined();
      expect(FactureSchema.path('paymentMethod')).toBeDefined();
      expect(FactureSchema.path('paymentDate')).toBeDefined();
    });

    it('should have optional paths', () => {
      expect(FactureSchema.path('description')).toBeDefined();
      expect(FactureSchema.path('pdfPath')).toBeDefined();
    });

    it('should have timestamps enabled', () => {
      expect((FactureSchema as any).options.timestamps).toBe(true);
    });

    it('should have correct collection name', () => {
      expect((FactureSchema as any).options.collection).toBe('factures');
    });
  });
});
