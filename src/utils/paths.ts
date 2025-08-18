import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ES module equivalent of __dirname
const currentDir = dirname(fileURLToPath(import.meta.url));

// Helper to get the root directory (src folder)
export const getSrcDir = () => dirname(currentDir);
