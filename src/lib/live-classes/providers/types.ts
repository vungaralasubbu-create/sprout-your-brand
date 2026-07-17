// Provider abstraction — plug in Zoom today, Google Meet / Teams / Webex later
// without touching the LMS surfaces.

export type LiveProviderId = "zoom" | "google_meet" | "ms_teams" | "webex";

export type CreateMeetingInput = {
  topic: string;
  agenda?: string;
  startAt: string; // ISO
  durationMinutes: number;
  timezone?: string;
  isWebinar?: boolean;
  isRecurring?: boolean;
  recurrence?: {
    type: "daily" | "weekly" | "monthly";
    repeatEvery?: number;
    endTimes?: number;
    weeklyDays?: number[]; // 1-7
  };
  waitingRoom?: boolean;
  requireRegistration?: boolean;
  recordingEnabled?: boolean;
  breakoutRooms?: boolean;
  chatEnabled?: boolean;
  maxParticipants?: number;
  passcode?: string;
};

export type CreateMeetingResult = {
  providerMeetingId: string;
  joinUrl: string;
  hostUrl: string;
  passcode?: string;
  raw?: unknown;
};

export type ProviderConnectionStatus = {
  provider: LiveProviderId;
  isConnected: boolean;
  accountEmail?: string | null;
  accountName?: string | null;
  connectedAt?: string | null;
  expiresAt?: string | null;
  lastError?: string | null;
};

export interface LiveClassProvider {
  readonly id: LiveProviderId;
  readonly displayName: string;
  isConfigured(): boolean;
  createMeeting(input: CreateMeetingInput): Promise<CreateMeetingResult>;
  deleteMeeting?(providerMeetingId: string): Promise<void>;
  fetchAttendance?(providerMeetingId: string): Promise<
    Array<{ email: string; joinTime: string; leaveTime: string; durationMinutes: number }>
  >;
  fetchRecording?(providerMeetingId: string): Promise<{ url: string; downloadUrl?: string } | null>;
}
