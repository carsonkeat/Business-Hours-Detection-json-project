/**
 * Frontend JavaScript for Business Hours Detection App
 */

// API base URL
const API_BASE = window.location.origin

// DOM elements
const hoursForm = document.getElementById('hoursForm')
const submitBtn = document.getElementById('submitBtn')
const resultsSection = document.getElementById('resultsSection')
const resultsContent = document.getElementById('resultsContent')
const errorSection = document.getElementById('errorSection')
const errorContent = document.getElementById('errorContent')
const jsonOutput = document.getElementById('jsonOutput')
const copyJsonBtn = document.getElementById('copyJsonBtn')
const faqContent = document.getElementById('faqContent')

// Load FAQ on page load
document.addEventListener('DOMContentLoaded', () => {
  loadFAQ()
})

// Handle form submission
hoursForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  
  const formData = new FormData(hoursForm)
  const url = formData.get('url')
  const timezone = formData.get('timezone') || 'America/Chicago'
  const country = formData.get('country') || 'US'
  
  // Hide previous results/errors
  resultsSection.style.display = 'none'
  errorSection.style.display = 'none'
  
  // Show loading state
  submitBtn.disabled = true
  submitBtn.querySelector('.button-text').style.display = 'none'
  submitBtn.querySelector('.button-loader').style.display = 'inline'
  
  try {
    const response = await fetch(`${API_BASE}/api/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, timezone, country }),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to extract hours')
    }
    
    // Display results
    displayResults(data)
  } catch (error) {
    displayError(error.message)
  } finally {
    // Reset button state
    submitBtn.disabled = false
    submitBtn.querySelector('.button-text').style.display = 'inline'
    submitBtn.querySelector('.button-loader').style.display = 'none'
  }
})

// Display results
function displayResults(data) {
  let hoursHTML = '<div class="hours-display">'
  
  // Check if this is a locations list
  if (data.isLocationsList && data.locations && data.locations.length > 0) {
    hoursHTML += `<h3>Locations List (${data.locationCount || data.locations.length} locations found)</h3>`
    
    data.locations.forEach((location, index) => {
      hoursHTML += `<div class="location-item">`
      hoursHTML += `<h4>${index + 1}. ${location.name || 'Unknown Location'}</h4>`
      
      if (location.category) {
        hoursHTML += `<p><strong>Department:</strong> ${location.category}</p>`
      }
      
      if (location.address) {
        hoursHTML += `<p><strong>Address:</strong> ${location.address}</p>`
      }
      
      if (location.phone) {
        hoursHTML += `<p><strong>Phone:</strong> ${location.phone}</p>`
      }
      
      if (location.hours && location.hours.length > 0) {
        hoursHTML += '<table class="hours-table"><thead><tr><th>Day</th><th>Status</th><th>Hours</th></tr></thead><tbody>'
        
        location.hours.forEach(day => {
          const dayName = capitalizeFirst(day.day)
          let status = day.isOpen ? '<span class="status-open">Open</span>' : '<span class="status-closed">Closed</span>'
          let hours = '-'
          
          if (day.hours && day.hours.length > 0) {
            hours = day.hours.map(h => {
              const open = formatTime(h.open)
              const close = formatTime(h.close)
              return `${open} - ${close}`
            }).join(', ')
          }
          
          hoursHTML += `<tr><td>${dayName}</td><td>${status}</td><td>${hours}</td></tr>`
        })
        
        hoursHTML += '</tbody></table>'
      } else {
        hoursHTML += '<p><em>Hours: Call for hours or check website</em></p>'
      }
      
      hoursHTML += '</div>'
    })
  } else if (data.regularHours && data.regularHours.length > 0) {
    // Single location hours
    hoursHTML += '<h3>Regular Hours</h3><table class="hours-table"><thead><tr><th>Day</th><th>Status</th><th>Hours</th></tr></thead><tbody>'
    
    data.regularHours.forEach(day => {
      const dayName = capitalizeFirst(day.day)
      let status = day.isOpen ? '<span class="status-open">Open</span>' : '<span class="status-closed">Closed</span>'
      let hours = '-'
      
      if (day.hours && day.hours.length > 0) {
        hours = day.hours.map(h => {
          const open = formatTime(h.open)
          const close = formatTime(h.close)
          return `${open} - ${close}`
        }).join(', ')
      }
      
      hoursHTML += `<tr><td>${dayName}</td><td>${status}</td><td>${hours}</td></tr>`
    })
    
    hoursHTML += '</tbody></table>'
  } else {
    hoursHTML += '<p>No hours information found.</p>'
  }
  
  // Display metadata
  hoursHTML += '<div class="metadata">'
  hoursHTML += `<p><strong>Confidence:</strong> ${(data.confidence * 100).toFixed(0)}%</p>`
  hoursHTML += `<p><strong>Source:</strong> ${data.source || 'unknown'}</p>`
  hoursHTML += `<p><strong>Extracted:</strong> ${new Date(data.extractedAt).toLocaleString()}</p>`
  if (data.isLocationsList) {
    hoursHTML += `<p><strong>Type:</strong> Locations List</p>`
  }
  hoursHTML += '</div>'
  
  hoursHTML += '</div>'
  
  resultsContent.innerHTML = hoursHTML
  
  // Display JSON
  jsonOutput.textContent = JSON.stringify(data, null, 2)
  
  // Show results section
  resultsSection.style.display = 'block'
  
  // Scroll to results
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

// Display error
function displayError(message) {
  errorContent.textContent = message
  errorSection.style.display = 'block'
  errorSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

// Load FAQ
async function loadFAQ() {
  try {
    const response = await fetch(`${API_BASE}/api/faq`)
    const data = await response.json()
    
    let faqHTML = ''
    
    data.faq.forEach(category => {
      faqHTML += `<div class="faq-category"><h3>${category.category}</h3>`
      
      category.questions.forEach((item, index) => {
        faqHTML += `
          <div class="faq-item">
            <button class="faq-question" onclick="toggleFAQ(${category.category.replace(/\s+/g, '_')}_${index})">
              ${item.question}
              <span class="faq-icon">▼</span>
            </button>
            <div class="faq-answer" id="faq_${category.category.replace(/\s+/g, '_')}_${index}">
              <p>${item.answer}</p>
            </div>
          </div>
        `
      })
      
      faqHTML += '</div>'
    })
    
    faqContent.innerHTML = faqHTML
  } catch (error) {
    console.error('Error loading FAQ:', error)
    faqContent.innerHTML = '<p>Unable to load FAQ. Please try again later.</p>'
  }
}

// Toggle FAQ item
window.toggleFAQ = function(id) {
  const answer = document.getElementById(`faq_${id}`)
  const question = answer.previousElementSibling
  const icon = question.querySelector('.faq-icon')
  
  if (answer.style.display === 'block') {
    answer.style.display = 'none'
    icon.textContent = '▼'
    question.classList.remove('active')
  } else {
    // Close all other FAQ items
    document.querySelectorAll('.faq-answer').forEach(item => {
      if (item !== answer) {
        item.style.display = 'none'
        const otherIcon = item.previousElementSibling.querySelector('.faq-icon')
        if (otherIcon) otherIcon.textContent = '▼'
        item.previousElementSibling.classList.remove('active')
      }
    })
    
    answer.style.display = 'block'
    icon.textContent = '▲'
    question.classList.add('active')
  }
}

// Copy JSON to clipboard
copyJsonBtn.addEventListener('click', () => {
  const jsonText = jsonOutput.textContent
  navigator.clipboard.writeText(jsonText).then(() => {
    copyJsonBtn.textContent = 'Copied!'
    setTimeout(() => {
      copyJsonBtn.textContent = 'Copy JSON'
    }, 2000)
  }).catch(err => {
    console.error('Failed to copy:', err)
    alert('Failed to copy to clipboard')
  })
})

// Helper functions
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function formatTime(time24) {
  const [hours, minutes] = time24.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

