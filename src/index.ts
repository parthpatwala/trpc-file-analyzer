import { createExpressMiddleware } from '@trpc/server/adapters/express';
import cors from 'cors';
import { config } from 'dotenv';
import express from 'express';
import fileUpload from 'express-fileupload';
import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import { createContext, publicProcedure, router } from './trpc';

config();

const appRouter = router({
  hello: publicProcedure.query(() => {
    return {
      message: 'hello world',
    };
  }),
  upload: publicProcedure.mutation(async (opts) => {
    const files = opts.ctx.req.files;

    if (!files || Object.keys(files).length === 0) {
      console.error('Please upload jobDescription and cv file.');
      throw new Error('No files were uploaded.');
    }
    const jobDescription = Array.isArray(files.jobDescription) ? files.jobDescription[0] : files.jobDescription;
    const cv = Array.isArray(files.cv) ? files.cv[0] : files.cv;
    if (!jobDescription || !cv) {
      console.error('Please upload jobDescription and cv file.');
      throw new Error('Please upload jobDescription and cv file.');
    }
    if (jobDescription.mimetype !== 'application/pdf' || cv.mimetype !== 'application/pdf') {
      console.error(`Invalid file type. Only PDFs are allowed.`);
      throw new Error(`Invalid file type. Only PDF files are allowed.`);
    }
    const FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    if (jobDescription.size > FILE_SIZE || cv.size > FILE_SIZE) {
      console.error(`File size exceeds 10MB limit.`);
      throw new Error(`File size exceeds the 10MB limit`);
    }

    // parse pdf files
    const jobDescriptionText = await parsePDF(jobDescription.tempFilePath);
    const cvText = await parsePDF(cv.tempFilePath);
    console.log(jobDescriptionText);

    return {
      message: 'PDFs analyzed successfully!',
    };
  }),
});

// Parse pdf
const parsePDF = async (filePath: string) => {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
};

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    useTempFiles: true,
    tempFileDir: '/tmp/',
  }),
);

app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext: createContext,
    onError({ path, error }) {
      console.error(`Error on tRPC path ${path}:`, error);
    },
  }),
);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
