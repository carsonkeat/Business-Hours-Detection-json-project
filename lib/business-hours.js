/**
 * Business Hours Extraction Logic
 * Simplified version for the web app
 */

import axios from 'axios'
import * as cheerio from 'cheerio'

/**
 * Fetch website content
 */
async function fetchWebsiteContent(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 10000,
    })
    return response.data
  } catch (error) {
    throw new Error(`Failed to fetch website: ${error.message}`)
  }
}

/**
 * Extract structured data from HTML
 */
function extractStructuredData(html) {
  const $ = cheerio.load(html)
  const structuredData = []

  // Extract JSON-LD scripts
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const content = $(element).html()
      if (content) {
        const data = JSON.parse(content)
        structuredData.push(data)
      }
    } catch (error) {
      // Skip invalid JSON
    }
  })

  return structuredData
}

/**
 * Find hours-related content
 */
function findHoursContent(html) {
  const $ = cheerio.load(html)
  const hoursContent = []
  const hoursKeywords = ['hours', 'open', 'closed', 'schedule', 'availability', 'visiting', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  // Look for text containing time patterns (e.g., "9 a.m. - 5 p.m.")
  const timePattern = /\d{1,2}\s*(a\.?m\.?|p\.?m\.?|am|pm)/i
  
  // Look for "24 hours" or "open 24"
  const allDayPattern = /(open\s+)?24\s*(hours|hrs)/i

  // Get all text content and search for hours
  const bodyText = $('body').text()
  
  // Look for paragraphs/sections with hours keywords
  $('p, div, li, td, span').each((_, element) => {
    const text = $(element).text().trim()
    if (text && text.length > 10 && text.length < 500) {
      const lowerText = text.toLowerCase()
      
      // Check if it contains hours keywords or time patterns
      if (hoursKeywords.some(keyword => lowerText.includes(keyword)) || 
          timePattern.test(text) || 
          allDayPattern.test(text)) {
        
        // Check if it looks like hours information
        if (lowerText.includes('monday') || lowerText.includes('tuesday') || 
            lowerText.includes('wednesday') || lowerText.includes('thursday') ||
            lowerText.includes('friday') || lowerText.includes('saturday') ||
            lowerText.includes('sunday') || timePattern.test(text) ||
            allDayPattern.test(text)) {
          hoursContent.push(text)
        }
      }
    }
  })

  // Also look for specific sections
  $('h2, h3, h4').each((_, element) => {
    const heading = $(element).text().toLowerCase()
    if (heading.includes('hours') || heading.includes('visiting')) {
      const nextContent = $(element).next().text().trim()
      if (nextContent && nextContent.length < 500) {
        hoursContent.push(nextContent)
      }
      // Also get sibling content
      $(element).siblings('p, div').first().each((_, sib) => {
        const sibText = $(element).siblings().first().text().trim()
        if (sibText && sibText.length < 500) {
          hoursContent.push(sibText)
        }
      })
    }
  })

  // Remove duplicates
  return [...new Set(hoursContent)]
}

/**
 * Parse time string to 24-hour format
 * Handles formats like: "9:00 AM", "5:30 a.m.", "9 a.m.", "17:00"
 */
function parseTime(timeStr) {
  if (!timeStr) return null
  
  let normalized = timeStr.trim().toLowerCase()
  
  // Remove common prefixes/suffixes
  normalized = normalized.replace(/^(at|from|until|to|open|close)\s+/i, '')
  normalized = normalized.replace(/\s*(daily|\.|,|and).*$/i, '')
  
  // Handle 12-hour format with colon (e.g., "9:00 AM", "5:30 a.m.", "5:30 a.m")
  const time12ColonMatch = normalized.match(/(\d{1,2}):(\d{2})\s*(a\.?m\.?|p\.?m\.?|am|pm)/)
  if (time12ColonMatch) {
    let hours = parseInt(time12ColonMatch[1], 10)
    const minutes = parseInt(time12ColonMatch[2], 10)
    const period = time12ColonMatch[3].toLowerCase()
    
    if (period.includes('p') && hours !== 12) {
      hours += 12
    } else if (period.includes('a') && hours === 12) {
      hours = 0
    }
    
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    }
  }
  
  // Handle 12-hour format without colon (e.g., "9 AM", "5 pm")
  const time12NoColonMatch = normalized.match(/(\d{1,2})\s*(a\.?m\.?|p\.?m\.?|am|pm)/)
  if (time12NoColonMatch) {
    let hours = parseInt(time12NoColonMatch[1], 10)
    const period = time12NoColonMatch[2].toLowerCase()
    
    if (period.includes('p') && hours !== 12) {
      hours += 12
    } else if (period.includes('a') && hours === 12) {
      hours = 0
    }
    
    if (hours >= 0 && hours < 24) {
      return `${hours.toString().padStart(2, '0')}:00`
    }
  }
  
  // Handle 24-hour format (e.g., "09:00", "17:00")
  const time24Match = normalized.match(/^(\d{1,2}):(\d{2})$/)
  if (time24Match) {
    const hours = parseInt(time24Match[1], 10)
    const minutes = parseInt(time24Match[2], 10)
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    }
  }
  
  return null
}

