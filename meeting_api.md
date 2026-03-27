# Meeting API Documentation

Base URL: `https://truecrm.online/`

Implementation references:
- `src/app/api/meetings/create/route.ts`
- `src/app/api/meetings/list/route.ts`
- `src/app/api/meetings/[id]/token/route.ts`
- `src/app/api/forms/public/[id]/availability/route.ts`
- `src/app/api/forms/public/[id]/submit/route.ts`

## 1) Create Meeting

**POST** `/api/meetings/create`

Auth: Required (logged-in user)

### Request Body
```json
{
  "title": "Demo Call",
  "startTime": "2026-03-15T10:00:00.000Z",
  "endTime": "2026-03-15T11:00:00.000Z"
}
```

Notes:
- `title` is required.
- `startTime` and `endTime` are optional (defaults: now and +1 hour).

### Success Response (200)
```json
{
  "meeting_id": "ab12cd34",
  "join_url": "/meet/ab12cd34",
  "title": "Demo Call"
}
```

### Error Responses
- `401` Unauthorized
- `400` Title required / invalid date format / `endTime` must be after `startTime`

## 2) List My Meetings

**GET** `/api/meetings/list`

Auth: Required

### Success Response (200)
Returns up to latest 30 meetings for the current user (raw Meeting records from DB).

### Error Responses
- `401` Unauthorized
- `500` Internal server error

## 3) Get Meeting Join Token / Status

**GET** `/api/meetings/{meetingId}/token?name=ParticipantName`

Auth: Optional (guests are allowed)

### Success Response (Active Meeting)
```json
{
  "token": "livekit_jwt_here",
  "isHost": true,
  "title": "Demo Call"
}
```

### Waiting Response (Meeting Not Started Yet)
```json
{
  "status": "WAITING",
  "startTime": "2026-03-15T10:00:00.000Z",
  "title": "Demo Call"
}
```

### Error Responses
- `404` Meeting not found
- `403` Meeting canceled (`status: "CANCELED"`)
- `403` Meeting ended/expired (`status: "EXPIRED"`)

---

## Public Form Meeting APIs

## 4) Get Available Slots for a Form

**GET** `/api/forms/public/{formId}/availability?date=YYYY-MM-DD`

Auth: Public

### Success Response (200)
```json
{
  "date": "2026-03-15",
  "timezone": "...",
  "durationMin": 60,
  "slots": [
    {
      "start": "2026-03-15T10:00:00.000Z",
      "end": "2026-03-15T11:00:00.000Z"
    }
  ]
}
```

### Error Responses
- `400` Missing `date` query param
- `400` Meeting scheduling disabled for this form
- `404` Form not found

## 5) Submit Form (Optional Meeting Booking)

**POST** `/api/forms/public/{formId}/submit`

Auth: Public

### Request Body (With Meeting Booking)
```json
{
  "responses": {
    "field_id_1": "John",
    "field_id_2": "Acme Inc"
  },
  "meeting": {
    "book": true,
    "email": "john@acme.com",
    "slotStart": "2026-03-15T10:00:00.000Z"
  }
}
```

If no meeting booking:
- Omit `meeting`, or
- Send `"meeting": { "book": false }`

### Success Response (No Meeting Booked)
```json
{
  "success": true,
  "submissionId": "..."
}
```

### Success Response (Meeting Booked)
```json
{
  "success": true,
  "submissionId": "...",
  "meeting": {
    "id": "...",
    "roomId": "ab12cd34",
    "meetingUrl": "https://truecrm.online/meet/ab12cd34",
    "start": "2026-03-15T10:00:00.000Z",
    "end": "2026-03-15T11:00:00.000Z"
  },
  "emails": {
    "sent": true
  }
}
```

### Error Responses
- `400` Missing required form fields
- `400` Invalid meeting email
- `400` Missing meeting slot or slot in the past
- `409` Selected slot is no longer available
- `502` Form submitted but meeting room creation failed

---

## Full Endpoint URLs (Using Base URL)

- `POST https://truecrm.online/api/meetings/create`
- `GET https://truecrm.online/api/meetings/list`
- `GET https://truecrm.online/api/meetings/{meetingId}/token`
- `GET https://truecrm.online/api/forms/public/{formId}/availability?date=YYYY-MM-DD`
- `POST https://truecrm.online/api/forms/public/{formId}/submit`
