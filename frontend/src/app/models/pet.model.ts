export const PET_SPECIES = ['DOG', 'CAT', 'BIRD', 'REPTILE', 'RABBIT', 'OTHER'] as const;
export type PetSpecies = (typeof PET_SPECIES)[number];

export const PET_SEX = ['MALE', 'FEMALE', 'UNKNOWN'] as const;
export type PetSex = (typeof PET_SEX)[number];

export const PET_INACTIVE_REASON = ['DECEASED', 'REHOMED', 'OTHER'] as const;
export type PetInactiveReason = (typeof PET_INACTIVE_REASON)[number];

export type PetId = string;

export interface Pet {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string | null;
  dateOfBirth: string | null;
  sex: PetSex;
  weightLbs: number | null;
  microchipId: string | null;
  ownerName: string;
  ownerEmail: string | null;
  ownerPhone: string | null;
  isActive: boolean;
  inactiveReason: PetInactiveReason | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePetPayload {
  name: string;
  species: PetSpecies;
  breed: string | null;
  dateOfBirth: string | null;
  sex: PetSex;
  weightLbs: number | null;
  microchipId: string | null;
  ownerName: string;
  ownerEmail: string | null;
  ownerPhone: string | null;
}

export interface CreatePetPayload {
  name: string;
  species: PetSpecies;
  breed?: string;
  dateOfBirth?: string;
  sex: PetSex;
  weightLbs?: number;
  microchipId?: string;
  ownerName: string;
  ownerEmail?: string;
  ownerPhone?: string;
}

export interface PaginatedPets {
  data: Pet[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PetFilter {
  species?: PetSpecies;
  name?: string;
  page?: number;
}
