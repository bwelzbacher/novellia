import { PrismaClient } from '@prisma/client';
import { PREVENTATIVE_CARE_CONDITION_NAME } from '../src/pets/pets.service';

const prisma = new PrismaClient();

// All record/appointment dates below are computed relative to "today" (when
// this script runs) rather than hardcoded, so the dashboard's birthday /
// upcoming-appointment / missing-appointment-details badges reliably have
// at least one example each — however far in the future the seed is re-run.
function daysFromToday(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().substring(0, 10);
}

// A date of birth landing on today's month/day, `yearsAgo` years back —
// guarantees a birthday badge for whichever pet uses this.
function birthdayDateOfBirth(yearsAgo: number): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - yearsAgo);
  return date.toISOString().substring(0, 10);
}

// Deterministic date of birth: `yearsAgo` years back, offset by `dayOffset`
// days so generated pets don't all share the exact same birthday.
function dateOfBirth(yearsAgo: number, dayOffset: number): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - yearsAgo);
  date.setDate(date.getDate() - dayOffset);
  return date.toISOString().substring(0, 10);
}

interface VetSeed {
  key: string;
  officeName: string;
  address?: string;
  phoneNumber?: string;
  hours?: string;
}

// Conditions are standalone (like vets) — created once per pet, then
// referenced by key from any number of appointments/medications across
// any number of that pet's visits.
interface ConditionSeed {
  key: string;
  name: string;
  diagnosingPhysician?: string;
  status: string;
  notes?: string;
}

// A convenience single-note source field — wrapped into one STAFF-typed
// AppointmentNote at insert time. Use `notes` directly for multi-note
// examples.
interface AppointmentSeed {
  time: string;
  // Optional — a walk-in or after-hours visit sometimes isn't logged
  // against a specific vet by name (see medical-record-form-sheet's
  // "Vet's name (optional)" field).
  vet?: string;
  reason: string;
  summaryNotes?: string;
  notes?: { type: string; text: string }[];
  weightLbs?: number;
  temperatureF?: number;
  conditionKey?: string;
}

// administeredDate defaults to the parent MedicalRecordSeed's date (see
// insertion code) — matches the UI's default behavior, since a vaccine is
// almost always given on the visit date it's logged under.
interface VaccineSeed {
  name: string;
  nextDueDate?: string;
  notes?: string;
}

interface MedicationSeed {
  name: string;
  dosage?: string;
  duration?: string;
  prescriber?: string;
  notes?: string;
  status?: string;
  // Optional — a medication doesn't have to relate to a tracked condition
  // (e.g. a one-off antibiotic course).
  conditionKey?: string;
}

interface MedicalRecordSeed {
  date: string;
  // Optional — a medication can be logged without a vet visit at all (e.g.
  // an OTC medication the owner reports), so the visit it's attached to
  // doesn't require a vet office.
  vetKey?: string;
  sourceSystem?: string;
  appointment?: AppointmentSeed;
  vaccineRecords?: VaccineSeed[];
  medicationRecords?: MedicationSeed[];
  // Overrides the record's updatedAt (normally defaulted to "now" at seed
  // time). The missing-details badge (hasMissingAppointmentDetails) looks
  // for updatedAt < appointment date < now — i.e. a past visit nobody has
  // logged an outcome for since — so demoing that badge requires setting
  // this explicitly to before `date`.
  updatedAt?: string;
}

interface AllergySeed {
  allergen: string;
  severity: string;
  reaction?: string;
  notes?: string;
}

interface PetSeed {
  name: string;
  species: string;
  breed?: string;
  dateOfBirth?: string;
  sex: string;
  weightLbs?: number;
  microchipId?: string;
  ownerName: string;
  ownerEmail?: string;
  ownerPhone?: string;
  conditions?: ConditionSeed[];
  allergies?: AllergySeed[];
  records: MedicalRecordSeed[];
}

