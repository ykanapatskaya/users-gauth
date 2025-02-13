import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 3001,
  env: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  jwt: {
    secret: process.env.JWT_SECRET,
    accessTokenExpiresIn:  process.env.ACCEESS_TOKEN_EXP_DUR,
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXP_DUR,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
}));