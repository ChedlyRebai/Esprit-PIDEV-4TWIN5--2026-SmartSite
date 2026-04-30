import { validate } from 'class-validator';
import { CreateSiteDto, UpdateSiteDto } from '../dto/create-site.dto';

describe('CreateSiteDto', () => {
  it('should validate a valid DTO', async () => {
    const dto = new CreateSiteDto();
    dto.nom = 'Chantier Test';
    dto.adresse = '123 Rue Test';
    dto.localisation = 'Tunis';
    dto.budget = 100000;
    dto.isActif = true; // Explicitly set

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail when nom is empty', async () => {
    const dto = new CreateSiteDto();
    dto.nom = '';
    dto.adresse = '123 Rue Test';
    dto.localisation = 'Tunis';
    dto.budget = 100000;

    const errors = await validate(dto);
    expect(errors.some(e => e.property === 'nom')).toBe(true);
  });

  it('should fail when budget is negative', async () => {
    const dto = new CreateSiteDto();
    dto.nom = 'Test';
    dto.adresse = '123 Rue Test';
    dto.localisation = 'Tunis';
    dto.budget = -100;

    const errors = await validate(dto);
    expect(errors.some(e => e.property === 'budget')).toBe(true);
  });

  it('should fail when progress exceeds 100', async () => {
    const dto = new CreateSiteDto();
    dto.nom = 'Test';
    dto.adresse = '123 Rue Test';
    dto.localisation = 'Tunis';
    dto.budget = 100000;
    dto.progress = 150;

    const errors = await validate(dto);
    expect(errors.some(e => e.property === 'progress')).toBe(true);
  });

  it('should accept valid status enum values', async () => {
    const dto = new CreateSiteDto();
    dto.nom = 'Test';
    dto.adresse = '123 Rue Test';
    dto.localisation = 'Tunis';
    dto.budget = 100000;
    dto.status = 'in_progress';

    const errors = await validate(dto);
    expect(errors.filter(e => e.property === 'status').length).toBe(0);
  });

  it('should fail with invalid status enum value', async () => {
    const dto = new CreateSiteDto();
    dto.nom = 'Test';
    dto.adresse = '123 Rue Test';
    dto.localisation = 'Tunis';
    dto.budget = 100000;
    dto.status = 'invalid_status' as any;

    const errors = await validate(dto);
    expect(errors.some(e => e.property === 'status')).toBe(true);
  });

  it('should accept optional fields', async () => {
    const dto = new CreateSiteDto();
    dto.nom = 'Test';
    dto.adresse = '123 Rue Test';
    dto.localisation = 'Tunis';
    dto.budget = 100000;
    dto.isActif = true; // Explicitly set
    dto.description = 'A test site';
    dto.area = 500;
    dto.progress = 50;
    dto.projectId = 'proj-123';
    dto.clientName = 'Client A';
    dto.coordinates = { lat: 36.8, lng: 10.1 };

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});

describe('UpdateSiteDto', () => {
  it('should validate with all optional fields', async () => {
    const dto = new UpdateSiteDto();
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate with some fields', async () => {
    const dto = new UpdateSiteDto();
    dto.nom = 'Updated Name';
    dto.budget = 200000;
    dto.status = 'completed';
    dto.progress = 100;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail when budget is negative', async () => {
    const dto = new UpdateSiteDto();
    dto.budget = -500;

    const errors = await validate(dto);
    expect(errors.some(e => e.property === 'budget')).toBe(true);
  });

  it('should fail when progress is out of range', async () => {
    const dto = new UpdateSiteDto();
    dto.progress = 200;

    const errors = await validate(dto);
    expect(errors.some(e => e.property === 'progress')).toBe(true);
  });

  it('should accept valid coordinates', async () => {
    const dto = new UpdateSiteDto();
    dto.coordinates = { lat: 36.8, lng: 10.1 };

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