/**
 * Parse time range (e.g., "9:00 AM - 5:00 PM", "5:30 a.m. to 9 p.m.")
 */
function parseTimeRange(rangeStr) {
  // Clean up the string
  let cleanStr = rangeStr.trim()
  
  // Remove common prefixes
  cleanStr = cleanStr.replace(/^(hours?|open|from)\s*:?\s*/i, '')
  
  const separators = ['-', '–', '—', 'to', 'until', 'through']
  
  for (const sep of separators) {
    const regex = new RegExp(`(.+?)\\s*${sep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(.+)`, 'i')
    const match = cleanStr.match(regex)
    
    if (match) {
      const openStr = match[1].trim()
      const closeStr = match[2].trim()
      
      // Remove "daily" or other words from close time
      const cleanClose = closeStr.replace(/\s*(daily|\.|,).*$/i, '')
      
      const openTime = parseTime(openStr)
      const closeTime = parseTime(cleanClose)
      
      if (openTime && closeTime) {
        return { open: openTime, close: closeTime }
      }
    }
  }
  
  return null
}

/**
 * Parse day hours from text
 */
function parseDayHours(text) {
  const results = []
  const dayMap = {
    'monday': 'monday', 'mon': 'monday', 'mo': 'monday',
    'tuesday': 'tuesday', 'tue': 'tuesday', 'tu': 'tuesday',
    'wednesday': 'wednesday', 'wed': 'wednesday', 'we': 'wednesday',
    'thursday': 'thursday', 'thu': 'thursday', 'th': 'thursday',
    'friday': 'friday', 'fri': 'friday', 'fr': 'friday',
    'saturday': 'saturday', 'sat': 'saturday', 'sa': 'saturday',
    'sunday': 'sunday', 'sun': 'sunday', 'su': 'sunday',
  }
  
  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  
  // Check for "24 hours" or "open 24 hours"
  if (/(open\s+)?24\s*(hours|hrs)/i.test(text)) {
    // If it says 24 hours, mark all days as open 24/7
    return dayNames.map(day => ({
      day,
      isOpen: true,
      hours: [{ open: '00:00', close: '23:59' }],
    }))
  }
  
  // Handle "daily" - means same hours every day
  if (/daily/i.test(text)) {
    const timeRange = parseTimeRange(text)
    if (timeRange) {
      return dayNames.map(day => ({
        day,
        isOpen: true,
        hours: [timeRange],
      }))
    }
  }
  
  // Parse lines
  const lines = text.split(/[.\n;]/).map(l => l.trim()).filter(l => l.length > 0)
  
  for (const line of lines) {
    // Skip if line is too long (probably not hours)
    if (line.length > 200) continue
    
    // Check for day ranges like "Monday – Wednesday" or "Monday - Friday"
    const dayRangeMatch = line.match(/(\w+)\s*[–—\-]\s*(\w+)[:\s]+(.+)/i)
    if (dayRangeMatch) {
      const startDay = dayRangeMatch[1].toLowerCase()
      const endDay = dayRangeMatch[2].toLowerCase()
      const hoursStr = dayRangeMatch[3].trim()
      
      const startIndex = dayNames.findIndex(d => d.startsWith(startDay) || dayMap[startDay] === d)
      const endIndex = dayNames.findIndex(d => d.startsWith(endDay) || dayMap[endDay] === d)
      
      if (startIndex >= 0 && endIndex >= 0 && startIndex <= endIndex) {
        const timeRange = hoursStr.toLowerCase().includes('closed') ? null : parseTimeRange(hoursStr)
        
        for (let i = startIndex; i <= endIndex; i++) {
          const day = dayNames[i]
          if (timeRange) {
            results.push({
              day,
              isOpen: true,
              hours: [timeRange],
            })
          } else {
            results.push({
              day,
              isOpen: false,
              isClosed: true,
            })
          }
        }
        continue
      }
    }
    
    // Handle single day or comma-separated days like "Monday, Tuesday, Wednesday"
    const daysMatch = line.match(/([\w\s,–—\-]+?)[:\s]+(.+)/i)
    if (daysMatch) {
      const daysPart = daysMatch[1].trim()
      const hoursStr = daysMatch[2].trim()
      
      // Parse individual days
      const mentionedDays = []
      for (const [canonical, variations] of Object.entries(dayMap)) {
        const variationsList = variations ? [variations] : [canonical]
        if (variationsList.some(v => daysPart.toLowerCase().includes(v))) {
          mentionedDays.push(canonical)
        }
      }
      
      // Also check for day names directly
      dayNames.forEach(day => {
        if (daysPart.toLowerCase().includes(day) && !mentionedDays.includes(day)) {
          mentionedDays.push(day)
        }
      })
      
      if (mentionedDays.length > 0) {
        const timeRange = hoursStr.toLowerCase().includes('closed') ? null : parseTimeRange(hoursStr)
        
        mentionedDays.forEach(day => {
          if (timeRange) {
            results.push({
              day,
              isOpen: true,
              hours: [timeRange],
            })
          } else {
            results.push({
              day,
              isOpen: false,
              isClosed: true,
            })
          }
        })
      }
    }
    
    // Try simple pattern: Day: hours
    const simpleMatch = line.match(/(\w+)[:\s]+(.+)/i)
    if (simpleMatch) {
      const dayName = simpleMatch[1].toLowerCase()
      const hoursStr = simpleMatch[2].trim()
      
      // Check if it's a day name
      let canonicalDay = null
      for (const [canonical, variations] of Object.entries(dayMap)) {
        if (variations && variations.includes(dayName)) {
          canonicalDay = canonical
          break
        }
      }
      
      if (!canonicalDay && dayNames.includes(dayName)) {
        canonicalDay = dayName
      }
      
      if (canonicalDay) {
        if (hoursStr.toLowerCase().includes('closed')) {
          results.push({
            day: canonicalDay,
            isOpen: false,
            isClosed: true,
          })
        } else {
          const timeRange = parseTimeRange(hoursStr)
          if (timeRange) {
            results.push({
              day: canonicalDay,
              isOpen: true,
              hours: [timeRange],
            })
          }
        }
      }
    }
  }
  
  return results
}

