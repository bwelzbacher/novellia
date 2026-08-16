import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { PetProfile } from './pages/pet-profile/pet-profile';
import { RecordDetail } from './pages/record-detail/record-detail';
import { ConditionDetail } from './pages/condition-detail/condition-detail';
import { VaccineDetail } from './pages/vaccine-detail/vaccine-detail';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: Dashboard },
  { path: 'pets/:id', component: PetProfile },
  { path: 'pets/:petId/records/:recordId', component: RecordDetail },
  { path: 'pets/:petId/conditions/:conditionId', component: ConditionDetail },
  { path: 'pets/:petId/vaccines/:vaccineName', component: VaccineDetail },
];
