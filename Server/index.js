import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import connectDB from './config/mongodb.js';
import cookieParser from 'cookie-parser';
import authRouter from './routes/authRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
connectDB();

const allowedOrigins = ['http://localhost:5173']
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}))

app.get('/', (req,res) => res.send("API Working"))
app.use('/api/auth', authRouter);

app.listen(PORT, () => {
  console.log(`Server started http://localhost:${PORT}`)
})