const VETS: VetSeed[] = [
  {
    key: 'riverside',
    officeName: 'Riverside Animal Hospital',
    address: '123 River Rd',
    phoneNumber: '555-010-0001',
    hours: 'Mon-Fri 8am-6pm',
  },
  {
    key: 'downtown',
    officeName: 'Downtown Vet Clinic',
    address: '45 Main St',
    phoneNumber: '555-010-0002',
    hours: 'Mon-Sat 9am-5pm',
  },
  {
    key: 'maple-street',
    officeName: 'Maple Street Veterinary',
    address: '789 Maple St',
    phoneNumber: '555-010-0003',
    hours: 'Mon-Fri 7am-7pm',
  },
  {
    key: 'avian-exotic',
    officeName: 'Avian & Exotic Care',
    address: '22 Birch Ave',
    phoneNumber: '555-010-0004',
    hours: 'Tue-Sat 10am-6pm',
  },
  {
    key: 'sunnyvale',
    officeName: 'Sunnyvale Pet Clinic',
    address: '500 Sunnyvale Blvd',
    phoneNumber: '555-010-0005',
    hours: 'Mon-Fri 8am-5pm',
  },
  {
    key: 'lakeside',
    officeName: 'Lakeside Animal Wellness',
    address: '18 Harbor Way',
    phoneNumber: '555-010-0006',
    hours: 'Mon-Fri 8am-7pm, Sat 9am-2pm',
  },
  {
    key: 'north-hills',
    officeName: 'North Hills Veterinary Group',
    address: '901 Ridge Ct',
    phoneNumber: '555-010-0007',
    hours: 'Mon-Fri 7:30am-6pm',
  },
  {
    key: 'oakwood',
    officeName: 'Oakwood Pet Hospital',
    address: '340 Oakwood Dr',
    phoneNumber: '555-010-0008',
    hours: 'Daily 8am-8pm',
  },
  {
    key: 'harborview',
    officeName: 'Harborview Animal Clinic',
    address: '77 Pier St',
    phoneNumber: '555-010-0009',
    hours: 'Mon-Fri 9am-6pm',
  },
  {
    key: 'greenfield',
    officeName: 'Greenfield Veterinary Care',
    address: '512 Meadow Ln',
    phoneNumber: '555-010-0010',
    hours: 'Tue-Sun 8am-5pm',
  },
];

