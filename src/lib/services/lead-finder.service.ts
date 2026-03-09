import axios from 'axios';

const EXTERNAL_API_BASE_URL = process.env.EXTERNAL_API_BASE_URL || 'http://localhost:3000';
const API_KEY = process.env.EXTERNAL_API_KEY || 'your-secure-api-key';

const api = axios.create({
  baseURL: EXTERNAL_API_BASE_URL,
  headers: {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
  },
});

export interface LeadFinderJobStatus {
  id: string;
  jobId?: string;
  status: string;
  progress?: number;
  leadsFound: number;
  files?: {
    emails: string;
    numbers: string;
    csv: string;
  };
  error?: string | null;
}

export class LeadFinderService {
  static async getCountries() {
    const response = await api.get('/api/external/countries');
    // The API returns { countries: string[] }, so we return the array
    return response.data.countries || [];
  }

  static async getLocations(country: string) {
    const response = await api.get(`/api/external/locations?country=${country}`);
    return response.data; // Expects { states: string[] }
  }

  static async startJob(country: string, states: string[], niches: string[]) {
    const response = await api.post('/api/external/jobs', {
      country,
      states,
      niches,
      scrapeMode: "both" // As per documentation
    });
    return response.data; // { jobId: string }
  }

  static async getJobStatus(jobId: string) {
    const response = await api.get(`/api/external/jobs/${jobId}/status`);
    return response.data;
  }
}
