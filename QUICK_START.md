# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies

```bash
npm install
```

This installs all required packages (express, axios, cheerio, date-fns, zod, cors).

### Step 2: Start the Server

```bash
npm start
```

You should see:
```
🚀 Server running on http://localhost:3000
📝 API endpoint: http://localhost:3000/api/extract
❓ FAQ endpoint: http://localhost:3000/api/faq
```

### Step 3: Open in Browser

Navigate to: **http://localhost:3000**

## 📝 How to Use

1. **Enter a business URL** (e.g., `https://example-business.com`)
2. **Click "Extract Business Hours"**
3. **View the results** including:
   - Weekly hours table
   - JSON output
   - Confidence score

## ❓ FAQ Section

Scroll down to see FAQ questions about:
- Medical Facility Office Hours
- Call Center Availability

Click any question to expand and see the answer.

## 🔧 Troubleshooting

**Port already in use?**
```bash
PORT=3001 npm start
```

**Dependencies not installed?**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Need to restart?**
Press `Ctrl+C` to stop the server, then run `npm start` again.

## 📚 More Information

See `README.md` for detailed documentation.