// Hand-crafted "hero" pets — each one exercises a specific dashboard badge
// or record feature (birthday, upcoming visit, missing details, multi-note
// appointments, a condition spanning several visits, vaccine-dose grouping,
// a medication-only visit with no vet office, and a vet-name-optional
// appointment).
const HERO_PETS: PetSeed[] = [
  {
    name: 'Rex',
    species: 'DOG',
    breed: 'Labrador Retriever',
    dateOfBirth: '2020-03-15',
    sex: 'MALE',
    weightLbs: 65.04,
    ownerName: 'Jamie Chen',
    ownerEmail: 'jamie.chen@example.com',
    allergies: [
      {
        allergen: 'Chicken',
        severity: 'MODERATE',
        reaction: 'Skin irritation and itching',
        notes: 'Avoid chicken-based treats and food.',
      },
    ],
    records: [
      {
        // Multiple typed notes on one appointment.
        date: daysFromToday(-180),
        vetKey: 'riverside',
        sourceSystem: 'Riverside PIMS',
        appointment: {
          time: '10:00',
          vet: 'Dr. Patel',
          reason: 'Annual Checkup',
          weightLbs: 65.04,
          temperatureF: 101.5,
          notes: [
            { type: 'STAFF', text: 'Healthy weight, no concerns noted.' },
            {
              type: 'DISCHARGE',
              text: 'Continue current diet and exercise routine.',
            },
          ],
        },
        vaccineRecords: [
          { name: 'Rabies Vaccine', nextDueDate: daysFromToday(185) },
        ],
      },
      {
        // Upcoming-appointment badge: dated in the future, no outcome yet.
        date: daysFromToday(45),
        vetKey: 'riverside',
        sourceSystem: 'Riverside PIMS',
        appointment: {
          time: '09:30',
          vet: 'Dr. Patel',
          reason: 'Rabies Booster',
        },
      },
      // Vaccine-only visits going back several years — the Rabies Vaccine
      // history for one pet, used to demo grouping doses by name.
      {
        date: daysFromToday(-545),
        vetKey: 'riverside',
        vaccineRecords: [
          { name: 'Rabies Vaccine', nextDueDate: daysFromToday(-180) },
        ],
      },
      {
        date: daysFromToday(-910),
        vetKey: 'riverside',
        vaccineRecords: [
          { name: 'Rabies Vaccine', nextDueDate: daysFromToday(-545) },
        ],
      },
      {
        date: daysFromToday(-1275),
        vetKey: 'riverside',
        vaccineRecords: [
          { name: 'Rabies Vaccine', nextDueDate: daysFromToday(-910) },
        ],
      },
      {
        // Medication-only visit with no vet office at all — an
        // owner-reported OTC medication, not tied to a clinic visit.
        date: daysFromToday(-30),
        sourceSystem: 'Manual Entry',
        medicationRecords: [
          {
            name: 'Benadryl (OTC)',
            dosage: '25mg',
            duration: 'As needed',
            notes: 'Owner-administered for mild seasonal itching.',
          },
        ],
      },
    ],
  },
  {
    name: 'Whiskers',
    species: 'CAT',
    breed: 'Domestic Shorthair',
    dateOfBirth: '2018-07-01',
    sex: 'FEMALE',
    weightLbs: 9.26,
    ownerName: 'Jamie Chen',
    ownerEmail: 'jamie.chen@example.com',
    conditions: [
      {
        key: 'ear-infection',
        name: 'Ear Infection',
        diagnosingPhysician: 'Dr. Nguyen',
        status: 'RESOLVED',
        notes: 'Left ear.',
      },
    ],
    allergies: [
      {
        allergen: 'Penicillin',
        severity: 'SEVERE',
        reaction: 'Hives and facial swelling',
        notes: 'Confirmed by Dr. Nguyen; noted prominently in her chart.',
      },
    ],
    records: [
      {
        date: daysFromToday(-260),
        vetKey: 'downtown',
        sourceSystem: 'Manual Entry',
        appointment: {
          time: '14:00',
          vet: 'Dr. Nguyen',
          reason: 'Ear Infection Check',
          summaryNotes: 'Mild otitis externa in left ear, prescribed drops.',
          conditionKey: 'ear-infection',
        },
        medicationRecords: [
          {
            name: 'Otibiotic Ear Drops',
            dosage: '2 drops',
            duration: '10 days',
            prescriber: 'Dr. Nguyen',
            notes: 'Twice daily.',
            conditionKey: 'ear-infection',
          },
        ],
      },
      {
        // Follow-up visit for the same condition — demonstrates a
        // condition spanning more than one appointment.
        date: daysFromToday(60),
        vetKey: 'downtown',
        appointment: {
          time: '11:00',
          vet: 'Dr. Nguyen',
          reason: 'Follow-up Checkup',
          conditionKey: 'ear-infection',
        },
      },
    ],
  },
  {
    name: 'Luna',
    species: 'CAT',
    sex: 'FEMALE',
    ownerName: 'Priya Raman',
    records: [],
  },
  {
    name: 'Buddy',
    species: 'DOG',
    breed: 'Golden Retriever',
    dateOfBirth: '2019-11-02',
    sex: 'MALE',
    weightLbs: 70.77,
    microchipId: '985121000345678',
    ownerName: 'Priya Raman',
    ownerEmail: 'priya.raman@example.com',
    ownerPhone: '555-0192',
    records: [
      {
        date: daysFromToday(-370),
        vetKey: 'maple-street',
        sourceSystem: 'Maple Street PIMS',
        appointment: {
          time: '08:30',
          vet: 'Dr. Osei',
          reason: 'Annual Checkup',
          summaryNotes: 'All bloodwork within normal range.',
        },
        vaccineRecords: [
          { name: 'DHPP Vaccine', nextDueDate: daysFromToday(725) },
        ],
      },
      {
        date: daysFromToday(90),
        vetKey: 'maple-street',
        appointment: {
          time: '08:30',
          vet: 'Dr. Osei',
          reason: 'Annual Checkup',
        },
      },
      {
        // Vet-name-optional appointment — a walk-in triaged by the front
        // desk, no specific attending vet recorded.
        date: daysFromToday(-15),
        vetKey: 'maple-street',
        sourceSystem: 'Manual Entry',
        appointment: {
          time: '17:45',
          reason: 'Walk-in: Minor Cut Paw Pad',
          notes: [
            {
              type: 'STAFF',
              text: 'Triaged by front desk; attending vet not recorded in system.',
            },
          ],
        },
      },
    ],
  },
  {
    // Missing-details badge: an appointment 5 days in the past with no
    // outcome (no vaccine/medication) yet logged.
    name: 'Max',
    species: 'RABBIT',
    breed: 'Holland Lop',
    dateOfBirth: '2021-06-20',
    sex: 'UNKNOWN',
    weightLbs: 3.97,
    ownerName: 'Priya Raman',
    conditions: [
      {
        key: 'hay-sensitivity',
        name: 'Timothy Hay Sensitivity',
        diagnosingPhysician: 'Dr. Osei',
        status: 'MONITORING',
        notes:
          'Mild GI upset, switched to orchard grass hay. Not yet tied to a specific visit.',
      },
    ],
    records: [
      {
        date: daysFromToday(-5),
        // Logged when the visit was booked, then never updated with an
        // outcome — what makes this trigger the missing-details badge.
        updatedAt: daysFromToday(-10),
        vetKey: 'maple-street',
        appointment: {
          time: '13:00',
          vet: 'Dr. Osei',
          reason: 'Post-Surgery Recheck',
        },
      },
    ],
  },
  {
    // Birthday badge: dateOfBirth's month/day is today's.
    name: 'Bella',
    species: 'BIRD',
    breed: 'Cockatiel',
    dateOfBirth: birthdayDateOfBirth(4),
    sex: 'FEMALE',
    weightLbs: 0.2,
    ownerName: 'Sam Okafor',
    ownerEmail: 'sam.okafor@example.com',
    records: [
      {
        date: daysFromToday(-330),
        vetKey: 'avian-exotic',
        sourceSystem: 'Manual Entry',
        appointment: {
          time: '10:00',
          vet: 'Dr. Whitfield',
          reason: 'Wellness Exam',
          summaryNotes: 'Healthy, active.',
        },
      },
    ],
  },
  {
    // Upcoming-appointment badge: an appointment 7 days out.
    name: 'Charlie',
    species: 'REPTILE',
    breed: 'Bearded Dragon',
    sex: 'UNKNOWN',
    ownerName: 'Sam Okafor',
    records: [
      {
        date: daysFromToday(7),
        vetKey: 'avian-exotic',
        appointment: {
          time: '15:00',
          vet: 'Dr. Whitfield',
          reason: 'Wellness Exam',
        },
      },
    ],
  },
  {
    name: 'Daisy',
    species: 'DOG',
    breed: 'Beagle',
    dateOfBirth: '2017-04-27',
    sex: 'FEMALE',
    weightLbs: 24.91,
    microchipId: '985121000398765',
    ownerName: 'Sam Okafor',
    ownerPhone: '555-0147',
    conditions: [
      {
        key: 'arthritis',
        name: 'Early-Stage Arthritis',
        diagnosingPhysician: 'Dr. Whitfield',
        status: 'CHRONIC',
        notes: 'Hind legs.',
      },
    ],
    records: [
      {
        date: daysFromToday(-420),
        vetKey: 'avian-exotic',
        appointment: {
          time: '09:00',
          vet: 'Dr. Whitfield',
          reason: 'Mobility Check',
          conditionKey: 'arthritis',
          notes: [
            { type: 'STAFF', text: 'Mild joint stiffness in hind legs.' },
            {
              type: 'CARE_PLAN',
              text: 'Start daily joint supplement, recheck in ~2 months.',
            },
            {
              type: 'PERSONAL',
              text: 'Owner is anxious about mobility decline — reassure and set expectations at next visit.',
            },
          ],
        },
        medicationRecords: [
          {
            name: 'Joint Supplement',
            dosage: '1 chew',
            duration: 'Ongoing',
            prescriber: 'Dr. Whitfield',
            notes: 'Daily.',
            conditionKey: 'arthritis',
          },
        ],
      },
      {
        // Upcoming recheck for the same chronic condition — this pet's
        // "Early-Stage Arthritis" condition detail page will show two
        // related appointments and one medication, aggregated across
        // both visits.
        date: daysFromToday(75),
        vetKey: 'avian-exotic',
        appointment: {
          time: '09:00',
          vet: 'Dr. Whitfield',
          reason: 'Mobility Recheck',
          conditionKey: 'arthritis',
        },
      },
    ],
  },
  {
    // Two badges: birthday (dateOfBirth's month/day is today's) plus an
    // upcoming appointment 10 days out.
    name: 'Milo',
    species: 'CAT',
    breed: 'Maine Coon',
    dateOfBirth: birthdayDateOfBirth(3),
    sex: 'MALE',
    weightLbs: 14.77,
    ownerName: 'Grace Kim',
    ownerEmail: 'grace.kim@example.com',
    ownerPhone: '555-0163',
    records: [
      {
        date: daysFromToday(-480),
        vetKey: 'sunnyvale',
        appointment: {
          time: '10:30',
          vet: 'Dr. Ibarra',
          reason: 'Kitten Wellness Exam',
        },
        vaccineRecords: [
          { name: 'FVRCP Vaccine', nextDueDate: daysFromToday(615) },
        ],
      },
      {
        date: daysFromToday(10),
        vetKey: 'sunnyvale',
        appointment: {
          time: '10:30',
          vet: 'Dr. Ibarra',
          reason: 'FVRCP Booster Appointment',
        },
      },
    ],
  },
  {
    name: 'Coco',
    species: 'OTHER',
    breed: 'Guinea Pig',
    dateOfBirth: '2023-09-05',
    sex: 'FEMALE',
    weightLbs: 2.09,
    ownerName: 'Grace Kim',
    records: [
      {
        date: daysFromToday(-390),
        vetKey: 'avian-exotic',
        appointment: {
          time: '16:00',
          vet: 'Dr. Whitfield',
          reason: 'Nail Trim',
          summaryNotes: 'Routine grooming, no issues.',
        },
      },
    ],
  },
];

