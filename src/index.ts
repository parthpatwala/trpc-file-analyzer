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
      analysis: {
        strengths: [
          'Demonstrates strong experience in full-stack development, with a focus on both backend (Node.js, Express) and frontend (React) technologies.',
          'Proficient in database management (MongoDB) and cloud platforms (AWS, Azure), aligning with modern development practices.',
          'Proven ability to work with RESTful APIs, authentication (JWT), and deployment pipelines (CI/CD, Docker).',
        ],
        weaknesses: [
          "The CV does not explicitly mention experience with GraphQL, which is a 'nice-to-have' skill in the job description.",
          'While comfortable with JavaScript, specific advanced TypeScript experience for large-scale projects is not detailed.',
          'Limited clear examples of leadership roles or extensive project management, if the role requires them beyond individual contributions.',
        ],
        alignmentScore: 85,
        alignmentSummary:
          'The candidate is a strong match for the Full-Stack Developer role, possessing robust technical skills across the stack, database management, and cloud deployment. Key strengths lie in Node.js, React, and MongoDB proficiency. While there are minor gaps in GraphQL and advanced TypeScript, their overall experience and ability to work with modern tools make them a highly suitable candidate.',
      },
    };
  }),
});

// Parse pdf
const parsePDF = async (filePath: string) => {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
};

export type AppRouter = typeof appRouter;

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
