/**
 * Express Server for Business Hours Input App
 */

import express from 'express'
import cors from 'cors'
import { processBusinessHours } from './lib/business-hours.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static(join(__dirname, 'public')))

// API endpoint to extract business hours
app.post('/api/extract', async (req, res) => {
  try {
    const { url, timezone, country } = req.body
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' })
    }
    
    // Validate URL
    try {
      new URL(url)
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' })
    }
    
    const result = await processBusinessHours({ url, timezone, country })
    res.json(result)
  } catch (error) {
    console.error('Error extracting hours:', error)
    res.status(500).json({ 
      error: 'Failed to extract business hours',
      message: error.message 
    })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Serve FAQ data
app.get('/api/faq', (req, res) => {
  res.json({
    faq: [
      {
        category: "Medical Facility Office Hours",
        questions: [
          {
            question: "What are the standard office hours for medical facilities?",
            answer: "Most medical facilities operate Monday through Friday from 8:00 AM to 5:00 PM, though hours can vary. Some facilities offer extended hours including evenings and weekends. It's best to check the specific facility's website or call ahead."
          },
          {
            question: "Are medical offices open on weekends?",
            answer: "Many medical facilities are closed on weekends, but some urgent care centers, emergency departments, and specialty clinics do operate on Saturdays and Sundays with limited hours. Check with your specific facility for weekend availability."
          },
          {
            question: "What holidays are medical facilities typically closed?",
            answer: "Medical facilities are typically closed on major holidays including New Year's Day, Memorial Day, Independence Day, Labor Day, Thanksgiving, and Christmas. Emergency departments and urgent care centers may have reduced hours on holidays."
          },
          {
            question: "How can I find out if a medical facility has extended or after-hours availability?",
            answer: "Check the facility's website for hours of operation, look for 'urgent care' or 'after-hours' information, or call the main phone number which may have an automated system with hours information."
          },
          {
            question: "Do medical facilities have different hours for different departments?",
            answer: "Yes, many medical facilities have different operating hours for different departments. Primary care, specialty clinics, lab services, and imaging centers may all have different schedules. Check the facility's website for department-specific hours."
          }
        ]
      },
      {
        category: "Call Center Availability",
        questions: [
          {
            question: "What are typical call center hours?",
            answer: "Call center hours vary widely. Many operate Monday through Friday from 8:00 AM to 8:00 PM in the local timezone. Some call centers operate 24/7, especially for customer support, technical support, or medical services."
          },
          {
            question: "Are call centers available on weekends?",
            answer: "Many call centers do operate on weekends, though often with reduced staffing or limited hours. Some critical services like emergency hotlines, technical support, and customer service for major companies operate 24/7 including weekends."
          },
          {
            question: "How can I find call center hours for a specific business?",
            answer: "Check the business website's contact page, look for 'Customer Service' or 'Support' sections, check your account portal, or call the main number which often has automated hours information."
          },
          {
            question: "Do call centers have different hours for different types of inquiries?",
            answer: "Yes, some businesses have separate phone lines or departments with different hours. For example, sales lines may have different hours than technical support or billing inquiries. Check the business website for department-specific contact information."
          },
          {
            question: "What should I do if I need to contact a business outside of call center hours?",
            answer: "Many businesses offer alternative contact methods including email, online chat (when available), customer portals, or automated phone systems that can handle basic inquiries. Check the business website for alternative contact options."
          },
          {
            question: "Are holiday hours different for call centers?",
            answer: "Yes, call centers often have reduced hours or are closed on major holidays. Some critical services maintain 24/7 availability even on holidays, but staffing may be reduced. Check with the specific business for holiday hours."
          }
        ]
      }
    ]
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📝 API endpoint: http://localhost:${PORT}/api/extract`)
  console.log(`❓ FAQ endpoint: http://localhost:${PORT}/api/faq`)
})

