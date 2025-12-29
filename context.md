context.md
# Project Context: Business Hours & Holiday Detection App

## Goal
Build a JSON-driven application that can review data from a business website and determine:
- Regular hours of operation
- Day-of-week availability (e.g., "Is this business open every Thursday?")
- Holiday hours and closures for major U.S. holidays
- Exceptions, seasonal schedules, or special notes

The output must be structured, machine-readable JSON with confidence indicators.

---

## Core Use Case
Given a business website URL, the app should:
1. Extract hours of operation from visible content and structured data.
2. Normalize hours into a consistent weekly schedule.
3. Identify holiday-specific hours or closures.
4. Answer boolean and explanatory queries such as:
   - Is the business open every Thursday?
   - What time does it open on Saturdays?
   - Is it open on Thanksgiving?
   - Are hours consistent week-to-week?

---

## Input
```json
{
  "url": "https://example-business.com",
  "timezone": "America/Chicago",
  "country": "US"
}
