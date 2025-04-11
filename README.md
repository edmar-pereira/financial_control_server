# financial_control_server
Example API Calls
Fetch all data for April 2025

{ "startDate": "2025-04-10T00:00:00.000Z" }
Filters by April 2025 ✅

Fetch all "fuel" category data for April 2025
{ "startDate": "2025-04-10T00:00:00.000Z", "categoryIds": ["fuel"] }
Filters by April 2025
Filters by category = fuel ✅

Fetch all data between January and April 2025

{ "startDate": "2025-01-10T00:00:00.000Z", "endDate": "2025-04-10T00:00:00.000Z" }
Returns all data between Jan 10 and Apr 10, 2025 ✅

Fetch all "fuel" and "supermarket" products between January and April 2025

{
  "startDate": "2025-01-10T00:00:00.000Z",
  "endDate": "2025-04-10T00:00:00.000Z",
  "categoryIds": ["fuel", "supermarket"]
}
Filters by date range ✅

Filters by multiple categories (fuel & supermarket) ✅