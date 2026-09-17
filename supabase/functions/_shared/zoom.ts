// Zoom, for the booking tool.
//
// Server-to-Server OAuth: three secrets, a token minted per invocation, no
// refresh token to keep alive and no consent screen to re-approve. Create the
// app under Develop > Build App > Server-to-Server OAuth in the Zoom
// Marketplace; it needs meeting write and delete scopes.

const ZOOM_API = 'https://api.zoom.us/v2';

export interface ZoomMeeting {
  /** Numeric meeting id, as a string. Needed to delete the meeting later. */
  meetingId: string;
  /** The link the guest opens. */
  joinUrl: string;
  passcode: string | null;
}

/**
 * An access token for the Zoom account, good for about an hour.
 *
 * Minted per invocation rather than cached: edge functions are short-lived, and
 * a token that outlives the request is a credential with nowhere safe to sit.
 */
async function getAccessToken(): Promise<string> {
  const accountId = Deno.env.get('ZOOM_ACCOUNT_ID') ?? '';
  const clientId = Deno.env.get('ZOOM_CLIENT_ID') ?? '';
  const clientSecret = Deno.env.get('ZOOM_CLIENT_SECRET') ?? '';

  if (!accountId || !clientId || !clientSecret) {
    throw new Error('Zoom is not configured: set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET.');
  }

  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  );

  if (!res.ok) {
    throw new Error(`Zoom token error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

/**
 * A scheduled meeting for one booking.
 *
 * Deliberately a fresh meeting each time rather than the host's Personal Meeting
 * Room: with back-to-back bookings a shared room lets the next guest walk in on
 * the previous one. The waiting room is on for the same reason.
 *
 * The response's start_url is deliberately dropped. It embeds a host token, so
 * anyone holding it can start the meeting as the host, and it expires in about
 * two hours anyway. The host starts the meeting from their own calendar.
 */
export async function createZoomMeeting(args: {
  topic: string;
  startsAt: string; // UTC ISO
  durationMinutes: number;
  agenda?: string;
}): Promise<ZoomMeeting> {
  const token = await getAccessToken();
  const hostEmail = Deno.env.get('ZOOM_HOST_EMAIL') || 'me';

  const res = await fetch(`${ZOOM_API}/users/${encodeURIComponent(hostEmail)}/meetings`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: args.topic,
      type: 2, // scheduled
      start_time: args.startsAt,
      duration: args.durationMinutes,
      timezone: 'UTC',
      agenda: args.agenda ?? '',
      settings: {
        waiting_room: true,
        join_before_host: false,
        // The guest is emailed the link by us and by the calendar invite, so
        // Zoom's own registration flow would only add a second front door.
        approval_type: 2, // no registration required
        auto_recording: 'none',
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Zoom meeting create failed ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return {
    meetingId: String(data.id),
    joinUrl: data.join_url as string,
    passcode: (data.password as string) || null,
  };
}

/**
 * Deletes a meeting. Returns true when it is gone, including when it was
 * already gone.
 *
 * A 404 counts as success so a retry after a partial failure is not blocked by
 * work that already happened.
 */
export async function deleteZoomMeeting(meetingId: string): Promise<boolean> {
  const token = await getAccessToken();

  const res = await fetch(`${ZOOM_API}/meetings/${encodeURIComponent(meetingId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 204 || res.status === 404) return true;

  console.error(`[zoom] delete ${meetingId} failed ${res.status}: ${await res.text()}`);
  return false;
}