// --- Generated pets ---------------------------------------------------
// A larger, deterministic set of additional pets built from template
// pools rather than hand-written one by one, so the dataset has real
// volume (dashboard pagination/filtering, list scrolling, etc.) without
// hundreds of hand-typed lines. Deterministic (no Math.random()) so the
// seed produces the same data every time it's run.

const GENERATED_OWNERS: { name: string; email?: string; phone?: string }[] = [
  { name: 'Alex Rivera', email: 'alex.rivera@example.com', phone: '555-0201' },
  { name: 'Morgan Lee', email: 'morgan.lee@example.com' },
  { name: 'Taylor Brooks', email: 'taylor.brooks@example.com', phone: '555-0203' },
  { name: 'Jordan Ellis', phone: '555-0204' },
  { name: 'Casey Nakamura', email: 'casey.nakamura@example.com' },
  { name: 'Riley Thompson', email: 'riley.thompson@example.com', phone: '555-0206' },
  { name: 'Avery Santos', email: 'avery.santos@example.com' },
  { name: 'Quinn Whitfield', phone: '555-0208' },
  { name: 'Reese Delgado', email: 'reese.delgado@example.com', phone: '555-0209' },
  { name: 'Skyler Novak', email: 'skyler.novak@example.com' },
  { name: 'Drew Callahan', email: 'drew.callahan@example.com', phone: '555-0211' },
  { name: 'Emerson Vance', email: 'emerson.vance@example.com' },
];

