import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { StripeService } from './stripe.service';

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn(),
    },
  }));
});

describe('StripeService', () => {
  let service: StripeService;
  let configService: ConfigService;
  let mockStripe: any;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('sk_test_mock_key'),
          },
        },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);
    configService = module.get<ConfigService>(ConfigService);
    
    // Get the mocked Stripe instance
    mockStripe = (service as any).stripe;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should throw error if STRIPE_SECRET_KEY is not set', () => {
      const mockConfigService = {
        get: jest.fn().mockReturnValue(undefined),
      };

      expect(() => {
        new StripeService(mockConfigService as any);
      }).toThrow('STRIPE_SECRET_KEY environment variable is not set');
    });

    it('should initialize Stripe with secret key', () => {
      expect(configService.get).toHaveBeenCalledWith('STRIPE_SECRET_KEY');
      expect(mockStripe).toBeDefined();
    });
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret_abc',
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const result = await service.createPaymentIntent(100, 'eur', 'Test payment');

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 10000, // 100 EUR = 10000 cents
        currency: 'eur',
        description: 'Test payment',
      });

      expect(result).toEqual({
        clientSecret: 'pi_test_123_secret_abc',
        paymentIntentId: 'pi_test_123',
      });
    });

    it('should use default currency (eur) if not provided', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_456',
        client_secret: 'pi_test_456_secret_xyz',
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      await service.createPaymentIntent(50);

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 5000,
        currency: 'eur',
        description: '',
      });
    });

    it('should use empty description if not provided', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_789',
        client_secret: 'pi_test_789_secret_def',
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      await service.createPaymentIntent(25, 'usd');

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 2500,
        currency: 'usd',
        description: '',
      });
    });

    it('should throw BadRequestException if amount is 0', async () => {
      await expect(service.createPaymentIntent(0)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createPaymentIntent(0)).rejects.toThrow(
        'Amount must be greater than 0',
      );
    });

    it('should throw BadRequestException if amount is negative', async () => {
      await expect(service.createPaymentIntent(-10)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createPaymentIntent(-10)).rejects.toThrow(
        'Amount must be greater than 0',
      );
    });

    it('should convert decimal amounts to cents correctly', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_decimal',
        client_secret: 'pi_test_decimal_secret',
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      await service.createPaymentIntent(99.99, 'eur', 'Decimal test');

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 9999, // 99.99 EUR = 9999 cents
        currency: 'eur',
        description: 'Decimal test',
      });
    });

    it('should handle Stripe API errors', async () => {
      mockStripe.paymentIntents.create.mockRejectedValue(
        new Error('Stripe API error'),
      );

      await expect(
        service.createPaymentIntent(100, 'eur', 'Error test'),
      ).rejects.toThrow('Stripe API error');
    });
  });
});
