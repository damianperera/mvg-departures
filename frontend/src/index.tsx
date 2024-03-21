import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { Metric } from 'web-vitals'
import ReactGA from 'react-ga4'
import reportWebVitals from './reportWebVitals'
import App from './App'

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

ReactGA.initialize([
  {
    trackingId: 'G-XEN77GP035'
  }
])

const getEventValueFromMetric = (metric: Metric) => {
  if (metric.name === 'CLS') {
    return Math.round(metric.value * 1000)
  }
  return Math.round(metric.value)
}

const reportHandler = (metric: Metric) => {
  const event = {
    category: 'Web Vitals',
    action: metric.name,
    value: getEventValueFromMetric(metric),
    label: metric.id,
    nonInteraction: true
  }

  if (process.env.NODE_ENV && process.env.NODE_ENV === 'development') {
    console.log(`[web-vitals-dev] ${metric.name}: ${metric.id}`, metric) // eslint-disable-line no-console
  } else {
    ReactGA.event(event)
  }
}

reportWebVitals(reportHandler)
