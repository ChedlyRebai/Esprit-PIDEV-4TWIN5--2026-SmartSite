import { Test, TestingModule } from '@nestjs/testing';
import { IncidentEventsService, IncidentEventListener } from './incidents-events.service';

const mockIncident = { _id: 'inc-1', title: 'Test', status: 'open' };

describe('IncidentEventsService', () => {
  let service: IncidentEventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IncidentEventsService],
    }).compile();

    service = module.get<IncidentEventsService>(IncidentEventsService);
  });

  const createMockListener = (): IncidentEventListener => ({
    onIncidentAssigned: jest.fn(),
    onIncidentUpdated: jest.fn(),
    onIncidentBroadcast: jest.fn(),
  });

  describe('registerListener / unregisterListener', () => {
    it('enregistre un listener', () => {
      const listener = createMockListener();
      service.registerListener(listener);
      service.notifyIncidentAssigned('CIN123', mockIncident);
      expect(listener.onIncidentAssigned).toHaveBeenCalledWith('CIN123', mockIncident);
    });

    it('désenregistre un listener', () => {
      const listener = createMockListener();
      service.registerListener(listener);
      service.unregisterListener(listener);
      service.notifyIncidentAssigned('CIN123', mockIncident);
      expect(listener.onIncidentAssigned).not.toHaveBeenCalled();
    });

    it('gère plusieurs listeners', () => {
      const l1 = createMockListener();
      const l2 = createMockListener();
      service.registerListener(l1);
      service.registerListener(l2);
      service.broadcastIncidentUpdate(mockIncident, 'created');
      expect(l1.onIncidentBroadcast).toHaveBeenCalledWith(mockIncident, 'created');
      expect(l2.onIncidentBroadcast).toHaveBeenCalledWith(mockIncident, 'created');
    });
  });

  describe('notifyIncidentAssigned', () => {
    it('appelle onIncidentAssigned sur tous les listeners', () => {
      const listener = createMockListener();
      service.registerListener(listener);
      service.notifyIncidentAssigned('CIN456', mockIncident);
      expect(listener.onIncidentAssigned).toHaveBeenCalledWith('CIN456', mockIncident);
    });

    it('ne plante pas si aucun listener', () => {
      expect(() => service.notifyIncidentAssigned('CIN123', mockIncident)).not.toThrow();
    });

    it('continue si un listener lève une erreur', () => {
      const badListener = createMockListener();
      (badListener.onIncidentAssigned as jest.Mock).mockImplementation(() => {
        throw new Error('listener error');
      });
      const goodListener = createMockListener();
      service.registerListener(badListener);
      service.registerListener(goodListener);
      expect(() => service.notifyIncidentAssigned('CIN123', mockIncident)).not.toThrow();
      expect(goodListener.onIncidentAssigned).toHaveBeenCalled();
    });
  });

  describe('notifyIncidentUpdated', () => {
    it('appelle onIncidentUpdated sur tous les listeners', () => {
      const listener = createMockListener();
      service.registerListener(listener);
      service.notifyIncidentUpdated('CIN789', mockIncident, 'resolved');
      expect(listener.onIncidentUpdated).toHaveBeenCalledWith('CIN789', mockIncident, 'resolved');
    });

    it('continue si un listener lève une erreur', () => {
      const badListener = createMockListener();
      (badListener.onIncidentUpdated as jest.Mock).mockImplementation(() => {
        throw new Error('error');
      });
      const goodListener = createMockListener();
      service.registerListener(badListener);
      service.registerListener(goodListener);
      expect(() => service.notifyIncidentUpdated('CIN', mockIncident, 'updated')).not.toThrow();
      expect(goodListener.onIncidentUpdated).toHaveBeenCalled();
    });
  });

  describe('broadcastIncidentUpdate', () => {
    it('appelle onIncidentBroadcast sur tous les listeners', () => {
      const listener = createMockListener();
      service.registerListener(listener);
      service.broadcastIncidentUpdate(mockIncident, 'updated');
      expect(listener.onIncidentBroadcast).toHaveBeenCalledWith(mockIncident, 'updated');
    });

    it('ne plante pas si aucun listener', () => {
      expect(() => service.broadcastIncidentUpdate(mockIncident, 'created')).not.toThrow();
    });

    it('continue si un listener lève une erreur', () => {
      const badListener = createMockListener();
      (badListener.onIncidentBroadcast as jest.Mock).mockImplementation(() => {
        throw new Error('error');
      });
      const goodListener = createMockListener();
      service.registerListener(badListener);
      service.registerListener(goodListener);
      expect(() => service.broadcastIncidentUpdate(mockIncident, 'created')).not.toThrow();
      expect(goodListener.onIncidentBroadcast).toHaveBeenCalled();
    });
  });
});
