import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-incident-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="placeholder-page">
      <div class="placeholder-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </div>
      <h1 class="placeholder-title">จัดการข้อมูลรายงานรับแจ้งเหตุ</h1>
      <p class="placeholder-badge">รายงานรับแจ้งเหตุ</p>
      <p class="placeholder-desc">หน้านี้อยู่ระหว่างการพัฒนา</p>
      <a routerLink="/incident/dashboard" class="placeholder-btn">ไปที่แดชบอร์ด</a>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100%; background: #f8fafc; font-family: 'Sarabun', 'Segoe UI', sans-serif; }
    .placeholder-page {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-height: 60vh; padding: 3rem 1.5rem; text-align: center;
    }
    .placeholder-icon {
      width: 72px; height: 72px; border-radius: 20px; display: flex;
      align-items: center; justify-content: center; margin: 0 auto 1.25rem; padding: 16px;
      background: rgba(255, 183, 3, 0.12); color: #FFB703;
    }
    .placeholder-icon svg { width: 100%; height: 100%; }
    .placeholder-title { font-size: 1.5rem; font-weight: 900; color: #1e293b; margin: 0 0 0.5rem; }
    .placeholder-badge {
      display: inline-block; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em;
      text-transform: uppercase; background: rgba(255, 183, 3, 0.1); color: #FFB703;
      border: 1px solid rgba(255, 183, 3, 0.3); border-radius: 20px; padding: 0.2rem 0.75rem;
      margin: 0 0 0.75rem;
    }
    .placeholder-desc { font-size: 0.9rem; color: #94a3b8; margin: 0 0 1.75rem; }
    .placeholder-btn {
      display: inline-flex; align-items: center; background: linear-gradient(135deg, #0077B6, #00B4D8);
      color: #fff; border: none; border-radius: 8px; padding: 0.65rem 1.5rem;
      font-size: 0.9rem; font-family: inherit; font-weight: 700;
      text-decoration: none; transition: filter 0.15s;
    }
    .placeholder-btn:hover { filter: brightness(1.1); }
  `],
})
export class IncidentEdit {}
