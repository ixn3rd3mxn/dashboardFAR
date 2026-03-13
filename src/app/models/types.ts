export interface Rescue {
  rescue_id: number;
  rescue_name: string;
}

export interface ShiftWork {
  shiftwork_id: number;
  shiftwork_name: string;
}

export interface IncidentCreate {
  date: string;
  shift_id: number;
  type: string;
  subtype: string | null;
  level: string | null;
}

export interface IncidentSubSummary {
  total: number;
  '1669': number;
  '2nd': number;
  วิทยุ: number;
  trauma: number;
  non_trauma: number;
}

export interface IncidentSummary {
  total: number;
  แจ้งเหตุ: IncidentSubSummary;
  ปรึกษา: number;
  สายขาด: number;
  ก่อกวน: number;
}

export interface ShiftAssignmentCreate {
  date: string;
  shift_id: number;
  rescue_ids: number[];
}

export interface SaveResponse {
  message: string;
  saved_at: string;
}

export interface ChangeEntry {
  added: number[];
  removed: number[];
  saved_at: string;
}

export interface ShiftAssignmentResult {
  date: string;
  shift_id: number;
  rescue_ids: number[];
  saved_at?: string;
  changes?: ChangeEntry[];
}

export interface IncidentRecord {
  date: string;
  shift_id: number;
  type: string;
  subtype: string | null;
  level: string | null;
  saved_at?: string;
}

export type IncidentStep = '' | 'type' | 'subtype' | 'level' | 'confirm';
