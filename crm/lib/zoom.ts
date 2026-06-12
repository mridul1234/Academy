type ZoomTokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
  reason?: string;
};

type ZoomMeetingResponse = {
  id: number;
  topic: string;
  start_url: string;
  join_url: string;
};

type CreateZoomMeetingInput = {
  topic: string;
  startsAt: string;
  durationMinutes: number;
};

const zoomTokenUrl = 'https://zoom.us/oauth/token';
const zoomApiBaseUrl = 'https://api.zoom.us/v2';

function zoomConfig() {
  return {
    accountId: process.env.ZOOM_ACCOUNT_ID,
    clientId: process.env.ZOOM_CLIENT_ID,
    clientSecret: process.env.ZOOM_CLIENT_SECRET,
    userId: process.env.ZOOM_USER_ID || 'me',
  };
}

export function isZoomConfigured() {
  const config = zoomConfig();
  return Boolean(config.accountId && config.clientId && config.clientSecret);
}

async function getZoomAccessToken() {
  const config = zoomConfig();
  if (!config.accountId || !config.clientId || !config.clientSecret) {
    throw new Error('Zoom API is not configured.');
  }

  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
  const res = await fetch(`${zoomTokenUrl}?grant_type=account_credentials&account_id=${encodeURIComponent(config.accountId)}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
    },
    cache: 'no-store',
  });
  const data = await res.json() as ZoomTokenResponse;

  if (!res.ok || !data.access_token) {
    throw new Error(data.reason || data.error || 'Could not get Zoom access token.');
  }

  return data.access_token;
}

export async function createZoomMeeting(input: CreateZoomMeetingInput) {
  const config = zoomConfig();
  const token = await getZoomAccessToken();
  const res = await fetch(`${zoomApiBaseUrl}/users/${encodeURIComponent(config.userId)}/meetings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic: input.topic,
      type: 2,
      start_time: input.startsAt,
      duration: input.durationMinutes,
      timezone: 'Asia/Kolkata',
      settings: {
        join_before_host: false,
        waiting_room: true,
        approval_type: 2,
      },
    }),
    cache: 'no-store',
  });
  const data = await res.json() as ZoomMeetingResponse & { message?: string };

  if (!res.ok || !data.start_url || !data.join_url) {
    throw new Error(data.message || 'Could not create Zoom meeting.');
  }

  return data;
}
