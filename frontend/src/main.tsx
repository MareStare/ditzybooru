import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';

import { getRouter } from './router';
import { unwrap } from './lib/assertions';

const router = getRouter();

const rootElement = unwrap(document.getElementById('app'));

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<RouterProvider router={router} />);
}
