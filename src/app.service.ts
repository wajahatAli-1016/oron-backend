import { Injectable } from '@nestjs/common';

export type RootHealthResponse = {
  status: 'ok';
  service: string;
  timestamp: string;
  docs: string;
};

@Injectable()
export class AppService {
  
  getRootHealth(): RootHealthResponse {
    return {
      status: 'ok',
      service: 'Oron SeniorCare API',
      timestamp: new Date().toISOString(),
      docs: '/api',
    };
  }
}