interface SpeciesProfile {
  species: string;
  breeds: string[];
  vaccine?: string;
  vaccineIntervalDays: number;
  wellnessReason: string;
  weightRange: [number, number];
}

const SPECIES_PROFILES: SpeciesProfile[] = [
  {
    species: 'DOG',
    breeds: ['Border Collie', 'Boxer', 'Dachshund', 'Poodle', 'Shih Tzu', 'Australian Shepherd'],
    vaccine: 'DHPP Vaccine',
    vaccineIntervalDays: 365,
    wellnessReason: 'Annual Checkup',
    weightRange: [15, 80],
  },
  {
    species: 'CAT',
    breeds: ['Siamese', 'Ragdoll', 'Bengal', 'British Shorthair', 'Sphynx'],
    vaccine: 'FVRCP Vaccine',
    vaccineIntervalDays: 365,
    wellnessReason: 'Wellness Exam',
    weightRange: [6, 14],
  },
  {
    species: 'RABBIT',
    breeds: ['Netherland Dwarf', 'Rex', 'Flemish Giant'],
    vaccine: 'RHDV Vaccine',
    vaccineIntervalDays: 365,
    wellnessReason: 'Wellness Exam',
    weightRange: [2, 6],
  },
  {
    species: 'BIRD',
    breeds: ['Budgerigar', 'African Grey', 'Conure'],
    vaccine: 'Polyomavirus Vaccine',
    vaccineIntervalDays: 365,
    wellnessReason: 'Wellness Exam',
    weightRange: [0.1, 1.2],
  },
  {
    species: 'REPTILE',
    breeds: ['Leopard Gecko', 'Ball Python', 'Red-Eared Slider'],
    vaccineIntervalDays: 0,
    wellnessReason: 'Wellness Exam',
    weightRange: [0.3, 5],
  },
  {
    species: 'OTHER',
    breeds: ['Hedgehog', 'Chinchilla', 'Ferret'],
    vaccineIntervalDays: 0,
    wellnessReason: 'Wellness Exam',
    weightRange: [0.5, 5],
  },
];

