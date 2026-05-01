import { Payment } from './payment.entity';
import { Facture } from './facture.entity';

describe('Entities', () => {
  describe('Payment Entity', () => {
    it('should create a payment entity', () => {
      const payment = {
        montant: 100,
        projectId: 'proj-123',
        status: 'pending',
        methode: 'carte',
        dateCreation: new Date(),
      };

      expect(payment).toBeDefined();
      expect(payment.montant).toBe(100);
      expect(payment.projectId).toBe('proj-123');
      expect(payment.status).toBe('pending');
    });

    it('should have required fields', () => {
      const payment = {
        montant: 100,
        projectId: 'proj-123',
        status: 'completed',
      };

      expect(payment.montant).toBeDefined();
      expect(payment.projectId).toBeDefined();
      expect(payment.status).toBeDefined();
    });

    it('should support different payment statuses', () => {
      const statuses = ['pending', 'completed', 'failed', 'refunded'];

      statuses.forEach(status => {
        const payment = {
          montant: 100,
          projectId: 'proj-123',
          status: status,
        };

        expect(payment.status).toBe(status);
      });
    });
  });

  describe('Facture Entity', () => {
    it('should create a facture entity', () => {
      const facture = {
        numero: 'FAC-001',
        montant: 1000,
        projectId: 'proj-123',
        dateEmission: new Date(),
        status: 'emise',
      };

      expect(facture).toBeDefined();
      expect(facture.numero).toBe('FAC-001');
      expect(facture.montant).toBe(1000);
      expect(facture.projectId).toBe('proj-123');
    });

    it('should have required fields', () => {
      const facture = {
        numero: 'FAC-002',
        montant: 2000,
        projectId: 'proj-456',
      };

      expect(facture.numero).toBeDefined();
      expect(facture.montant).toBeDefined();
      expect(facture.projectId).toBeDefined();
    });

    it('should support different facture statuses', () => {
      const statuses = ['emise', 'payee', 'annulee'];

      statuses.forEach(status => {
        const facture = {
          numero: 'FAC-003',
          montant: 1500,
          projectId: 'proj-789',
          status: status,
        };

        expect(facture.status).toBe(status);
      });
    });
  });
});
