// Google Calendar, for the booking tool.
//
// Two jobs only: read free/busy so slots are not offered over something else,
// and put the booking in the diary with the guest invited. The meeting itself is
// Zoom's - there is no conferenceData handling here.
//
// Auth follows seo-search-console: a refresh token minted once (see
// scripts/booking-google-auth.mjs) exchanged for an access token per call. The
// OAuth client is shared with Search Console, hence the GSC_ names.

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

export interface BusyPeriod {
  start: string;
  end: string;
}

/**
 * The OAuth client that issued the refresh token.
 *
 * A refresh token is bound to the client that minted it, so these two must be
 * the pair used at consent. BOOKING_GOOGLE_CLIENT_ID / _SECRET win when set,
 * falling back to the Search Console client.
 *
 * Both exist because the two ways of minting the token need different client
 * types. scripts/booking-google-auth.mjs uses the Desktop client Search Console
 * already has; Google's OAuth Playground needs a Web client with the Playground
 * registered as a redirect URI, which a Desktop client cannot have. Whichever
 * route was taken, set the matching pair.
 */
function oauthClient(): { id: string; secret: string } {
  return {
    id: Deno.env.get('BOOKING_GOOGLE_CLIENT_ID') || Deno.env.get('GSC_CLIENT_ID') || '',
    secret: Deno.env.get('BOOKING_GOOGLE_CLIENT_SECRET') || Deno.env.get('GSC_CLIENT_SECRET') || '',
  };
}

async function getAccessToken(): Promise<string> {
  const client = oauthClient();
  const refreshToken = Deno.env.get('BOOKING_GOOGLE_REFRESH_TOKEN') ?? '';

  // Naming the missing piece saves a confusing 400 from Google that says only
  // "invalid_client" or "invalid_grant".
  if (!client.id || !client.secret) {
    throw new Error(
      'Google is not configured: set BOOKING_GOOGLE_CLIENT_ID and BOOKING_GOOGLE_CLIENT_SECRET ' +
        '(or rely on GSC_CLIENT_ID and GSC_CLIENT_SECRET).',
    );
  }
  if (!refreshToken) {
    throw new Error('Google is not configured: set BOOKING_GOOGLE_REFRESH_TOKEN.');
  }

  const params = new URLSearchParams({
    client_id: client.id,
    client_secret: client.secret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    // The commonest cause is a refresh token minted by one OAuth client and
    // presented with another's credentials. Google's reply says only
    // "invalid_grant" or "invalid_client", which sends people hunting for a
    // typo instead.
    const hint = /invalid_grant|invalid_client/.test(body)
      ? ' (the refresh token and the client id/secret must come from the SAME OAuth client)'
      : '';
    throw new Error(`Google token error ${res.status}${hint}: ${body}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

/** The calendars that count as busy, from BOOKING_BUSY_CALENDARS (comma separated). */
export function busyCalendarIds(): string[] {
  return (Deno.env.get('BOOKING_BUSY_CALENDARS') ?? 'primary')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

/**
 * Busy periods across the configured calendars, merged into one list.
 *
 * Which calendar a block came from does not matter - the slot builder only needs
 * to know the time is taken.
 */
export async function fetchBusy(timeMin: string, timeMax: string): Promise<BusyPeriod[]> {
  const token = await getAccessToken();
  const ids = busyCalendarIds();

  const res = await fetch(`${CALENDAR_API}/freeBusy`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timeMin,
      timeMax,
      items: ids.map((id) => ({ id })),
    }),
  });

  if (!res.ok) {
    throw new Error(`Google freeBusy failed ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const out: BusyPeriod[] = [];

  for (const id of ids) {
    const calendar = data.calendars?.[id];
    // A calendar the token cannot see comes back with errors rather than busy
    // periods. Treating that as "free" would quietly offer slots over real
    // commitments, so it is loud and fatal instead.
    if (calendar?.errors?.length) {
      throw new Error(`Google freeBusy could not read ${id}: ${JSON.stringify(calendar.errors)}`);
    }
    for (const period of calendar?.busy ?? []) {
      out.push({ start: period.start, end: period.end });
    }
  }

  return out;
}

export interface CalendarEvent {
  eventId: string;
  htmlLink: string | null;
}

/**
 * Creates the booking in the diary, with the guest as an attendee.
 *
 * sendUpdates=all matters: without it Google creates the event silently and the
 * guest never receives the invite. The invite is what puts the meeting in their
 * own calendar, so it is worth the second email alongside our own confirmation.
 */
export async function createCalendarEvent(args: {
  summary: string;
  description: string;
  location: string;
  startsAt: string; // UTC ISO
  endsAt: string; // UTC ISO
  guestEmail: string;
  guestName: string;
}): Promise<CalendarEvent> {
  const token = await getAccessToken();

  const res = await fetch(
    `${CALENDAR_API}/calendars/primary/events?sendUpdates=all`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: args.summary,
        description: args.description,
        location: args.location,
        start: { dateTime: args.startsAt, timeZone: 'UTC' },
        end: { dateTime: args.endsAt, timeZone: 'UTC' },
        attendees: [{ email: args.guestEmail, displayName: args.guestName }],
        reminders: { useDefault: true },
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`Google event create failed ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return { eventId: data.id as string, htmlLink: (data.htmlLink as string) ?? null };
}

/**
 * Cancels the event and tells the guest. A 404 or 410 counts as success - the
 * event is gone either way, which is what the caller wanted.
 */
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  const token = await getAccessToken();

  const res = await fetch(
    `${CALENDAR_API}/calendars/primary/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
  );

  if (res.status === 204 || res.status === 404 || res.status === 410) return true;

  console.error(`[calendar] delete ${eventId} failed ${res.status}: ${await res.text()}`);
  return false;
}
