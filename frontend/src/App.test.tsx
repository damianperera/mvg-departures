import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

test('app skeleton renders correctly', () => {
	const { container } = render(<BrowserRouter><App /></BrowserRouter>)
	expect(container.firstChild).toMatchSnapshot()
})