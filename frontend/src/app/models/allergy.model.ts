export const ALLERGY_SEVERITIES = ['MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING'] as const;
export type AllergySeverity = (typeof ALLERGY_SEVERITIES)[number];

export interface Allergy {
  id: string;
  petId: string;
  allergen: string;
  severity: AllergySeverity;
  reaction: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAllergyPayload {
  petId: string;
  allergen: string;
  severity: AllergySeverity;
  reaction?: string;
  notes?: string;
}

export interface UpdateAllergyPayload {
  allergen?: string;
  severity?: AllergySeverity;
  reaction?: string;
  notes?: string;
}