const PET_NAMES = [
  'Nova', 'Biscuit', 'Zeus', 'Pepper', 'Willow', 'Gizmo', 'Sadie', 'Oscar', 'Ruby', 'Duke',
  'Hazel', 'Finn', 'Olive', 'Bear', 'Maple', 'Loki', 'Sunny', 'Stella', 'Rocky', 'Ivy',
  'Simba', 'Marbles', 'Cooper', 'Nala', 'Winston', 'Pumpkin', 'Bandit', 'Clover',
];

const VET_NAMES = ['Dr. Alvarez', 'Dr. Kim', 'Dr. Rossi', 'Dr. Bennett', 'Dr. Farah', 'Dr. Okonkwo', 'Dr. Marsh'];

const CONDITION_TEMPLATES: { name: string; status: string; notes?: string }[] = [
  { name: 'Seasonal Allergies', status: 'MONITORING', notes: 'Flares up in spring.' },
  { name: 'Dental Disease', status: 'CHRONIC', notes: 'Mild tartar buildup, monitoring for now.' },
  { name: 'Obesity', status: 'ACTIVE', notes: 'On a weight-management diet plan.' },
  { name: 'Hip Dysplasia', status: 'CHRONIC' },
  { name: 'Hyperthyroidism', status: 'MONITORING' },
  { name: 'Urinary Tract Infection', status: 'RESOLVED' },
];

const MEDICATION_TEMPLATES: { name: string; dosage?: string; duration?: string; status?: string }[] = [
  { name: 'Apoquel', dosage: '16mg', duration: 'Ongoing' },
  { name: 'Metacam', dosage: '1.5mg/mL', duration: '14 days', status: 'COMPLETED' },
  { name: 'Gabapentin', dosage: '100mg', duration: '30 days' },
  { name: 'Amoxicillin', dosage: '250mg', duration: '10 days', status: 'COMPLETED' },
  { name: 'Cerenia', dosage: '16mg', duration: '5 days', status: 'DISCONTINUED' },
];

const ALLERGY_TEMPLATES: { allergen: string; severity: string; reaction?: string }[] = [
  { allergen: 'Beef', severity: 'MILD', reaction: 'Mild GI upset' },
  { allergen: 'Pollen', severity: 'MILD', reaction: 'Sneezing, watery eyes' },
  { allergen: 'Flea saliva', severity: 'MODERATE', reaction: 'Hot spots and hair loss' },
  { allergen: 'Bee stings', severity: 'LIFE_THREATENING', reaction: 'Facial swelling, difficulty breathing' },
  { allergen: 'Dairy', severity: 'MILD' },
];

