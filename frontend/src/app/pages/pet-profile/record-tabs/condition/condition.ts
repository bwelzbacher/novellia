import { DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent, MatCardActions } from "@angular/material/card";
import { MatIcon } from "@angular/material/icon";
import { RouterLink } from '@angular/router';
import { Condition } from '../../../../models/condition.model';
import { MatButton } from '@angular/material/button';
import { PetId } from '../../../../models/pet.model';

@Component({
  selector: 'app-condition',
  imports: [MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent, MatCardActions, MatIcon, DatePipe, RouterLink, TitleCasePipe, MatButton],
  templateUrl: './condition.html',
  styleUrl: './condition.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionComponent {
  readonly conditions = input.required<Condition[]>();
  readonly petId = input.required<PetId>();
}
