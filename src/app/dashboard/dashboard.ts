import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  afterNextRender,
  OnDestroy,
  viewChild,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TuiDay, TuiYear } from '@taiga-ui/cdk';
import {
  TUI_MONTHS,
  TUI_SHORT_WEEK_DAYS,
  TuiScrollbar,
  TuiTextfieldOptionsDirective,
  TuiInput,
} from '@taiga-ui/core';
import { TuiInputDate } from '@taiga-ui/kit';
import { TuiInputDateDirective } from '@taiga-ui/kit/components/input-date';
import { tuiDateFormatProvider } from '@taiga-ui/core/tokens';
import { ApiService } from '../services/api.service';
import type {
  Rescue,
  ShiftWork,
  ChangeEntry,
  IncidentRecord,
  IncidentSummary,
  IncidentStep,
} from '../models/types';

// เวลา HH:MM:SS → นาทีที่ปรับสำหรับกะบ่าย (00:00–00:29 ถือว่าเป็น 24:00–24:29)
function toShiftMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m;
  return total < 30 ? total + 24 * 60 : total;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TuiInput,
    TuiTextfieldOptionsDirective,
    TuiInputDate,
    NgOptimizedImage,
  ],
  providers: [
    tuiDateFormatProvider({ mode: 'dd/mm/yyyy', separator: '/' }),
    {
      provide: TUI_MONTHS,
      useValue: signal([
        'มกราคม',
        'กุมภาพันธ์',
        'มีนาคม',
        'เมษายน',
        'พฤษภาคม',
        'มิถุนายน',
        'กรกฎาคม',
        'สิงหาคม',
        'กันยายน',
        'ตุลาคม',
        'พฤศจิกายน',
        'ธันวาคม',
      ] as const),
    },
    {
      provide: TUI_SHORT_WEEK_DAYS,
      useValue: signal(['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'] as const),
    },
  ],
})
export class Dashboard implements OnDestroy {
  private api = inject(ApiService);
  private clockInterval?: ReturnType<typeof setInterval>;
  private eventSource?: EventSource;
  private shiftCheckTimer?: ReturnType<typeof setTimeout>;
  private mainReady = false;
  private prevIncidentTotal = -1;
  private beYearObserver?: MutationObserver;

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
  readonly minDay = new TuiDay(2026, 2, 16); // March 16, 2026  (month is 0-indexed)
  readonly maxDay = new TuiDay(2031, 11, 31); // December 31, 2031

  readonly dateControl = new FormControl<TuiDay | null>(this.initialShiftTuiDay());

  private readonly inputDateDir = viewChild(TuiInputDateDirective);

  selectedDate = signal<string>(this.initialShiftDateISO());

  // ── Shifts ────────────────────────────────────────────────────────────────
  shifts = signal<ShiftWork[]>([]);
  selectedShiftId = signal<number>(this.getCurrentShiftId());
  shiftDropdownOpen = signal<boolean>(false);

  selectedShiftName = computed(() => {
    const shift = this.shifts().find((s) => s.shiftwork_id === this.selectedShiftId());
    return shift?.shiftwork_name ?? '';
  });

  currentShiftName = computed(() => {
    const total = this.currentTime().getHours() * 60 + this.currentTime().getMinutes();
    if (total >= 510 && total < 990) return 'เช้า';
    if (total >= 30 && total < 510) return 'ดึก';
    return 'บ่าย';
  });

  // ── Summary ───────────────────────────────────────────────────────────────
  summary = signal<IncidentSummary | null>(null);
  previousSummary = signal<IncidentSummary | null>(null);

  summaryDiff = computed(() => {
    const cur = this.summary();
    const prev = this.previousSummary();
    if (!cur || !prev) return null;
    return {
      total: cur.total - prev.total,
      แจ้งเหตุ: cur['แจ้งเหตุ'].total - prev['แจ้งเหตุ'].total,
      ปรึกษา: cur['ปรึกษา'] - prev['ปรึกษา'],
      สายหลุด: cur['สายหลุด'] - prev['สายหลุด'],
      ก่อกวน: cur['ก่อกวน'] - prev['ก่อกวน'],
    };
  });

  // ── Incident dialog ───────────────────────────────────────────────────────
  incidentStep = signal<IncidentStep>('');
  selectedIncidentType = signal<string>('');
  selectedSubtype = signal<string>('');
  selectedLevel = signal<string>('');

