import { Test, TestingModule } from '@nestjs/testing';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';

describe('StripeController', () => {
  let controller: StripeController;
  let stripeService: StripeService;

  const mockStripeService = {
    createPaymentIntent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StripeController],
      providers: [
        {
          provide: StripeService,
          useValue: mockStripeService,
        },
      ],
    }).compile();

    controller = module.get<StripeController>(StripeController);
    stripeService = module.get<StripeService>(StripeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent with all parameters', async () => {
      const mockResult = {
        clientSecret: 'pi_test_secret',
        paymentIntentId: 'pi_test_123',
      };

      mockStripeService.createPaymentIntent.mockResolvedValue(mockResult);

      const dto = {
        amount: 100,
        currency: 'eur',
        description: 'Test payment',
      };

      const result = await controller.createPaymentIntent(dto);

      expect(stripeService.createPaymentIntent).toHaveBeenCalledWith(
        100,
        'eur',
        'Test payment',
      );
      expect(result).toEqual(mockResult);
    });

    it('should use default currency if not provided', async () => {
      const mockResult = {
        clientSecret: 'pi_test_secret_2',
        paymentIntentId: 'pi_test_456',
      };

      mockStripeService.createPaymentIntent.mockResolvedValue(mockResult);

      const dto = {
        amount: 50,
      };

      const result = await controller.createPaymentIntent(dto);

      expect(stripeService.createPaymentIntent).toHaveBeenCalledWith(
        50,
        'eur',
        '',
      );
      expect(result).toEqual(mockResult);
    });

    it('should use empty description if not provided', async () => {
      const mockResult = {
        clientSecret: 'pi_test_secret_3',
        paymentIntentId: 'pi_test_789',
      };

      mockStripeService.createPaymentIntent.mockResolvedValue(mockResult);

      const dto = {
        amount: 75,
        currency: 'usd',
      };

      const result = await controller.createPaymentIntent(dto);

      expect(stripeService.createPaymentIntent).toHaveBeenCalledWith(
        75,
        'usd',
        '',
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle service errors', async () => {
      mockStripeService.createPaymentIntent.mockRejectedValue(
        new Error('Service error'),
      );

      const dto = {
        amount: 100,
        currency: 'eur',
        description: 'Error test',
      };

      await expect(controller.createPaymentIntent(dto)).rejects.toThrow(
        'Service error',
      );
    });
  });
});
