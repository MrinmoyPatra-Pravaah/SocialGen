import dotenv from 'dotenv';

dotenv.config();

export const PORT = Number(process.env.PORT || 8000);
export const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || '8f39c87d4615a1e2f3d4a5b6c7d8e9f0123456789abcdef0123456789abcdef';
export const ALGORITHM = 'HS256';
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

// OAuth API Client Credentials
export const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '';
export const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || '';
export const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:8000/api/social/auth/callback';

export const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID || '';
export const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET || '';
export const TWITTER_REDIRECT_URI = process.env.TWITTER_REDIRECT_URI || 'http://localhost:8000/api/social/auth/callback';

export const META_CLIENT_ID = process.env.META_CLIENT_ID || '';
export const META_CLIENT_SECRET = process.env.META_CLIENT_SECRET || '';
export const META_REDIRECT_URI = process.env.META_REDIRECT_URI || 'http://localhost:8000/api/social/auth/callback';

export const CORS_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5175',
  'http://localhost:3000'
];
