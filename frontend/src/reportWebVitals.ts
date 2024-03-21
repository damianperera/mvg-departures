import { Metric } from 'web-vitals'
import ReactGA from 'react-ga4'

const getAnalyticsId = () => process.env.GOOGLE_ANALYTICS_TRACKING_ID
const isDev = () => process.env.NODE_ENV && process.env.NODE_ENV === 'development'

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

  if (isDev()) {
    console.debug(`[web-vitals-dev] ${event.action}: ${event.value}`, metric) // eslint-disable-line no-console
  }
  
  if (getAnalyticsId()) {
    ReactGA.event(event)
  }
}

const reportWebVitals = () => {
  if (getAnalyticsId()) {
    ReactGA.initialize([
      {
        trackingId: getAnalyticsId()!
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