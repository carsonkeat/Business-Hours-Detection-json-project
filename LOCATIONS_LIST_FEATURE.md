# Locations List Feature

## Overview

The app now supports extracting multiple locations from a locations list page, such as the [Saint Luke's Locations List](https://www.saintlukeskc.org/locations-list).

## Features

### ✅ Multiple Location Extraction

When the app detects a locations list page, it will:

1. **Extract each location** with:
   - Location name
   - Address
   - Phone number
   - Department/Category (e.g., "Hospitals", "Physician Practices", "Labs & Imaging")
   - Hours of operation

2. **Parse various hour formats**:
   - "Open 24 Hours"
   - "Monday 8 a.m. - 5 p.m."
   - "Monday–Friday 8 a.m.–5 p.m."
   - "Call for hours"
   - Daily hours

3. **Display results** in an organized format showing all locations with their details

## How It Works

### Detection

The app automatically detects if a page is a locations list by checking for:
- Keywords like "locations" and "results" or "showing"
- Multiple location elements (articles, location cards)
- Repeating patterns of location information

### Extraction Methods

1. **Primary Method**: Uses HTML selectors to find location containers
   - Looks for `<article>`, `[class*="location"]`, `[class*="result"]`, etc.
   - Extracts structured information from each container

2. **Fallback Method**: Parses plain text if selectors don't work
   - Identifies addresses, names, and hours from text patterns
   - Groups information by proximity

### Output Format

For locations list pages, the JSON output includes:

```json
{
  "url": "https://www.saintlukeskc.org/locations-list",
  "isLocationsList": true,
  "locationCount": 25,
  "locations": [
    {
      "name": "Saint Luke's East Hospital",
      "address": "100 NE Saint Luke's Blvd. Lee's Summit, MO 64086",
      "phone": "816-347-5000",
      "category": "Hospitals",
      "hours": [
        {
          "day": "monday",
          "isOpen": true,
          "hours": [{"open": "00:00", "close": "23:59"}]
        }
        // ... more days
      ]
    }
    // ... more locations
  ]
}
```

## Example Usage

1. Start the server: `npm start`
2. Navigate to: http://localhost:3000
3. Enter URL: https://www.saintlukeskc.org/locations-list
4. Click "Extract Business Hours"
5. View the list of all locations with their hours

## Supported Formats

The parser handles various location list formats:

- ✅ List pages with article/card elements
- ✅ Tables with location data
- ✅ Plain text lists
- ✅ Multiple locations per page
- ✅ Various hour formats per location
- ✅ Department/category identification

## Improvements Made

1. **Location Detection**: Automatically identifies locations list pages
2. **Structured Extraction**: Extracts name, address, phone, category
3. **Hours Parsing**: Parses hours for each individual location
4. **Duplicate Removal**: Removes duplicate locations based on address
5. **Display Enhancement**: Shows locations in an organized, readable format

