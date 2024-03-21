import { Metric } from 'web-vitals'
import ReactGA from 'react-ga4'
import { UaEventOptions } from 'react-ga4/types/ga4'

const analyticsId = process.env.GOOGLE_ANALYTICS_TRACKING_ID
const isDev = () => process.env.NODE_ENV && process.env.NODE_ENV === 'development'

const getEventValueFromMetric = (metric: Metric) => {
  if (metric.name === 'CLS') {
    return Math.round(metric.value * 1000)
  }
  return Math.round(metric.value)
}

const reportHandler = (metric: Metric) => {
  const event: UaEventOptions = {
    category: 'Web Vitals',
    action: metric.name,
    value: getEventValueFromMetric(metric),
    label: metric.id,
    nonInteraction: true,
    transport: 'beacon'
  }

  if (isDev()) {
    console.debug(`[web-vitals-dev] ${event.action}: ${event.value}`, metric) // eslint-disable-line no-console
  }
  
  if (analyticsId) {
    ReactGA.event(event)
  }
}

const reportWebVitals = () => {
  if (analyticsId) {
    ReactGA.initialize([
      {
        trackingId: analyticsId
      }
    ])
  }
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(reportHandler)
    getFID(reportHandler)
    getFCP(reportHandler)
    getLCP(reportHandler)
    getTTFB(reportHandler)
  })
}

export default reportWebVitals