import { RuntimeCleaner } from './utils/RuntimeCleaner.js';

async function cleanRuntime() {
  const cleaner = new RuntimeCleaner();
  await cleaner.clean();
}

cleanRuntime();
