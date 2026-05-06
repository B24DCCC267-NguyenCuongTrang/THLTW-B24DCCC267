export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Club {
  id: string;
  imageUrl: string;
  name: string;
  establishedDate: string;
  descriptionHtml: string;
  leaderName: string;
  active: boolean;
  createdAt: string;
}

export interface ApplicationHistory {
  id: string;
  applicationId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'TRANSFER_CLUB';
  note: string;
  actor: string;
  createdAt: string;
}

export interface ApplicationItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  school: string;
  clubId: string;
  reason: string;
  status: ApplicationStatus;
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TH05State {
  clubs: Club[];
  applications: ApplicationItem[];
  histories: ApplicationHistory[];
}