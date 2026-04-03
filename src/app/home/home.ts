import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="home-page">
      <div class="home-hero">
        <svg
          class="hero-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke-linejoin="round" />
          <path d="M2 17L12 22L22 17" stroke-linejoin="round" />
          <path d="M2 12L12 17L22 12" stroke-linejoin="round" />
        </svg>
        <h1 class="hero-title">ระบบศูนย์รับแจ้งเหตุฯ</h1>
        <p class="hero-sub">ศูนย์รับแจ้งเหตุและสั่งการจังหวัดปัตตานี</p>
      </div>

      <div class="section-title">รายงานรับแจ้งเหตุ</div>
      <div class="card-grid">
        <a routerLink="/incident/dashboard" class="nav-card nav-card-blue">
          <div class="nav-card-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </div>
          <div class="nav-card-body">
            <div class="nav-card-title">แดชบอร์ด</div>
            <div class="nav-card-desc">
              ติดตามการรับแจ้งเหตุแบบเรียลไทม์ บันทึกเหตุ และกำหนดเจ้าหน้าที่ประจำเวร
            </div>
          </div>
          <svg
            class="nav-card-arrow"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </a>

        <a routerLink="/incident/summary" class="nav-card nav-card-purple">
          <div class="nav-card-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <div class="nav-card-body">
            <div class="nav-card-title">สรุปผล</div>
            <div class="nav-card-desc">รายงานสรุปสถิติการรับแจ้งเหตุ แยกตามประเภทและช่วงเวลา</div>
          </div>
          <svg
            class="nav-card-arrow"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </a>

        <a routerLink="/incident/edit" class="nav-card nav-card-yellow">
          <div class="nav-card-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </div>
          <div class="nav-card-body">
            <div class="nav-card-title">จัดการข้อมูล</div>
            <div class="nav-card-desc">แก้ไข เพิ่ม และลบข้อมูลการรับแจ้งเหตุ</div>
          </div>
          <svg
            class="nav-card-arrow"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </a>
      </div>

      <div class="section-title">รวมหน่วยกู้ชีพ</div>
      <div class="card-grid">
        <a routerLink="/rescue/map" class="nav-card nav-card-green">
          <div class="nav-card-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
          </div>
          <div class="nav-card-body">
            <div class="nav-card-title">แผนที่</div>
            <div class="nav-card-desc">ตำแหน่งและสถานะของหน่วยกู้ชีพทั้งหมดในพื้นที่</div>
          </div>
          <svg
            class="nav-card-arrow"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </a>

        <a routerLink="/rescue/summary" class="nav-card nav-card-purple">
          <div class="nav-card-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <div class="nav-card-body">
            <div class="nav-card-title">สรุปผล</div>
            <div class="nav-card-desc">รายงานสรุปข้อมูลหน่วยกู้ชีพ การปฏิบัติงาน และสถิติ</div>
          </div>
          <svg
            class="nav-card-arrow"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </a>

        <a routerLink="/rescue/edit" class="nav-card nav-card-yellow">
          <div class="nav-card-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </div>
          <div class="nav-card-body">
            <div class="nav-card-title">จัดการข้อมูล</div>
            <div class="nav-card-desc">เพิ่ม แก้ไข และจัดการข้อมูลหน่วยกู้ชีพ</div>
          </div>
          <svg
            class="nav-card-arrow"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </a>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100%;
        background: #f8fafc;
        font-family: 'Sarabun', 'Segoe UI', sans-serif;
      }

      .home-page {
        max-width: 960px;
        margin: 0 auto;
        padding: 2rem 1.5rem 3rem;
      }

      /* Hero */
      .home-hero {
        text-align: center;
        padding: 2.5rem 1rem 2rem;
        margin-bottom: 0.5rem;
      }

      .hero-icon {
        width: 56px;
        height: 56px;
        color: #00b4d8;
        margin: 0 auto 1rem;
        display: block;
      }

      .hero-title {
        font-size: 2rem;
        font-weight: 900;
        margin: 0 0 0.5rem;
        background: linear-gradient(90deg, #00b4d8 0%, #023e8a 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: 0.02em;
      }

      .hero-sub {
        font-size: 1rem;
        color: #64748b;
        margin: 0;
      }

      /* Section */
      .section-title {
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #94a3b8;
        margin: 1.75rem 0 0.75rem;
        padding-left: 0.25rem;
      }

      /* Cards */
      .card-grid {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }

      .nav-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem 1.25rem;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        text-decoration: none;
        transition:
          transform 0.15s,
          box-shadow 0.15s,
          border-color 0.15s;
        cursor: pointer;
      }

      .nav-card:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      }

      .nav-card-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        padding: 10px;
      }

      .nav-card-icon svg {
        width: 100%;
        height: 100%;
      }

      .nav-card-body {
        flex: 1;
        min-width: 0;
      }

      .nav-card-title {
        font-size: 0.95rem;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 0.2rem;
      }

      .nav-card-desc {
        font-size: 0.82rem;
        color: #64748b;
        line-height: 1.4;
      }

      .nav-card-arrow {
        flex-shrink: 0;
        color: #cbd5e1;
        transition:
          color 0.15s,
          transform 0.15s;
      }

      .nav-card:hover .nav-card-arrow {
        transform: translateX(3px);
      }

      /* Color variants */
      .nav-card-blue .nav-card-icon {
        background: rgba(0, 180, 216, 0.1);
        color: #00b4d8;
      }
      .nav-card-blue:hover {
        border-color: rgba(0, 180, 216, 0.4);
      }
      .nav-card-blue:hover .nav-card-arrow {
        color: #00b4d8;
      }

      .nav-card-purple .nav-card-icon {
        background: rgba(157, 78, 221, 0.1);
        color: #9d4edd;
      }
      .nav-card-purple:hover {
        border-color: rgba(157, 78, 221, 0.4);
      }
      .nav-card-purple:hover .nav-card-arrow {
        color: #9d4edd;
      }

      .nav-card-yellow .nav-card-icon {
        background: rgba(255, 183, 3, 0.1);
        color: #ffb703;
      }
      .nav-card-yellow:hover {
        border-color: rgba(255, 183, 3, 0.4);
      }
      .nav-card-yellow:hover .nav-card-arrow {
        color: #ffb703;
      }

      .nav-card-green .nav-card-icon {
        background: rgba(6, 214, 160, 0.1);
        color: #06d6a0;
      }
      .nav-card-green:hover {
        border-color: rgba(6, 214, 160, 0.4);
      }
      .nav-card-green:hover .nav-card-arrow {
        color: #06d6a0;
      }
    `,
  ],
})
export class Home {}