function buildGeneratedPets(): PetSeed[] {
  const vetKeys = VETS.map(vet => vet.key);

  return PET_NAMES.map((name, i) => {
    const profile = SPECIES_PROFILES[i % SPECIES_PROFILES.length];
    const owner = GENERATED_OWNERS[i % GENERATED_OWNERS.length];
    const vetKey = vetKeys[i % vetKeys.length];
    const breed = profile.breeds[i % profile.breeds.length];
    const ageYears = 1 + (i % 9);
    const weightSpan = profile.weightRange[1] - profile.weightRange[0];
    const weightLbs = Number((profile.weightRange[0] + (weightSpan * ((i * 37) % 100)) / 100).toFixed(2));
    const sex = i % 3 === 0 ? 'FEMALE' : i % 3 === 1 ? 'MALE' : 'UNKNOWN';

    const conditions: ConditionSeed[] = [];
    // Every 3rd pet gets a chronic condition with a matching medication.
    const hasCondition = i % 3 === 0;
    if (hasCondition) {
      conditions.push({ key: 'primary', ...CONDITION_TEMPLATES[(i / 3) % CONDITION_TEMPLATES.length] });
    }

    const allergies: AllergySeed[] = [];
    // Roughly a quarter of pets have a known allergy.
    if (i % 4 === 1) {
      allergies.push(ALLERGY_TEMPLATES[i % ALLERGY_TEMPLATES.length]);
    }

    const visitCount = 2 + (i % 3); // 2-4 historical visits per pet
    const records: MedicalRecordSeed[] = [];
    for (let v = 0; v < visitCount; v++) {
      const daysAgo = -(60 + v * 190 + (i % 30) * 5);
      const isLatestVisit = v === 0;
      // Every 5th visit slot omits the vet's name — a walk-in not tied to
      // a specific attending vet.
      const omitVetName = (i + v) % 5 === 4;

      const record: MedicalRecordSeed = {
        date: daysFromToday(daysAgo),
        vetKey,
        appointment: {
          time: `${9 + ((i + v) % 8)}:${v % 2 === 0 ? '00' : '30'}`,
          vet: omitVetName ? undefined : VET_NAMES[(i + v) % VET_NAMES.length],
          reason: v === visitCount - 1 ? 'New Patient Exam' : profile.wellnessReason,
          weightLbs: isLatestVisit ? weightLbs : undefined,
        },
        vaccineRecords:
          profile.vaccine && v === 0
            ? [{ name: profile.vaccine, nextDueDate: daysFromToday(profile.vaccineIntervalDays + daysAgo) }]
            : undefined,
      };

      if (hasCondition && v === 0) {
        record.appointment!.conditionKey = 'primary';
        const medication = MEDICATION_TEMPLATES[Math.floor(i / 3) % MEDICATION_TEMPLATES.length];
        record.medicationRecords = [
          {
            ...medication,
            prescriber: record.appointment!.vet,
            conditionKey: 'primary',
          },
        ];
      }

      records.push(record);
    }

    // Every 6th pet also gets a standalone, no-vet-office OTC medication
    // entry — the same feature Rex's hero record demonstrates, spread
    // across more of the dataset.
    if (i % 6 === 3) {
      records.push({
        date: daysFromToday(-20 - i),
        sourceSystem: 'Manual Entry',
        medicationRecords: [{ name: 'Owner-administered supplement', duration: 'As needed' }],
      });
    }

    return {
      name,
      species: profile.species,
      breed,
      dateOfBirth: dateOfBirth(ageYears, (i * 11) % 300),
      sex,
      weightLbs,
      ownerName: owner.name,
      ownerEmail: owner.email,
      ownerPhone: owner.phone,
      conditions: conditions.length > 0 ? conditions : undefined,
      allergies: allergies.length > 0 ? allergies : undefined,
      records,
    };
  });
}

