import './utils/envCheck'; // Validate env before anything else
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import App from './App';
import './index.css';
import { telemetry } from './lib/telemetry/analytics';

// Initialize telemetry for product validation
telemetry.initialize();

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
