// Zoom provider — server-only. Uses Server-to-Server OAuth (a single admin
// Zoom account). Needs ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET
// as secrets. Falls back to "not configured" when they're missing, in which
// case the LMS uses manual link mode.

import type {
  CreateMeetingInput,
  CreateMeetingResult,
  LiveClassProvider,
} from "./types";

const ZOOM_BASE = "https://api.zoom.us/v2";
const ZOOM_TOKEN = "https://zoom.us/oauth/token";

async function getAccessToken(): Promise<string> {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  if (!accountId || !clientId || !clientSecret) {
    throw new Error("Zoom is not configured");
  }
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(
    `${ZOOM_TOKEN}?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
    { method: "POST", headers: { Authorization: `Basic ${basic}` } },
  );
  if (!res.ok) throw new Error(`Zoom auth failed: ${res.status}`);
  const j = (await res.json()) as { access_token: string };
  return j.access_token;
}

function mapRecurrence(r: CreateMeetingInput["recurrence"]) {
  if (!r) return undefined;
  const type = r.type === "daily" ? 1 : r.type === "weekly" ? 2 : 3;
  return {
    type,
    repeat_interval: r.repeatEvery ?? 1,
    end_times: r.endTimes ?? 8,
    weekly_days: r.weeklyDays?.join(","),
  };
}

export const zoomProvider: LiveClassProvider = {
  id: "zoom",
  displayName: "Zoom",

  isConfigured() {
    return Boolean(
      process.env.ZOOM_ACCOUNT_ID &&
      process.env.ZOOM_CLIENT_ID &&
      process.env.ZOOM_CLIENT_SECRET,
    );
  },

  async createMeeting(input: CreateMeetingInput): Promise<CreateMeetingResult> {
    const token = await getAccessToken();
    const body = {
      topic: input.topic.slice(0, 200),
      type: input.isRecurring ? 8 : 2, // 2 scheduled, 8 recurring w/ fixed time
      start_time: input.startAt,
      duration: input.durationMinutes,
      timezone: input.timezone ?? "Asia/Kolkata",
      agenda: input.agenda?.slice(0, 2000),
      password: input.passcode,
      recurrence: mapRecurrence(input.recurrence),
      settings: {
        host_video: true,
        participant_video: false,
        join_before_host: false,
        mute_upon_entry: true,
        waiting_room: input.waitingRoom ?? true,
        approval_type: input.requireRegistration ? 0 : 2,
        auto_recording: input.recordingEnabled ? "cloud" : "none",
        breakout_room: input.breakoutRooms
          ? { enable: true }
          : undefined,
        meeting_authentication: false,
        chat: input.chatEnabled ?? true,
      },
    };

    const path = input.isWebinar ? "/users/me/webinars" : "/users/me/meetings";
    const res = await fetch(`${ZOOM_BASE}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Zoom create failed: ${res.status} ${t.slice(0, 200)}`);
    }
    const j = (await res.json()) as {
      id: number;
      join_url: string;
      start_url: string;
      password?: string;
    };
    return {
      providerMeetingId: String(j.id),
      joinUrl: j.join_url,
      hostUrl: j.start_url,
      passcode: j.password,
      raw: j,
    };
  },

  async deleteMeeting(providerMeetingId: string) {
    const token = await getAccessToken();
    await fetch(`${ZOOM_BASE}/meetings/${providerMeetingId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async fetchAttendance(providerMeetingId: string) {
    const token = await getAccessToken();
    const res = await fetch(
      `${ZOOM_BASE}/report/meetings/${providerMeetingId}/participants?page_size=300`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) return [];
    const j = (await res.json()) as {
      participants?: Array<{ user_email?: string; join_time: string; leave_time: string; duration: number }>;
    };
    return (j.participants ?? []).map((p) => ({
      email: p.user_email ?? "",
      joinTime: p.join_time,
      leaveTime: p.leave_time,
      durationMinutes: Math.round(p.duration / 60),
    }));
  },

  async fetchRecording(providerMeetingId: string) {
    const token = await getAccessToken();
    const res = await fetch(`${ZOOM_BASE}/meetings/${providerMeetingId}/recordings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const j = (await res.json()) as {
      recording_files?: Array<{ play_url?: string; download_url?: string; file_type?: string }>;
    };
    const mp4 = j.recording_files?.find((f) => f.file_type === "MP4");
    if (!mp4?.play_url) return null;
    return { url: mp4.play_url, downloadUrl: mp4.download_url };
  },
};
