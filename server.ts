import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'src/data/pptData.json');

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get('/api/ppt', (req, res) => {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        res.json(JSON.parse(data));
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error('Error reading PPT data:', error);
      res.status(500).json({ error: 'Failed to read data' });
    }
  });

  app.post('/api/ppt', (req, res) => {
    try {
      const data = req.body;
      console.log('Received save request. Data length:', JSON.stringify(data).length);
      console.log('Writing to file:', DATA_FILE);
      
      // Ensure directory exists
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
      console.log('File written successfully.');
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving PPT data:', error);
      res.status(500).json({ error: 'Failed to save data' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving (if needed, though usually handled by nginx/platform)
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
