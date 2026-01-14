import express from 'express';
import { validErrorHandler } from '../src/index';
import routes from './routes.ts';

const app = express();
app.use(express.json());
app.use(routes);

// Error handler must be registered after routes
app.use(validErrorHandler);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Dev server running at http://localhost:${PORT}`);
});
