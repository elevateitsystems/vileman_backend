import axios from 'axios';
import { AppLogger } from '@/core/logging/logger';

export interface Country {
  name: {
    common: string;
    official: string;
  };
  cca2: string;
  region: string;
  subregion: string;
}

export class CountryService {
  private static API_URL = 'https://restcountries.com/v3.1/all?fields=name,cca2,region,subregion';
  private static countries: Country[] = [];
  private static lastFetched: number = 0;
  private static CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Fetch all countries and cache them
   */
  public static async fetchCountries(): Promise<Country[]> {
    const now = Date.now();
    if (this.countries.length > 0 && (now - this.lastFetched) < this.CACHE_TTL) {
      return this.countries;
    }

    try {
      AppLogger.info('Fetching countries from REST Countries API...');
      const response = await axios.get(this.API_URL);
      this.countries = response.data;
      this.lastFetched = now;
      return this.countries;
    } catch (error) {
      AppLogger.error('Error fetching countries:', error);
      return [];
    }
  }

  /**
   * Get delivery charge based on country code or name
   */
  public static async getDeliveryCharge(countryIdentifier: string): Promise<number> {
    const countries = await this.fetchCountries();
    
    // Try to find by cca2 (2-letter code) or common name
    const country = countries.find(
      c => c.cca2 === countryIdentifier.toUpperCase() || 
           c.name.common.toLowerCase() === countryIdentifier.toLowerCase()
    );

    if (!country) {
      AppLogger.warn(`Country not found for identifier: ${countryIdentifier}. Defaulting to international charge.`);
      return 30; // Default international
    }

    // 1. Local (Netherlands)
    if (country.cca2 === 'NL') {
      return 6;
    }

    // 2. Surrounding (Belgium, Germany)
    const surrounding = ['BE', 'DE'];
    if (surrounding.includes(country.cca2)) {
      return 11;
    }

    // 3. Farther away (Rest of Europe)
    if (country.region === 'Europe') {
      return 16;
    }

    // 4. International
    return 30;
  }

  /**
   * Get all countries for frontend dropdown (optional helper)
   */
  public static async getAllCountries() {
    return await this.fetchCountries();
  }
}