  // ── Info dialog ───────────────────────────────────────────────────────────
  infoOpen = signal<boolean>(false);

  // ── History dialog ────────────────────────────────────────────────────────
  historyOpen = signal<boolean>(false);
  incidentHistory = signal<IncidentRecord[]>([]);

  // ── Staff ─────────────────────────────────────────────────────────────────
  rescuers = signal<Rescue[]>([]);
  staffDialogOpen = signal<boolean>(false);
  staffConfirmOpen = signal<boolean>(false);
  staffSearchQuery = signal<string>('');
  selectedRescueIds = signal<number[]>([]);
  assignedRescuers = signal<Rescue[]>([]);
  dialogBaseIds = signal<number[]>([]);
  dialogToasts = signal<
    { id: number; names: string[]; type: 'add' | 'remove'; time: string; own: boolean }[]
  >([]);
  incidentToasts = signal<
    {
      id: number;
      incType: string;
      subtype: string | null;
      level: string | null;
      time: string;
      own: boolean;
    }[]
  >([]);
  allToasts = computed(() =>
    [
      ...this.dialogToasts().map((t) => ({ ...t, kind: 'dialog' as const })),
      ...this.incidentToasts().map((t) => ({ ...t, kind: 'incident' as const })),
    ].sort((a, b) => toShiftMinutes(a.time) - toShiftMinutes(b.time)),
  );
  private toastIdSeq = 0;

  filteredRescuers = computed(() => {
    const q = this.staffSearchQuery().toLowerCase().trim();
    if (!q) return this.rescuers();
    return this.rescuers().filter((r) => r.rescue_name.toLowerCase().includes(q));
  });

  selectedRescuersForConfirm = computed(() =>
    this.rescuers().filter((r) => this.selectedRescueIds().includes(r.rescue_id)),
  );

  staffToAdd = computed(() => {
    const base = this.dialogBaseIds();
    return this.selectedRescuersForConfirm().filter((r) => !base.includes(r.rescue_id));
  });

  staffToRemove = computed(() => {
    const selected = this.selectedRescueIds();
    return this.rescuers().filter(
      (r) => this.dialogBaseIds().includes(r.rescue_id) && !selected.includes(r.rescue_id),
    );
  });

  staffUnchanged = computed(() => {
    const base = this.dialogBaseIds();
    return this.selectedRescuersForConfirm().filter((r) => base.includes(r.rescue_id));
  });

  // ─────────────────────────────────────────────────────────────────────────