/**
 * Extract locations from a list page
 */
function extractLocationsList(html) {
  const $ = cheerio.load(html)
  const locations = []
  const seenAddresses = new Set()
  
  // Split page into sections - look for repeating patterns
  // Try finding article elements or divs with location-like structure
  $('article, [class*="location"], [class*="result"], [class*="card"]').each((_, element) => {
    const $el = $(element)
    const text = $el.text().trim()
    
    // Skip if too small or too large
    if (text.length < 50 || text.length > 3000) return
    
    // Look for location name (usually in h2, h3, h4, or strong tags)
    let name = $el.find('h2, h3, h4, h5, strong, [class*="name"], [class*="title"]').first().text().trim()
    
    // If no name found, try to get it from the first line
    if (!name) {
      const firstLine = text.split('\n')[0].trim()
      if (firstLine.length < 100) {
        name = firstLine
      }
    }
    
    // Look for address pattern
    const addressPattern = /(\d+\s+[A-Z][\w\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Circle|Cir|Parkway|Pkwy|Highway|Hwy)[\w\s,]*?[A-Z]{2}\s+\d{5})/i
    const addressMatch = text.match(addressPattern)
    const address = addressMatch ? addressMatch[1].trim() : null
    
    // Skip if we've seen this address before (duplicate)
    if (address && seenAddresses.has(address.toLowerCase())) {
      return
    }
    if (address) {
      seenAddresses.add(address.toLowerCase())
    }
    
    // Look for phone number (various formats)
    const phonePatterns = [
      /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/,
      /\((\d{3})\)\s*(\d{3})[-.\s]?(\d{4})/,
    ]
    let phone = null
    for (const pattern of phonePatterns) {
      const phoneMatch = text.match(pattern)
      if (phoneMatch) {
        phone = phoneMatch[0].replace(/[^\d]/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
        break
      }
    }
    
    // Look for department/category - check for common medical facility types
    const categoryPattern = /(Hospitals|Physician Practices|Labs & Imaging|Pharmacies|Rehabilitation Centers|Same Day Care|Senior Living|Surgery|Hospice & Palliative Care|Emergency Department|Urgent Care)/i
    const categoryMatch = text.match(categoryPattern)
    const category = categoryMatch ? categoryMatch[1] : null
    
    // Extract hours from this location element
    const locationHours = parseLocationHours(text)
    
    // Only add if we have at least a name or address
    if (name || address) {
      locations.push({
        name: name || 'Unknown Location',
        address: address || null,
        phone: phone || null,
        category: category || null,
        hours: locationHours,
      })
    }
  })
  
  // If no locations found with selectors, try parsing from text structure
  if (locations.length === 0) {
    return extractLocationsFromText($('body').text())
  }
  
  // Remove duplicates and clean up
  const uniqueLocations = []
  const locationKeys = new Set()
  
  locations.forEach(loc => {
    const key = (loc.name + loc.address).toLowerCase()
    if (!locationKeys.has(key)) {
      locationKeys.add(key)
      uniqueLocations.push(loc)
    }
  })
  
  return uniqueLocations
}

/**
 * Extract locations from plain text (fallback method)
 */
function extractLocationsFromText(text) {
  const locations = []
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 10 && l.length < 500)
  const seenAddresses = new Set()
  
  let currentLocation = null
  let categoryContext = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Update category context if we see a category heading
    const categoryMatch = line.match(/(Hospitals|Physician Practices|Labs & Imaging|Pharmacies|Rehabilitation Centers|Same Day Care|Senior Living|Surgery|Hospice & Palliative Care)/i)
    if (categoryMatch) {
      categoryContext = categoryMatch[1]
    }
    
    // Look for address pattern
    const addressPattern = /(\d+\s+[A-Z][\w\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Circle|Cir|Parkway|Pkwy|Highway|Hwy)[\w\s,]*?[A-Z]{2}\s+\d{5})/i
    const addressMatch = line.match(addressPattern)
    
    if (addressMatch) {
      const address = addressMatch[1].trim()
      
      // Skip duplicates
      if (seenAddresses.has(address.toLowerCase())) {
        continue
      }
      seenAddresses.add(address.toLowerCase())
      
      // Save previous location if exists
      if (currentLocation && (currentLocation.name || currentLocation.address)) {
        locations.push(currentLocation)
      }
      
      // Start new location - name is likely the previous line or part of current line
      let name = null
      if (i > 0) {
        const prevLine = lines[i - 1]
        // If previous line doesn't look like hours or other data, use it as name
        if (!prevLine.match(/\d{1,2}\s*(a\.m\.|p\.m\.|am|pm)/i) && 
            !prevLine.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i) &&
            prevLine.length > 5 && prevLine.length < 150) {
          name = prevLine
        }
      }
      
      // Try to extract name from current line (before address)
      if (!name && addressMatch.index > 0) {
        const beforeAddress = line.substring(0, addressMatch.index).trim()
        if (beforeAddress.length > 5 && beforeAddress.length < 150) {
          name = beforeAddress
        }
      }
      
      currentLocation = {
        name: name || 'Unknown Location',
        address: address,
        phone: null,
        category: categoryContext || null,
        hours: [],
      }
    }
    
    // Look for phone (near address)
    if (currentLocation && !currentLocation.phone) {
      const phoneMatch = line.match(/(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/)
      if (phoneMatch) {
        currentLocation.phone = phoneMatch[1].trim()
      }
    }
    
    // Look for hours in lines near the location
    if (currentLocation) {
      const hours = parseLocationHours(line)
      if (hours.length > 0 && currentLocation.hours.length === 0) {
        currentLocation.hours = hours
      }
    }
  }
  
  // Add last location
  if (currentLocation && (currentLocation.name || currentLocation.address)) {
    locations.push(currentLocation)
  }
  
  return locations
}

