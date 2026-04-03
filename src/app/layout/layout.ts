import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.html',
  styleUrl: './layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
})
export class Layout {
  sidebarOpen = signal(false);
  readonly activeOptions = { exact: true };

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }
}
