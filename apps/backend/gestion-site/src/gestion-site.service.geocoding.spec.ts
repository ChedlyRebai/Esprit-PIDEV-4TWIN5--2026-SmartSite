import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { BadRequestException, InternalServerErrorException, HttpException, HttpStatus } from '@nestjs/common';
import { GestionSiteService } from '../gestion-site.service';
import { Site } from '../entities/site.entity';
import { Team } from '../entities/team.entity';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

function MockSiteModel(dto: any) {
  return { ...dto, save: jest.fn().mockResolvedValue(dto) };
}
MockSiteModel.findOne = jest.fn();
MockSiteModel.find = jest.fn();
MockSiteModel.findById = jest.fn();
MockSiteModel.findByIdAndUpdate = jest.fn();
MockSiteModel.deleteOne = jest.fn();
MockSiteModel.countDocuments = jest.fn();
MockSiteModel.aggregate = jest.fn();

const MockTeamModel = { find: jest.fn(), findById: jest.fn() };
const MockConnection = { model: jest.fn() };

describe('GestionSiteService - Geocoding', () => {
  let service: GestionSiteService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GestionSiteService,
        { provide: getModelToken(Site.name), useValue: MockSiteModel },
        { provide: getModelToken(Team.name), useValue: MockTeamModel },
        { provide: getConnectionToken(), useValue: MockConnection },
      ],
    }).compile();
    service = module.get<GestionSiteService>(GestionSiteService);
  });

  describe('geocodeAddress', () => {
    it('should return geocoding results for valid address', async () => {
      const mockResponse = {
        data: [
          {
            display_name: 'Avenue Habib Bourguiba, Tunis, Tunisia',
            lat: '36.8065',
            lon: '10.1815',
            address: {
              road: 'Avenue Habib Bourguiba',
              city: 'Tunis',
              country: 'Tunisia',
              country_code: 'tn',
            },
            boundingbox: ['36.8', '36.81', '10.18', '10.19'],
            type: 'road',
            importance: 0.8,
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.geocodeAddress('Avenue Habib Bourguiba, Tunis');
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].lat).toBe(36.8065);
      expect(result.results[0].lng).toBe(10.1815);
    });

    it('should throw BadRequestException for empty address', async () => {
      await expect(service.geocodeAddress('')).rejects.toThrow(BadRequestException);
      await expect(service.geocodeAddress('   ')).rejects.toThrow(BadRequestException);
    });

    it('should return failure when no results found', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });

      const result = await service.geocodeAddress('NonexistentPlace12345');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Aucune adresse trouvée');
    });

    it('should throw HttpException on rate limit (429)', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { status: 429 },
        message: 'Too many requests',
      });

      await expect(service.geocodeAddress('Test Address')).rejects.toThrow(HttpException);
    });

    it('should throw InternalServerErrorException on API error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(service.geocodeAddress('Test Address')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('geocodeAddressAdvanced', () => {
    it('should return advanced geocoding results with Tunisia focus', async () => {
      const mockResponse = {
        data: [
          {
            display_name: 'Rue de la Liberté, Tunis, Tunisia',
            lat: '36.8',
            lon: '10.18',
            address: {
              road: 'Rue de la Liberté',
              city: 'Tunis',
              country: 'Tunisia',
              country_code: 'tn',
              postcode: '1000',
            },
            boundingbox: ['36.79', '36.81', '10.17', '10.19'],
            type: 'road',
            class: 'highway',
            importance: 0.75,
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.geocodeAddressAdvanced('Rue de la Liberté', 'Tunisia', 'Tunis');
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.bestMatch).toBeDefined();
      expect(result.mapCenter).toBeDefined();
      expect(result.mapCenter.lat).toBe(36.8);
      expect(result.mapCenter.lng).toBe(10.18);
      expect(result.mapCenter.zoom).toBe(16);
    });

    it('should throw BadRequestException for empty address', async () => {
      await expect(service.geocodeAddressAdvanced('')).rejects.toThrow(BadRequestException);
    });

    it('should fallback to broader search when no results', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: [] }) // First call returns empty
        .mockResolvedValueOnce({
          // Fallback call returns results
          data: [
            {
              display_name: 'Tunis, Tunisia',
              lat: '36.8',
              lon: '10.18',
              address: { city: 'Tunis', country: 'Tunisia', country_code: 'tn' },
              boundingbox: ['36.7', '36.9', '10.1', '10.3'],
              type: 'city',
              class: 'place',
              importance: 0.9,
            },
          ],
        });

      const result = await service.geocodeAddressAdvanced('Unknown Street');
      expect(result.success).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should return failure with suggestions when no results in fallback', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });

      const result = await service.geocodeAddressAdvanced('CompletelyInvalidAddress12345');
      expect(result.success).toBe(false);
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should calculate confidence score correctly', async () => {
      const mockResponse = {
        data: [
          {
            display_name: 'Test Building, Tunis, Tunisia',
            lat: '36.8',
            lon: '10.18',
            address: { road: 'Test', city: 'Tunis', country: 'Tunisia', country_code: 'tn' },
            boundingbox: ['36.79', '36.81', '10.17', '10.19'],
            type: 'building',
            class: 'building',
            importance: 0.8,
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.geocodeAddressAdvanced('Test Building');
      expect(result.results[0].confidence).toBeGreaterThan(0);
      expect(result.results[0].confidence).toBeLessThanOrEqual(1);
    });

    it('should boost confidence for Tunisia results', async () => {
      const mockTunisiaResult = {
        data: [
          {
            display_name: 'Tunis Address',
            lat: '36.8',
            lon: '10.18',
            address: { city: 'Tunis', country: 'Tunisia', country_code: 'tn' },
            boundingbox: ['36.7', '36.9', '10.1', '10.3'],
            type: 'road',
            class: 'highway',
            importance: 0.5,
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockTunisiaResult);

      const result = await service.geocodeAddressAdvanced('Test');
      expect(result.results[0].address.countryCode).toBe('tn');
      expect(result.results[0].confidence).toBeGreaterThan(0.5);
    });

    it('should include map URL in results', async () => {
      const mockResponse = {
        data: [
          {
            display_name: 'Test Location',
            lat: '36.8',
            lon: '10.18',
            address: {},
            boundingbox: [],
            type: 'place',
            class: 'place',
            importance: 0.5,
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.geocodeAddressAdvanced('Test');
      expect(result.results[0].mapUrl).toContain('openstreetmap.org');
      expect(result.results[0].mapUrl).toContain('mlat=36.8');
      expect(result.results[0].mapUrl).toContain('mlon=10.18');
    });

    it('should sort results by confidence and importance', async () => {
      const mockResponse = {
        data: [
          {
            display_name: 'Low confidence',
            lat: '36.7',
            lon: '10.1',
            address: {},
            boundingbox: [],
            type: 'place',
            class: 'place',
            importance: 0.3,
          },
          {
            display_name: 'High confidence',
            lat: '36.8',
            lon: '10.18',
            address: { country_code: 'tn' },
            boundingbox: [],
            type: 'building',
            class: 'building',
            importance: 0.8,
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.geocodeAddressAdvanced('Test');
      expect(result.results[0].displayName).toBe('High confidence');
      expect(result.bestMatch.displayName).toBe('High confidence');
    });

    it('should throw HttpException on rate limit (429)', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { status: 429 },
        message: 'Too many requests',
      });

      await expect(service.geocodeAddressAdvanced('Test')).rejects.toThrow(HttpException);
    });

    it('should throw InternalServerErrorException on API error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      await expect(service.geocodeAddressAdvanced('Test')).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle results without bounding box', async () => {
      const mockResponse = {
        data: [
          {
            display_name: 'Test',
            lat: '36.8',
            lon: '10.18',
            address: {},
            boundingbox: null,
            type: 'place',
            class: 'place',
            importance: 0.5,
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.geocodeAddressAdvanced('Test');
      expect(result.results[0].boundingBox).toBeNull();
    });

    it('should construct search query with city and country', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });

      await service.geocodeAddressAdvanced('Test Street', 'Tunisia', 'Tunis');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://nominatim.openstreetmap.org/search',
        expect.objectContaining({
          params: expect.objectContaining({
            q: 'Test Street, Tunis, Tunisia',
          }),
        }),
      );
    });

    it('should default to Tunisia when no country specified', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });

      await service.geocodeAddressAdvanced('Test Street');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://nominatim.openstreetmap.org/search',
        expect.objectContaining({
          params: expect.objectContaining({
            q: 'Test Street, Tunisia',
            countrycodes: 'tn',
          }),
        }),
      );
    });
  });
});
