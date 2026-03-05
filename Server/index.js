import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import connectDB from './config/mongodb.js';
import cookieParser from 'cookie-parser';
import authRouter from './routes/authRoutes.js';
import ErrorMiddleware from './middlewares/ErrorMiddleware.js';
import logger from './utils/logger.js';
import swaggerSpec from './config/swagger.js';
import userRouter from './routes/userRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet()); // Set security HTTP headers
app.use(mongoSanitize()); // Data sanitization against NoSQL query injection
app.use(xss()); // Data sanitization against XSS

// Rate limiting (100 requests per 15 mins per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again in an hour!"
});
app.use('/api', limiter);

app.use(express.json());
app.use(cookieParser());
connectDB();

const allowedOrigins = ['http://localhost:5173']
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}))

// Logging requests (simple custom logger middleware using winston)
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (req, res) => res.send("API Working. See /api-docs for documentation."))
app.use('/api/auth', authRouter);

// Global Error Handler
app.use(ErrorMiddleware);
app.use('/api/user', userRouter);

app.listen(PORT, () => {
  logger.info(`Server safely started on http://localhost:${PORT}`)
})