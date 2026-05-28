import 'dotenv/config';
import express, { Request, Response, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authenticateUser } from './middleware/auth.middleware';
import { errorHandler } from './middleware/errorHandler.middleware';
import { requireAdmin } from './middleware/roleGuard.middleware';
import { publicHealthRouter, authedHealthRouter } from './routes/health';
import { publicAuthRouter, adminAuthRouter } from './routes/auth';
import uploadsRouter from './routes/admin/uploads';
import metricsRouter from './routes/admin/metrics';
import dealsAdminRouter from './routes/admin/deals';
import learnersRouter from './routes/admin/learners';
import programsRouter from './routes/admin/programs';
import partnershipsRouter from './routes/admin/partnerships';
import usersRouter from './routes/admin/users';
import settingsRouter from './routes/admin/settings';
import npsRouter from './routes/admin/nps';
import queueRouter from './routes/agent/queue';
import dealsAgentRouter from './routes/agent/deals';
import performanceRouter from './routes/agent/performance';
import valueRouter from './routes/agent/value';
import eventsRouter from './routes/ambassador/events';
import { runDailyDispatch } from './jobs/dealDispatch.job';
import { kigaliNow } from './utils/dateHelpers';

const app = express();

app.use(helmet());
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3100',
].filter((o): o is string => Boolean(o));
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
app.use(limiter);

app.use('/v1', publicHealthRouter);
app.use('/v1', publicAuthRouter);

app.use('/v1', authenticateUser);

app.use('/v1', authedHealthRouter);
app.use('/v1', adminAuthRouter);
app.use('/v1', uploadsRouter);
app.use('/v1', metricsRouter);
app.use('/v1', dealsAdminRouter);
app.use('/v1', learnersRouter);
app.use('/v1', programsRouter);
app.use('/v1', partnershipsRouter);
app.use('/v1', usersRouter);
app.use('/v1', settingsRouter);
app.use('/v1', npsRouter);
app.use('/v1', queueRouter);
app.use('/v1', dealsAgentRouter);
app.use('/v1', performanceRouter);
app.use('/v1', valueRouter);
app.use('/v1', eventsRouter);

const adminRouter = Router();
adminRouter.post('/dispatch/manual', requireAdmin, async (req: Request, res: Response) => {
  const result = await runDailyDispatch(kigaliNow(), req.user.org_id);
  res.json({ data: result });
});
app.use('/v1/admin', adminRouter);

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
