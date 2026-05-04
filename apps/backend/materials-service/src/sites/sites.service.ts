import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface SiteDocument {
  _id: any;
  nom: string;
  adresse?: string;
  localisation?: string;
  coordinates?: {
    lat?: number;
    lng?: number;
  };
  isActif?: boolean;
  status?: string;
}

@Injectable()
export class SitesService {
  private readonly logger = new Logger(SitesService.name);
  private readonly gestionSiteUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.gestionSiteUrl = this.configService.get('GESTION_SITE_URL') || 'http://localhost:3001/api';
    this.logger.log(`✅ SitesService initialized with URL: ${this.gestionSiteUrl}`);
  }

  async findAll(): Promise<SiteDocument[]> {
    try {
      this.logger.log(`🔍 Fetching all sites from: ${this.gestionSiteUrl}/gestion-sites`);
      
      const response = await firstValueFrom(
        this.httpService.get(`${this.gestionSiteUrl}/gestion-sites?limit=1000`)
      );

      let sites: any[] = [];
      if (Array.isArray(response.data)) {
        sites = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        sites = response.data.data;
      }

      this.logger.log(`✅ ${sites.length} sites retrieved from gestion-site API`);
      
      // Transform to match expected format
      return sites.map((site: any) => ({
        _id: site._id || site.id,
        nom: site.nom,
        adresse: site.adresse,
        localisation: site.localisation,
        coordinates: site.coordinates, // Already in { lat, lng } format
        isActif: site.isActif,
        status: site.status,
      }));
    } catch (error) {
      this.logger.error('❌ Error fetching sites from API:', error.message);
      return [];
    }
  }

  async findOne(id: string): Promise<SiteDocument | null> {
    try {
      this.logger.log(`🔍 Fetching site by ID: ${id} from ${this.gestionSiteUrl}/gestion-sites/${id}`);
      
      const response = await firstValueFrom(
        this.httpService.get(`${this.gestionSiteUrl}/gestion-sites/${id}`)
      );

      const site = response.data;
      
      if (site) {
        this.logger.log(`✅ Site FOUND: ${site.nom}`);
        this.logger.log(`   _id: ${site._id || site.id}`);
        this.logger.log(`   coordinates:`, JSON.stringify(site.coordinates, null, 2));
        
        if (site.coordinates) {
          if (site.coordinates.lat !== undefined && site.coordinates.lng !== undefined) {
            this.logger.log(`   ✅ GPS format OK: lat=${site.coordinates.lat}, lng=${site.coordinates.lng}`);
          } else {
            this.logger.warn(`   ⚠️ GPS format incorrect:`, site.coordinates);
          }
        } else {
          this.logger.warn(`   ⚠️ No coordinates field for site ${site.nom}`);
        }
        
        // Transform to match expected format
        return {
          _id: site._id || site.id,
          nom: site.nom,
          adresse: site.adresse,
          localisation: site.localisation,
          coordinates: site.coordinates, // Already in { lat, lng } format
          isActif: site.isActif,
          status: site.status,
        };
      } else {
        this.logger.error(`❌ Site NOT FOUND with ID: ${id}`);
        return null;
      }
    } catch (error) {
      this.logger.error(`❌ Error fetching site ${id} from API:`, error.message);
      return null;
    }
  }

  async getSiteCount(): Promise<number> {
    try {
      const sites = await this.findAll();
      return sites.length;
    } catch (error) {
      this.logger.error('Error counting sites:', error);
      return 0;
    }
  }
}
