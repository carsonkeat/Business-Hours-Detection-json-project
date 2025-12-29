# Business Hours Detection Web App

A JSON-driven web application that extracts and analyzes business hours from any website URL.

## Features

- ✅ **URL Input Form** - Enter any business website URL to extract hours
- ✅ **Hours Extraction** - Automatically extracts business hours from websites
- ✅ **Structured JSON Output** - Machine-readable JSON format with confidence scores
- ✅ **FAQ Section** - Frequently asked questions about medical facility hours and call center availability
- ✅ **Modern UI** - Clean, responsive design

## Installation

### Prerequisites

- Node.js v18+ (check with `node --version`)
- npm (comes with Node.js)

### Setup

1. **Install dependencies:**

```bash
npm install
```

This will install:
- `express` - Web server framework
- `axios` - HTTP client for fetching websites
- `cheerio` - HTML parsing
- `date-fns` - Date/time utilities
- `zod` - Schema validation
- `cors` - CORS middleware

2. **Start the server:**

```bash
npm start
```

The server will start on `http://localhost:3000`

3. **Open in browser:**

Navigate to `http://localhost:3000` in your web browser.

## Usage

1. **Enter a business URL** in the input form (e.g., `https://example-business.com`)
2. **Optional:** Select timezone and country
3. **Click "Extract Business Hours"**
4. **View results** including:
   - Regular weekly hours
   - Status (Open/Closed) for each day
   - Confidence score
   - Source of extraction
   - Complete JSON output

## API Endpoints

### POST `/api/extract`

Extract business hours from a URL.

**Request:**
```json
{
  "url": "https://example-business.com",
  "timezone": "America/Chicago",
  "country": "US"
}
```

**Response:**
```json
{
  "url": "https://example-business.com",
  "extractedAt": "2024-12-28T12:00:00.000Z",
  "timezone": "America/Chicago",
  "country": "US",
  "regularHours": [
    {
      "day": "monday",
      "isOpen": true,
      "hours": [
        {
          "open": "09:00",
          "close": "17:00"
        }
      ]
    }
  ],
  "confidence": 0.9,
  "source": "structured_data"
}
```

### GET `/api/faq`

Get FAQ data with questions about medical facilities and call centers.

## FAQ Categories

The app includes FAQ sections for:

1. **Medical Facility Office Hours**
   - Standard office hours
   - Weekend availability
   - Holiday closures
   - Extended hours
   - Department-specific hours

2. **Call Center Availability**
   - Typical call center hours
   - Weekend availability
   - Finding call center hours
   - Different inquiry types
   - Alternative contact methods
   - Holiday hours

## Project Structure

```
Business Hour Input App/
├── package.json          # Project dependencies
├── server.js             # Express server and API endpoints
├── lib/
│   └── business-hours.js # Business hours extraction logic
├── public/
│   ├── index.html        # Main HTML page
│   ├── app.js            # Frontend JavaScript
│   └── styles.css        # CSS styles
└── README.md             # This file
```

## Development

### Run in development mode (with auto-reload):

```bash
npm run dev
```

### Environment Variables

You can set the port using:
```bash
PORT=3000 npm start
```

Default port is 3000.

## How It Works

1. **URL Input** - User enters a business website URL
2. **Content Fetching** - Server fetches the HTML content
3. **Structured Data Extraction** - Looks for Schema.org JSON-LD and microdata
4. **HTML Parsing** - Parses visible hours content if structured data not found
5. **Hours Normalization** - Converts extracted data to consistent format
6. **JSON Output** - Returns structured JSON with confidence scores

## Troubleshooting

### Server won't start

- Check if port 3000 is already in use
- Try a different port: `PORT=3001 npm start`
- Verify Node.js version: `node --version` (should be v18+)

### "Failed to fetch website" error

- Check if the URL is accessible
- Some websites block automated requests
- Verify the URL format is correct (must start with http:// or https://)

### Hours not extracted correctly

- The extraction relies on structured data or visible HTML content
- Not all websites have structured hours data
- Confidence scores indicate extraction reliability

## License

MIT

## Support

For issues or questions, check the code comments or create an issue in the repository.

