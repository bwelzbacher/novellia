export interface VetRecord {
  id: string;
  officeName: string;
  address: string | null;
  phoneNumber: string | null;
  hours: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVetRecordPayload {
  officeName: string;
  address?: string;
  phoneNumber?: string;
  hours?: string;
}
