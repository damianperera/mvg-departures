import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'
import { BrowserRouter } from 'react-router-dom'
import { Metric } from 'web-vitals'
import ReactGA from 'react-ga4'

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
	ReactGA.event({
		category: 'Web Vitals',
		action: metric.name,
		value: getEventValueFromMetric(metric),
		label: metric.id,
		nonInteraction: true
	})
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(reportHandler)
