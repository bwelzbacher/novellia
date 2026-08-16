import { DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent } from "@angular/material/card";
import { MedicalRecord } from '../../../../models/medical-record.model';
import { Condition } from '../../../../models/condition.model';

@Component({
  selector: 'app-notes',
  imports: [MatCard, MatCardHeader, MatCardTitle, MatCardContent, DatePipe, TitleCasePipe],
  templateUrl: './notes.html',
  styleUrl: './notes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotesComponent {
  readonly records = input.required<MedicalRecord[]>();
  readonly conditions = input.required<Condition[]>();

  protected readonly notes = computed(() => {
    const entries: {
      id: string;
      kind: string;
      topic: string;
      date: string;
      note: string;
      noteId?: string;
    }[] = [];

    for (const record of this.records()) {
      for (const note of record.appointment?.notes ?? []) {
        entries.push({
          id: `appointment-note-${note.id}`,
          kind: 'Appointment',
          topic: record.appointment!.reason,
          date: record.date,
          note: note.text,
          noteId: note.id,
        });
      }
      for (const vaccine of record.vaccineRecords) {
        if (vaccine.notes) {
          entries.push({
            id: `vaccine-${vaccine.id}`,
            kind: 'Vaccine',
            topic: vaccine.name,
            date: record.date,
            note: vaccine.notes,
          });
        }
      }
      for (const medication of record.medicationRecords) {
        if (medication.notes) {
          entries.push({
            id: `medication-${medication.id}`,
            kind: 'Medication',
            topic: medication.name,
            date: record.date,
            note: medication.notes,
          });
        }
      }
    }

    for (const condition of this.conditions()) {
      if (condition.notes) {
        entries.push({
          id: `condition-${condition.id}`,
          kind: 'Condition',
          topic: condition.name,
          date: condition.createdAt,
          note: condition.notes,
        });
      }
    }

    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });
}
