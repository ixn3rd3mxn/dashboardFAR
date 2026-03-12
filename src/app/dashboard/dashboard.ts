import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  viewChild,
  ElementRef,
  afterNextRender,
  OnDestroy,
} from '@angular/core';
import flatpickr from 'flatpickr';
import type { Instance as FlatpickrInstance } from 'flatpickr/dist/types/instance';
import { Thai } from 'flatpickr/dist/l10n/th.js';
import { ApiService } from '../services/api.service';
import type {
  Rescue,
  ShiftWork,
  IncidentSummary,
  IncidentStep,
} from '../models/types';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnDestroy {
  private api = inject(ApiService);
  private clockInterval?: ReturnType<typeof setInterval>;
  private refreshInterval?: ReturnType<typeof setInterval>;
  private dialogPollInterval?: ReturnType<typeof setInterval>;
  private fpInstance?: FlatpickrInstance;
  private fpInput = viewChild<ElementRef<HTMLInputElement>>('fpInput');

  // ── Time ──────────────────────────────────────────────────────────────────
  currentTime = signal<Date>(new Date());

  formattedTime = computed(() => {
    const d = this.currentTime();
    return d.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  });

  formattedFullDate = computed(() => {
    const d = this.currentTime();
    return d.toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  // ── Date picker ──────────────────────────────────────────────────────────
  selectedDate = signal<string>(this.todayISO());


  // ── Shifts ────────────────────────────────────────────────────────────────
  shifts = signal<ShiftWork[]>([]);
  selectedShiftId = signal<number>(this.getCurrentShiftId());
  shiftDropdownOpen = signal<boolean>(false);

  selectedShiftName = computed(() => {
    const shift = this.shifts().find((s) => s.shiftwork_id === this.selectedShiftId());
    return shift?.shiftwork_name ?? '';
  });

  // ── Summary ───────────────────────────────────────────────────────────────
  summary = signal<IncidentSummary | null>(null);

  // ── Incident dialog ───────────────────────────────────────────────────────
  incidentStep = signal<IncidentStep>('');
  selectedIncidentType = signal<string>('');
  selectedSubtype = signal<string>('');
  selectedLevel = signal<string>('');

  // ── Staff ─────────────────────────────────────────────────────────────────
  rescuers = signal<Rescue[]>([]);
  staffDialogOpen = signal<boolean>(false);
  staffConfirmOpen = signal<boolean>(false);
  staffSearchQuery = signal<string>('');
  selectedRescueIds = signal<number[]>([]);
  assignedRescuers = signal<Rescue[]>([]);
  dialogBaseIds = signal<number[]>([]);

  filteredRescuers = computed(() => {
    const q = this.staffSearchQuery().toLowerCase().trim();
    if (!q) return this.rescuers();
    return this.rescuers().filter((r) => r.rescue_name.toLowerCase().includes(q));
  });

  selectedRescuersForConfirm = computed(() =>
    this.rescuers().filter((r) => this.selectedRescueIds().includes(r.rescue_id))
  );

  staffToAdd = computed(() => {
    const base = this.dialogBaseIds();
    return this.selectedRescuersForConfirm().filter((r) => !base.includes(r.rescue_id));
  });

  staffToRemove = computed(() => {
    const selected = this.selectedRescueIds();
    return this.rescuers().filter(
      (r) => this.dialogBaseIds().includes(r.rescue_id) && !selected.includes(r.rescue_id)
    );
  });

  staffUnchanged = computed(() => {
    const base = this.dialogBaseIds();
    return this.selectedRescuersForConfirm().filter((r) => base.includes(r.rescue_id));
  });

  // ─────────────────────────────────────────────────────────────────────────

  constructor() {
    afterNextRender(() => {
      this.clockInterval = setInterval(() => this.currentTime.set(new Date()), 1000);
      this.refreshInterval = setInterval(() => {
        this.loadSummary();
        this.loadStaffAssignment();
      }, 10_000);

      const el = this.fpInput()?.nativeElement;
      if (el) {
        const setBEYear = (fp: FlatpickrInstance) => {
          if (fp.currentYearElement) {
            fp.currentYearElement.value = String(fp.currentYear + 543);
            fp.currentYearElement.readOnly = true;
          }
        };
        this.fpInstance = flatpickr(el, {
          locale: Thai,
          formatDate: (date: Date) => {
            const d = String(date.getDate()).padStart(2, '0');
            const m = String(date.getMonth() + 1).padStart(2, '0');
            return `${d}/${m}/${date.getFullYear() + 543}`;
          },
          parseDate: (str: string) => {
            const [d, m, y] = str.split('/').map(Number);
            return new Date(y - 543, m - 1, d);
          },
          defaultDate: (() => { const [y, m, d] = this.selectedDate().split('-').map(Number); return new Date(y, m - 1, d); })(),
          minDate: new Date('2026-03-01'),
          maxDate: new Date('2031-12-31'),
          onChange: (dates: Date[]) => {
            if (dates[0]) {
              const d = dates[0];
              const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              this.selectedDate.set(iso);
              this.loadSummary();
              this.loadStaffAssignment();
            }
          },
          onReady: (_: Date[], __: string, fp: FlatpickrInstance) => {
            setBEYear(fp);
            const btn = document.createElement('button');
            btn.textContent = 'วันนี้';
            btn.type = 'button';
            btn.className = 'fp-today-btn';
            btn.addEventListener('click', () => { fp.setDate(new Date(), true); fp.close(); });
            fp.calendarContainer.appendChild(btn);
          },
          onOpen:        (_: Date[], __: string, fp: FlatpickrInstance) => setBEYear(fp),
          onYearChange:  (_: Date[], __: string, fp: FlatpickrInstance) => setBEYear(fp),
          onMonthChange: (_: Date[], __: string, fp: FlatpickrInstance) => setBEYear(fp),
        }) as FlatpickrInstance;
      }

      this.loadShifts();
      this.loadRescuers();
      this.loadSummary();
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.clockInterval);
    clearInterval(this.refreshInterval);
    this.stopDialogPoll();
    this.fpInstance?.destroy();
  }

  private startDialogPoll(): void {
    this.stopDialogPoll();
    this.dialogPollInterval = setInterval(() => this.pollDialogState(), 3_000);
  }

  private stopDialogPoll(): void {
    clearInterval(this.dialogPollInterval);
    this.dialogPollInterval = undefined;
  }

  private pollDialogState(): void {
    this.api
      .getShiftAssignment(this.selectedDate(), this.selectedShiftId())
      .subscribe((result) => {
        const latestIds: number[] = result.rescue_ids;
        const base = this.dialogBaseIds();
        const selected = this.selectedRescueIds();
        const userAdded = selected.filter((id) => !base.includes(id));
        const userRemoved = new Set(base.filter((id) => !selected.includes(id)));
        const newSelected = [
          ...latestIds.filter((id) => !userRemoved.has(id)),
          ...userAdded.filter((id) => !latestIds.includes(id)),
        ];
        this.dialogBaseIds.set(latestIds);
        this.selectedRescueIds.set(newSelected);
        this.assignedRescuers.set(
          this.rescuers().filter((r) => latestIds.includes(r.rescue_id))
        );
      });
  }

  private todayISO(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private getCurrentShiftId(): number {
    const now = new Date();
    const total = now.getHours() * 60 + now.getMinutes();
    if (total >= 510 && total < 990) return 1; // 08:30–16:30 เช้า
    if (total >= 990) return 2;                 // 16:30–24:00 บ่าย
    return 3;                                   // 00:00–08:30 ดึก
  }

  private loadShifts(): void {
    this.api.getShifts().subscribe((data) => this.shifts.set(data));
  }

  private loadRescuers(): void {
    this.api.getRescuers().subscribe((data) => {
      this.rescuers.set(data);
      this.loadStaffAssignment();
    });
  }

  loadSummary(): void {
    this.api
      .getIncidentSummary(this.selectedDate(), this.selectedShiftId())
      .subscribe((data) => this.summary.set(data));
  }

  loadStaffAssignment(): void {
    this.api
      .getShiftAssignment(this.selectedDate(), this.selectedShiftId())
      .subscribe((result) => {
        const ids = result.rescue_ids;
        this.assignedRescuers.set(this.rescuers().filter((r) => ids.includes(r.rescue_id)));
      });
  }

  // ── Controls ──────────────────────────────────────────────────────────────

onShiftChange(event: Event): void {
    this.selectedShiftId.set(Number((event.target as HTMLSelectElement).value));
    this.loadSummary();
    this.loadStaffAssignment();
  }

  selectShift(id: number): void {
    this.selectedShiftId.set(id);
    this.shiftDropdownOpen.set(false);
    this.loadSummary();
    this.loadStaffAssignment();
  }

  // ── Incident dialog ───────────────────────────────────────────────────────

  openIncidentDialog(): void {
    this.selectedIncidentType.set('');
    this.selectedSubtype.set('');
    this.selectedLevel.set('');
    this.incidentStep.set('type');
  }

  closeIncidentDialog(): void {
    this.incidentStep.set('');
    this.selectedIncidentType.set('');
    this.selectedSubtype.set('');
    this.selectedLevel.set('');
  }

  selectIncidentType(type: string): void {
    this.selectedIncidentType.set(type);
    this.selectedSubtype.set('');
    this.selectedLevel.set('');
    if (type === 'แจ้งเหตุ') {
      this.incidentStep.set('subtype');
    } else {
      this.incidentStep.set('confirm');
    }
  }

  selectSubtype(subtype: string): void {
    this.selectedSubtype.set(subtype);
    this.incidentStep.set('level');
  }

  selectLevel(level: string): void {
    this.selectedLevel.set(level);
    this.incidentStep.set('confirm');
  }

  confirmIncident(): void {
    this.api
      .createIncident({
        date: this.selectedDate(),
        shift_id: this.selectedShiftId(),
        type: this.selectedIncidentType(),
        subtype: this.selectedSubtype() || null,
        level: this.selectedLevel() || null,
      })
      .subscribe(() => {
        this.closeIncidentDialog();
        this.loadSummary();
      });
  }

  // ── Staff dialog ──────────────────────────────────────────────────────────

  openStaffDialog(): void {
    const ids = this.assignedRescuers().map((r) => r.rescue_id);
    this.dialogBaseIds.set(ids);
    this.selectedRescueIds.set(ids);
    this.staffSearchQuery.set('');
    this.staffDialogOpen.set(true);
    this.startDialogPoll();
  }

  closeStaffDialog(): void {
    this.staffDialogOpen.set(false);
    this.staffSearchQuery.set('');
    this.stopDialogPoll();
  }

  onStaffSearch(event: Event): void {
    this.staffSearchQuery.set((event.target as HTMLElement).textContent ?? '');
  }

  isSelected(id: number): boolean {
    return this.selectedRescueIds().includes(id);
  }

  toggleRescuer(id: number): void {
    const cur = this.selectedRescueIds();
    this.selectedRescueIds.set(
      cur.includes(id) ? cur.filter((i) => i !== id) : [...cur, id]
    );
  }

  clearSearch(searchEl: HTMLElement): void {
    this.staffSearchQuery.set('');
    searchEl.textContent = '';
    searchEl.focus();
  }

  clearSelected(searchEl?: HTMLElement): void {
    this.selectedRescueIds.set([]);
    this.staffSearchQuery.set('');
    if (searchEl) searchEl.textContent = '';
  }

  confirmStaffSelection(): void {
    this.staffDialogOpen.set(false);
    this.staffConfirmOpen.set(true);
  }

  cancelStaffConfirm(): void {
    this.staffConfirmOpen.set(false);
    this.staffDialogOpen.set(true);
    this.startDialogPoll();
  }

  saveStaffAssignment(): void {
    const removeIds = new Set(this.staffToRemove().map((r) => r.rescue_id));
    const addIds = this.staffToAdd().map((r) => r.rescue_id);
    this.api
      .getShiftAssignment(this.selectedDate(), this.selectedShiftId())
      .subscribe((latest) => {
        const mergedIds = [
          ...latest.rescue_ids.filter((id: number) => !removeIds.has(id)),
          ...addIds,
        ];
        this.api
          .saveShiftAssignment({
            date: this.selectedDate(),
            shift_id: this.selectedShiftId(),
            rescue_ids: mergedIds,
          })
          .subscribe(() => {
            this.staffConfirmOpen.set(false);
            this.stopDialogPoll();
            this.loadStaffAssignment();
          });
      });
  }
}