/**
 * Parse hours for a single location
 */
function parseLocationHours(text) {
  // Check for "Open 24 Hours"
  if (/(open\s+)?24\s*(hours|hrs)/i.test(text)) {
    const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    return allDays.map(day => ({
      day,
      isOpen: true,
      hours: [{ open: '00:00', close: '23:59' }],
    }))
  }
  
  // Check for "Call for hours"
  if (/call\s+for\s+hours/i.test(text)) {
    return [] // No specific hours
  }
  
  // Try to parse using the existing parseDayHours function
  return parseDayHours(text)
}

/**
 * Main extraction function
 */
async function processBusinessHours(input) {
  const { url, timezone = 'America/Chicago', country = 'US' } = input
  
  try {
    const html = await fetchWebsiteContent(url)
    const structuredData = extractStructuredData(html)
    
    // Check if this is a locations list page
    const $ = cheerio.load(html)
    const bodyText = $('body').text().toLowerCase()
    const isLocationsList = bodyText.includes('locations') && 
                           (bodyText.includes('results') || 
                            bodyText.includes('showing') ||
                            $('article').length > 1 ||
                            $('[class*="location"]').length > 1)
    
    // If it's a locations list, extract multiple locations
    if (isLocationsList) {
      const locations = extractLocationsList(html)
      
      return {
        url,
        extractedAt: new Date().toISOString(),
        timezone,
        country,
        isLocationsList: true,
        locations: locations,
        locationCount: locations.length,
        confidence: locations.length > 0 ? 0.8 : 0.3,
        source: 'html_content',
        rawData: {
          structuredDataCount: structuredData.length,
        },
      }
    }
    
    // Otherwise, extract single location hours
    const hoursContent = findHoursContent(html)
    let regularHours = []
    let source = 'html_content'
    let confidence = 0.5
    
    // Check structured data for openingHours
    for (const data of structuredData) {
      if (data && typeof data === 'object') {
        const openingHours = data.openingHours || data.openingHoursSpecification
        if (openingHours && typeof openingHours === 'string') {
          // Simple parsing of Schema.org format: "Mo-Fr 09:00-17:00"
          const parts = openingHours.split(/\s+/)
          if (parts.length >= 2) {
            source = 'structured_data'
            confidence = 0.9
            // Parse would go here - simplified for now
            break
          }
        }
      }
    }
    
    // Parse from HTML content
    if (regularHours.length === 0 && hoursContent.length > 0) {
      // Try each content piece and merge results
      const allParsedHours = []
      for (const content of hoursContent) {
        const parsed = parseDayHours(content)
        if (parsed.length > 0) {
          // Merge parsed hours (later entries override earlier ones)
          parsed.forEach(dayHours => {
            const existing = allParsedHours.find(h => h.day === dayHours.day)
            if (existing) {
              // Update existing entry
              Object.assign(existing, dayHours)
            } else {
              // Add new entry
              allParsedHours.push(dayHours)
            }
          })
        }
      }
      
      if (allParsedHours.length > 0) {
        regularHours = allParsedHours
        confidence = 0.8
      }
    }
    
    // Ensure we have all 7 days (fill in missing days as closed)
    const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const existingDays = regularHours.map(h => h.day)
    
    allDays.forEach(day => {
      if (!existingDays.includes(day)) {
        regularHours.push({
          day,
          isOpen: false,
          isClosed: true,
        })
      }
    })
    
    // Sort by day order
    regularHours.sort((a, b) => allDays.indexOf(a.day) - allDays.indexOf(b.day))
    
    // If still no hours found, reduce confidence
    if (regularHours.every(h => !h.isOpen || h.isClosed)) {
      confidence = Math.min(confidence, 0.3)
    }
    
    return {
      url,
      extractedAt: new Date().toISOString(),
      timezone,
      country,
      isLocationsList: false,
      regularHours,
      confidence,
      source,
      rawData: {
        structuredDataCount: structuredData.length,
        hoursContentCount: hoursContent.length,
      },
    }
  } catch (error) {
    throw new Error(`Failed to process business hours: ${error.message}`)
  }
}

// Export the main function
export { processBusinessHours }

