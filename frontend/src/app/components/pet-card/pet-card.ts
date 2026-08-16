import { LowerCasePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardActions, MatCardAvatar, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatMenuTrigger } from '@angular/material/menu';
import { AddRecordMenu } from '../add-record-menu/add-record-menu';
import { PetActionsMenu } from '../pet-actions-menu/pet-actions-menu';
import { MedicalRecord } from '../../models/medical-record.model';
import { Pet, PetId } from '../../models/pet.model';
import { API_BASE_URL } from '../../services/pets.service';
import { computePetAge } from '../../utils/pet-age';
import { computePetBadges } from '../../utils/pet-badges';

@Component({
  selector: 'app-pet-card',
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    MatCardAvatar,
    MatIcon,
    TitleCasePipe,
    LowerCasePipe,
    MatCardActions,
    MatButton,
    RouterLink,
    PetActionsMenu,
  ],
  templateUrl: './pet-card.html',
  styleUrl: './pet-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PetCard {
  readonly pet = input.required<Pet>();
  readonly records = input<MedicalRecord[]>([]);
  readonly deleted = output<PetId>();
  readonly triggerRefresh = output<void>();

  protected readonly photoUrl = computed(() => {
    const photoUrl = this.pet().photoUrl;
    return photoUrl ? `${API_BASE_URL}${photoUrl}` : null;
  });

  protected readonly age = computed(() => computePetAge(this.pet().dateOfBirth));

  protected readonly badges = computed(() => computePetBadges(this.pet(), this.records()));
}