const PETS: PetSeed[] = [...HERO_PETS, ...buildGeneratedPets()];

async function main() {
  // Deleting pets cascades to their medical records (-> appointment/
  // vaccine/medication rows) and their conditions. Vet records have no
  // cascade delete, so they're cleared last.
  await prisma.pet.deleteMany();
  await prisma.vetRecord.deleteMany();

  const vetIdByKey = new Map<string, string>();
  for (const vetSeed of VETS) {
    const { key, ...data } = vetSeed;
    const vetRecord = await prisma.vetRecord.create({ data });
    vetIdByKey.set(key, vetRecord.id);
  }

  for (const petSeed of PETS) {
    const { records, conditions, allergies, dateOfBirth: dob, ...petData } = petSeed;
    const pet = await prisma.pet.create({
      data: {
        ...petData,
        dateOfBirth: dob ? new Date(dob) : undefined,
      },
    });

    // Every pet gets this automatically at creation time in PetsService —
    // seeded pets need it added explicitly since seeding writes to Prisma
    // directly rather than going through that service.
    await prisma.condition.create({
      data: {
        petId: pet.id,
        name: PREVENTATIVE_CARE_CONDITION_NAME,
        status: 'ACTIVE',
      },
    });

    for (const allergySeed of allergies ?? []) {
      await prisma.allergy.create({ data: { ...allergySeed, petId: pet.id } });
    }

    const conditionIdByKey = new Map<string, string>();
    for (const conditionSeed of conditions ?? []) {
      const { key, ...data } = conditionSeed;
      const condition = await prisma.condition.create({
        data: { ...data, petId: pet.id },
      });
      conditionIdByKey.set(key, condition.id);
    }
    const resolveConditionId = (key?: string) => {
      if (!key) {
        return undefined;
      }
      const id = conditionIdByKey.get(key);
      if (!id) {
        throw new Error(`Unknown condition key "${key}" for pet ${pet.name}`);
      }
      return id;
    };

    for (const record of records) {
      const vetRecordId = record.vetKey ? vetIdByKey.get(record.vetKey) : undefined;
      if (record.vetKey && !vetRecordId) {
        throw new Error(`Unknown vet key: ${record.vetKey}`);
      }

      await prisma.medicalRecord.create({
        data: {
          petId: pet.id,
          vetRecordId,
          date: new Date(record.date),
          sourceSystem: record.sourceSystem,
          updatedAt: record.updatedAt ? new Date(record.updatedAt) : undefined,
          appointment: record.appointment
            ? {
                create: {
                  time: record.appointment.time,
                  vet: record.appointment.vet,
                  reason: record.appointment.reason,
                  weightLbs: record.appointment.weightLbs,
                  temperatureF: record.appointment.temperatureF,
                  conditionId: resolveConditionId(
                    record.appointment.conditionKey,
                  ),
                  notes: {
                    create:
                      record.appointment.notes ??
                      (record.appointment.summaryNotes
                        ? [
                            {
                              type: 'STAFF',
                              text: record.appointment.summaryNotes,
                            },
                          ]
                        : []),
                  },
                },
              }
            : undefined,
          vaccineRecords: record.vaccineRecords
            ? {
                create: record.vaccineRecords.map((vaccine) => ({
                  name: vaccine.name,
                  administeredDate: new Date(record.date),
                  nextDueDate: vaccine.nextDueDate
                    ? new Date(vaccine.nextDueDate)
                    : undefined,
                  notes: vaccine.notes,
                })),
              }
            : undefined,
          medicationRecords: record.medicationRecords
            ? {
                create: record.medicationRecords.map((medication) => ({
                  name: medication.name,
                  dosage: medication.dosage,
                  duration: medication.duration,
                  prescriber: medication.prescriber,
                  notes: medication.notes,
                  status: medication.status,
                  conditionId: resolveConditionId(medication.conditionKey),
                })),
              }
            : undefined,
        },
      });
    }
  }

  console.log(`Seeded ${VETS.length} vet offices and ${PETS.length} pets.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
