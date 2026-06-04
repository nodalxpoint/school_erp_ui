// ─── Matches CreateClassDto.java exactly ─────────────────────────
export interface CreateClassRequest {
  className: string;
  classId: string;   // empty string = create new, UUID = add sections to existing
  sections: string[];
}

// ─── Matches BulkCreateClassDto.java ─────────────────────────────
export interface BulkCreateClassRequest {
  classes: CreateClassRequest[];
}

// ─── Local UI model (not a backend DTO) ──────────────────────────
// Used to display created classes in the UI (stored in component state)
// TODO: replace with real API response once GET endpoint is built
export interface ClassItem {
  id: string;
  className: string;
}

// ─── Matches SectionDto.java exactly ─────────────────────────────
export interface SectionItem {
  id: string;
  sectionName: string;
  classId: string;
}

// ─── Generic API Response wrapper ────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  timestamp?: string;
}