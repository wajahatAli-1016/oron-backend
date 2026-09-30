export interface INote {
    id: string;
    residentId: string;
    author: string;
    content: string;
    timestamp: Date;
    type: 'Observation' | 'Clinical' | 'General';
  }
  
  export interface INoteFilters {
    residentId?: string;
    type?: string;
    startDate?: Date;
    endDate?: Date;
    author?: string;
  }