  constructor() {
    // แสดงปีเป็น พ.ศ. ใน calendar header (CE + 543)
    Object.defineProperty(TuiYear.prototype, 'formattedYear', {
      get(this: TuiYear) {
        return String(this.year + 543).padStart(4, '0');
      },
      configurable: true,
    });

    this.dateControl.valueChanges.subscribe((day) => {
      if (day) {
        const iso = `${day.year}-${String(day.month + 1).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`;
        this.selectedDate.set(iso);
        this.mainReady = false;
        this.prevIncidentTotal = -1;
        this.loadSummary();
        this.loadStaffAssignment();
      }
    });

    afterNextRender(() => {
      this.clockInterval = setInterval(() => this.currentTime.set(new Date()), 1000);

      this.eventSource = this.api.subscribeToEvents();
      this.eventSource.addEventListener('incident_created', () => {
        this.loadSummary();
        this.loadStaffAssignment();
        if (this.historyOpen()) {
          this.api
            .getIncidentList(this.selectedDate(), this.selectedShiftId())
            .subscribe((list) => {
              this.incidentHistory.set(list);
            });
        }
      });
      this.eventSource.addEventListener('staff_updated', () => {
        this.loadSummary();
        if (this.staffDialogOpen()) {
          this.pollDialogState();
        } else {
          this.loadStaffAssignment();
        }
      });

      // แปลง ค.ศ. → พ.ศ. ใน year picker grid ({{ item }} ไม่ใช้ formattedYear)
      const convertYears = () => {
        this.beYearObserver!.disconnect();
        document.querySelectorAll('tui-calendar-year .t-cell').forEach((cell) => {
          const year = parseInt((cell as HTMLElement).textContent?.trim() ?? '', 10);
          if (!isNaN(year) && year > 1900 && year < 2543) {
            (cell as HTMLElement).textContent = String(year + 543);
          }
        });
        this.beYearObserver!.observe(document.body, { childList: true, subtree: true });
      };
      this.beYearObserver = new MutationObserver(convertYears);
      this.beYearObserver.observe(document.body, { childList: true, subtree: true });

      this.scheduleShiftCheck();
      this.loadShifts();
      this.loadRescuers();
      this.loadSummary();
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.clockInterval);
    clearTimeout(this.shiftCheckTimer);
    this.eventSource?.close();
    this.beYearObserver?.disconnect();
  }

  setToday(): void {
    const shiftId = this.getCurrentShiftId();
    this.selectedShiftId.set(shiftId);
    this.inputDateDir()?.setDate(this.initialShiftTuiDay());
  }

  private groupByChangelog(
    ids: number[],
    field: 'added' | 'removed',
    changes: ChangeEntry[] | undefined,
    fallback?: string,
  ): Map<string, number[]> {
    const grouped = new Map<string, number[]>();
    for (const id of ids) {
      let time = fallback ?? this.nowHHMMSS();
      if (changes) {
        for (let i = changes.length - 1; i >= 0; i--) {
          if (changes[i][field].includes(id)) {
            time = changes[i].saved_at;
            break;
          }
        }
      }
      grouped.set(time, [...(grouped.get(time) ?? []), id]);
    }
    return grouped;
  }

  private nowHHMMSS(): string {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  }

  private addIncidentToast(
    incType: string,
    subtype: string | null,
    level: string | null,
    own: boolean,
    time?: string,
  ): void {
    const id = ++this.toastIdSeq;
    this.incidentToasts.update((list) =>
      [...list, { id, incType, subtype, level, time: time ?? this.nowHHMMSS(), own }].sort((a, b) =>
        a.time.localeCompare(b.time),
      ),
    );
    setTimeout(() => {
      this.incidentToasts.update((list) => list.filter((t) => t.id !== id));
    }, 6000);
  }

  private addToast(names: string[], type: 'add' | 'remove', own = false, time?: string): void {
    const id = ++this.toastIdSeq;
    this.dialogToasts.update((list) =>
      [...list, { id, names, type, time: time ?? this.nowHHMMSS(), own }].sort((a, b) =>
        a.time.localeCompare(b.time),
      ),
    );
    setTimeout(() => {
      this.dialogToasts.update((list) => list.filter((t) => t.id !== id));
    }, 6000);
  }

  dismissToast(id: number): void {
    this.incidentToasts.update((list) => list.filter((t) => t.id !== id));
    this.dialogToasts.update((list) => list.filter((t) => t.id !== id));
  }

  private pollDialogState(): void {
    this.api
      .getShiftAssignment(this.assignmentDate(), this.selectedShiftId())
      .subscribe((result) => {
        const latestIds: number[] = result.rescue_ids;
        const base = this.dialogBaseIds();

        const externalAdded = latestIds.filter((id) => !base.includes(id));
        const externalRemoved = base.filter((id) => !latestIds.includes(id));

        if (externalAdded.length > 0) {
          for (const [time, ids] of this.groupByChangelog(
            externalAdded,
            'added',
            result.changes,
            result.saved_at,
          )) {
            const names = this.rescuers()
              .filter((r) => ids.includes(r.rescue_id))
              .map((r) => r.rescue_name);
            this.addToast(names, 'add', false, time);
          }
        }
        if (externalRemoved.length > 0) {
          for (const [time, ids] of this.groupByChangelog(
            externalRemoved,
            'removed',
            result.changes,
            result.saved_at,
          )) {
            const names = this.rescuers()
              .filter((r) => ids.includes(r.rescue_id))
              .map((r) => r.rescue_name);
            this.addToast(names, 'remove', false, time);
          }
        }

        const selected = this.selectedRescueIds();
        const userAdded = selected.filter((id) => !base.includes(id));
        const userRemoved = new Set(base.filter((id) => !selected.includes(id)));
        const newSelected = [
          ...latestIds.filter((id) => !userRemoved.has(id)),
          ...userAdded.filter((id) => !latestIds.includes(id)),
        ];
        this.dialogBaseIds.set(latestIds);
        this.selectedRescueIds.set(newSelected);
        this.assignedRescuers.set(this.rescuers().filter((r) => latestIds.includes(r.rescue_id)));
      });
  }

  // ดึก (shift_id=3) เป็นเวรของคืนก่อนหน้า → ใช้ date ย้อนหลัง 1 วันสำหรับ shift-assignment
  private assignmentDate(): string {
    if (this.selectedShiftId() !== 3) return this.selectedDate();
    const d = new Date(this.selectedDate() + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
    if (total >= 30 && total < 510) return 3; // 00:30–08:30 ดึก
    return 2; // 16:30–00:30 บ่าย
  }

  private msUntilNextShiftBoundary(): number {
    const now = new Date();
    const nowMs =
      (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) * 1000 +
      now.getMilliseconds();
    const dayMs = 24 * 60 * 60 * 1000;
    // boundaries: 00:30 (30min), 08:30 (510min), 16:30 (990min)
    for (const minBoundary of [30, 510, 990]) {
      const boundaryMs = minBoundary * 60 * 1000;
      if (boundaryMs > nowMs) return boundaryMs - nowMs;
    }
    return dayMs - nowMs + 30 * 60 * 1000; // next 00:30
  }

  // ── Shift date helpers ────────────────────────────────────────────────────

  // บ่าย ช่วง 00:00–00:30 ข้ามเที่ยงคืน → ใช้วันก่อนหน้าเป็น selectedDate
  private initialShiftDateISO(): string {
    const shiftId = this.getCurrentShiftId();
    if (shiftId === 2) {
      const now = new Date();
      if (now.getHours() * 60 + now.getMinutes() < 30) {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
    }
    return this.todayISO();
  }

  private initialShiftTuiDay(): TuiDay {
    const shiftId = this.getCurrentShiftId();
    if (shiftId === 2) {
      const now = new Date();
      if (now.getHours() * 60 + now.getMinutes() < 30) {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return new TuiDay(d.getFullYear(), d.getMonth(), d.getDate());
      }
    }
    return TuiDay.currentLocal();
  }

  private scheduleShiftCheck(): void {
    clearTimeout(this.shiftCheckTimer);
    this.shiftCheckTimer = setTimeout(() => {
      this.selectedShiftId.set(this.getCurrentShiftId());
      this.selectedDate.set(this.todayISO());
      this.dateControl.setValue(TuiDay.currentLocal(), { emitEvent: false });
      this.mainReady = false;
      this.prevIncidentTotal = -1;
      this.loadSummary();
      this.loadStaffAssignment();
      this.scheduleShiftCheck();
    }, this.msUntilNextShiftBoundary() + 100);
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

  private loadPreviousSummary(): void {
    const d = new Date(this.selectedDate() + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    const prevDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    this.api.getIncidentSummary(prevDate, this.selectedShiftId()).subscribe((data) => {
      this.previousSummary.set(data);
    });
  }

  loadSummary(): void {
    this.loadPreviousSummary();
    this.api.getIncidentSummary(this.selectedDate(), this.selectedShiftId()).subscribe((data) => {
      const prevTotal = this.prevIncidentTotal;
      const newTotal = data.total;
      this.summary.set(data);
      if (prevTotal !== -1 && newTotal > prevTotal) {
        this.api
          .getIncidentList(this.selectedDate(), this.selectedShiftId())
          .subscribe((incidents: IncidentRecord[]) => {
            for (const inc of incidents.slice(prevTotal)) {
              this.addIncidentToast(inc.type, inc.subtype, inc.level, false, inc.saved_at);
            }
          });
      }
      this.prevIncidentTotal = newTotal;
    });
  }

  loadStaffAssignment(): void {
    this.api
      .getShiftAssignment(this.assignmentDate(), this.selectedShiftId())
      .subscribe((result) => {
        const ids: number[] = result.rescue_ids;
        if (this.mainReady && !this.staffDialogOpen() && !this.staffConfirmOpen()) {
          const prev = this.assignedRescuers().map((r) => r.rescue_id);
          const added = ids.filter((id) => !prev.includes(id));
          const removed = prev.filter((id) => !ids.includes(id));
          if (added.length > 0) {
            for (const [time, ids] of this.groupByChangelog(
              added,
              'added',
              result.changes,
              result.saved_at,
            )) {
              const names = this.rescuers()
                .filter((r) => ids.includes(r.rescue_id))
                .map((r) => r.rescue_name);
              this.addToast(names, 'add', false, time);
            }
          }
          if (removed.length > 0) {
            for (const [time, ids] of this.groupByChangelog(
              removed,
              'removed',
              result.changes,
              result.saved_at,
            )) {
              const names = this.rescuers()
                .filter((r) => ids.includes(r.rescue_id))
                .map((r) => r.rescue_name);
              this.addToast(names, 'remove', false, time);
            }
          }
        }
        this.assignedRescuers.set(this.rescuers().filter((r) => ids.includes(r.rescue_id)));
        this.mainReady = true;
      });
  }

  // ── Controls ──────────────────────────────────────────────────────────────

  onShiftChange(event: Event): void {
    this.selectedShiftId.set(Number((event.target as HTMLSelectElement).value));
    this.mainReady = false;
    this.prevIncidentTotal = -1;
    this.loadSummary();
    this.loadStaffAssignment();
  }

  selectShift(id: number): void {
    this.selectedShiftId.set(id);
    this.shiftDropdownOpen.set(false);
    this.mainReady = false;
    this.prevIncidentTotal = -1;
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

  // ── Info dialog ───────────────────────────────────────────────────────────

  openInfoDialog(): void {
    this.infoOpen.set(true);
  }
  closeInfoDialog(): void {
    this.infoOpen.set(false);
  }

  // ── History dialog ────────────────────────────────────────────────────────

  openHistoryDialog(): void {
    this.api.getIncidentList(this.selectedDate(), this.selectedShiftId()).subscribe((list) => {
      this.incidentHistory.set(list);
      this.historyOpen.set(true);
    });
  }
  closeHistoryDialog(): void {
    this.historyOpen.set(false);
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
    const incType = this.selectedIncidentType();
    const subtype = this.selectedSubtype() || null;
    const level = this.selectedLevel() || null;
    this.api
      .createIncident({
        date: this.selectedDate(),
        shift_id: this.selectedShiftId(),
        type: incType,
        subtype,
        level,
      })
      .subscribe((res) => {
        this.addIncidentToast(incType, subtype, level, true, res.saved_at);
        this.closeIncidentDialog();
        this.prevIncidentTotal = -1;
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
  }

  closeStaffDialog(): void {
    this.staffDialogOpen.set(false);
    this.staffSearchQuery.set('');
  }

  onStaffSearch(event: Event): void {
    this.staffSearchQuery.set((event.target as HTMLElement).textContent ?? '');
  }

  isSelected(id: number): boolean {
    return this.selectedRescueIds().includes(id);
  }

  getItemStatus(id: number): 'add' | 'remove' | 'keep' | null {
    const inBase = this.dialogBaseIds().includes(id);
    const selected = this.selectedRescueIds().includes(id);
    if (selected && !inBase) return 'add';
    if (!selected && inBase) return 'remove';
    if (selected && inBase) return 'keep';
    return null;
  }

  toggleRescuer(id: number): void {
    const cur = this.selectedRescueIds();
    this.selectedRescueIds.set(cur.includes(id) ? cur.filter((i) => i !== id) : [...cur, id]);
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
  }

  closeStaffConfirm(): void {
    this.staffConfirmOpen.set(false);
  }

  saveStaffAssignment(): void {
    const toAddNames = this.staffToAdd().map((r) => r.rescue_name);
    const toRemoveNames = this.staffToRemove().map((r) => r.rescue_name);
    const removeIds = new Set(this.staffToRemove().map((r) => r.rescue_id));
    const addIds = this.staffToAdd().map((r) => r.rescue_id);
    this.api
      .getShiftAssignment(this.assignmentDate(), this.selectedShiftId())
      .subscribe((latest) => {
        const mergedIds = [
          ...latest.rescue_ids.filter((id: number) => !removeIds.has(id)),
          ...addIds,
        ];
        this.api
          .saveShiftAssignment({
            date: this.assignmentDate(),
            shift_id: this.selectedShiftId(),
            rescue_ids: mergedIds,
          })
          .subscribe((res) => {
            this.staffConfirmOpen.set(false);
            this.mainReady = false;
            if (toAddNames.length > 0) this.addToast(toAddNames, 'add', true, res.saved_at);
            if (toRemoveNames.length > 0)
              this.addToast(toRemoveNames, 'remove', true, res.saved_at);
            this.loadStaffAssignment();
          });
      });
  }
}
