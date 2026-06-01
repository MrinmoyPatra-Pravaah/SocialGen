import app from './app.js';
import { PORT } from './config/index.js';
import { startCampaignScheduler } from './services/scheduler.js';

app.listen(PORT, () => {
  console.log(`Starting Social Gen SaaS Express Backend on http://127.0.0.1:${PORT}`);
  startCampaignScheduler();
});
