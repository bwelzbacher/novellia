import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, UrlTree } from '@angular/router';
import { MatIcon } from "@angular/material/icon";

export interface Crumb {
  label: string;
  routerLink?: string | readonly any[] | UrlTree | null | undefined
}

@Component({
  selector: 'app-breadcrumbs',
  imports: [RouterLink, MatIcon],
  templateUrl: './breadcrumbs.html',
  styleUrl: './breadcrumbs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Breadcrumbs {
  readonly crumbs = input.required<Crumb[]>();
}
