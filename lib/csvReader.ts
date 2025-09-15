
import fs from 'fs';
import path from 'path';

export interface PlumbingBusiness {
  name: string;
  site: string;
  subtypes: string;
  category: string;
  type: string;
  phone: string;
  'phone.phones_enricher.carrier_name': string;
  'phone.phones_enricher.carrier_type': string;
  latitude: string;
  longitude: string;
  full_address: string;
  city: string;
  state: string;
  area_service: string;
  rating: string;
  reviews: string;
  reviews_link: string;
  photos_count: string;
  working_hours: string;
  verified: string;
  location_link: string;
  place_id: string;
  email_1: string;
  'email_1.emails_validator.status': string;
  facebook: string;
  instagram: string;
  logo: string;
  primary_color: string;
  secondary_color: string;
  slug: string;
}

export function getBusinessBySlug(slug: string): PlumbingBusiness | null {
  try {
    const csvPath = path.join(process.cwd(), 'filtered_plumbing_data.csv');
    const csvData = fs.readFileSync(csvPath, 'utf-8');
    
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
      const business: any = {};
      
      headers.forEach((header, index) => {
        business[header] = values[index] || '';
      });
      
      if (business.slug === slug) {
        return business as PlumbingBusiness;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error reading CSV:', error);
    return null;
  }
}

export function getAllBusinesses(): PlumbingBusiness[] {
  try {
    const csvPath = path.join(process.cwd(), 'filtered_plumbing_data.csv');
    const csvData = fs.readFileSync(csvPath, 'utf-8');
    
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
    const businesses: PlumbingBusiness[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
        const business: any = {};
        
        headers.forEach((header, index) => {
          business[header] = values[index] || '';
        });
        
        businesses.push(business as PlumbingBusiness);
      }
    }
    
    return businesses;
  } catch (error) {
    console.error('Error reading CSV:', error);
    return [];
  }
}
