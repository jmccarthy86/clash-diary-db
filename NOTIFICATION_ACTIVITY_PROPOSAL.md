# Booking Notification Activity Proposal

## Scope

Record clash email activity against each booking and display that activity in a WordPress booking sidebar metabox named "Notifications".

Backfill is optional and out of scope for the initial implementation. The first version records new notification attempts from the updated send flow.

## Goals

- Store one activity entry per recipient and notification attempt.
- Link every entry to the relevant `fnd_booking` post ID.
- Capture notification type, recipient, subject, status, provider, trigger, timestamps, provider response metadata, and failure details.
- Display the latest entries on the WordPress `fnd_booking` edit screen in a compact sidebar metabox.
- Expose read/write REST endpoints so the Next app can record Brevo send results after sending email.

## Proposed Data Shape

```json
{
  "booking_id": 123,
  "type": "clash",
  "recipient_email": "press@example.com",
  "subject": "SOLT & UK Theatre First Night Diary clash",
  "status": "sent",
  "provider": "brevo",
  "provider_message_id": "abc123",
  "error_message": "",
  "trigger": "booking_created",
  "created_at": "2026-08-04T10:42:00+00:00",
  "sent_at": "2026-08-04T10:42:01+00:00"
}
```

## Implementation Steps

1. Add this proposal document and commit it as the agreed scope.
2. Add WordPress notification activity storage, REST endpoints, and the booking sidebar metabox.
3. Update the Next clash webhook route to record per-recipient sent and failed results against the booking.
4. Ensure booking payloads include the booking ID so notification records can be linked reliably.
5. Run available validation and commit each implementation step separately.

## Notes

- Use an append-only `fnd_notification` post type rather than a large JSON array stored directly on the booking.
- Store provider details when available, but do not depend on Brevo always returning a message ID.
- Keep older Brevo/server logs as supplementary diagnostics only; the new source of truth is booking-linked notification activity.
