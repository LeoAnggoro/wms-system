import { render, screen } from '@testing-library/react';
import App from './App';

test('renders WMS login page', () => {
  render(<App />);
  // Check if login form or WMS title is present
  const titleElement = screen.getByText(/WMS Login/i);
  expect(titleElement).toBeInTheDocument();
});
