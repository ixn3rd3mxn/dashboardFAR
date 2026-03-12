import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  Rescue,
  ShiftWork,
  IncidentCreate,
  IncidentSummary,
  ShiftAssignmentCreate,
  ShiftAssignmentResult,
} from '../models/types';

const API_URL = 'http://192.168.1.147:8000';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  getRescuers(): Observable<Rescue[]> {
    return this.http.get<Rescue[]>(`${API_URL}/rescue`);
  }

  getShifts(): Observable<ShiftWork[]> {
    return this.http.get<ShiftWork[]>(`${API_URL}/shiftwork`);
  }

  createIncident(data: IncidentCreate): Observable<unknown> {
    return this.http.post(`${API_URL}/incident`, data);
  }

  getIncidentSummary(date: string, shiftId: number): Observable<IncidentSummary> {
    return this.http.get<IncidentSummary>(`${API_URL}/incident/summary`, {
      params: { date, shift_id: shiftId },
    });
  }

  saveShiftAssignment(data: ShiftAssignmentCreate): Observable<unknown> {
    return this.http.post(`${API_URL}/shift-assignment`, data);
  }

  getShiftAssignment(date: string, shiftId: number): Observable<ShiftAssignmentResult> {
    return this.http.get<ShiftAssignmentResult>(`${API_URL}/shift-assignment`, {
      params: { date, shift_id: shiftId },
    });
  }
}
