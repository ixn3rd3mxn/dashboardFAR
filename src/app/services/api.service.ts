import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  Rescue,
  ShiftWork,
  IncidentCreate,
  IncidentRecord,
  IncidentSummary,
  SaveResponse,
  ShiftAssignmentCreate,
  ShiftAssignmentResult,
} from '../models/types';

const API_URL = 'http://192.168.1.10:8000';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  getRescuers(): Observable<Rescue[]> {
    return this.http.get<Rescue[]>(`${API_URL}/rescue`);
  }

  getShifts(): Observable<ShiftWork[]> {
    return this.http.get<ShiftWork[]>(`${API_URL}/shiftwork`);
  }

  createIncident(data: IncidentCreate): Observable<SaveResponse> {
    return this.http.post<SaveResponse>(`${API_URL}/incident`, data);
  }

  getIncidentSummary(date: string, shiftId: number): Observable<IncidentSummary> {
    return this.http.get<IncidentSummary>(`${API_URL}/incident/summary`, {
      params: { date, shift_id: shiftId },
    });
  }

  subscribeToEvents(): EventSource {
    return new EventSource(`${API_URL}/events`);
  }

  getIncidentList(date: string, shiftId: number): Observable<IncidentRecord[]> {
    return this.http.get<IncidentRecord[]>(`${API_URL}/incident/list`, {
      params: { date, shift_id: shiftId },
    });
  }

  saveShiftAssignment(data: ShiftAssignmentCreate): Observable<SaveResponse> {
    return this.http.post<SaveResponse>(`${API_URL}/shift-assignment`, data);
  }

  getShiftAssignment(date: string, shiftId: number): Observable<ShiftAssignmentResult> {
    return this.http.get<ShiftAssignmentResult>(`${API_URL}/shift-assignment`, {
      params: { date, shift_id: shiftId },
    });
  }
}
