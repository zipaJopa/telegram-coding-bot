import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export interface EnvironmentConfig {
  telegramBotToken: string;
  openrouterApiKey: string;
}

/**
 * Validate and return environment configuration
 * Throws an error if required environment variables are missing
 */
export function validateEnvironment(): EnvironmentConfig {
  // Required variables - bot won't work without these
  const requiredVars = {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    openrouterApiKey: process.env.OPENROUTER_API_KEY,
  };

  // Check required variables
  const missing: string[] = [];
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check your .env file. See .env.example for reference.`
    );
  }

  return requiredVars as EnvironmentConfig;
}

/**
 * Get environment configuration with validation
 */
export function getEnvironment(): EnvironmentConfig {
  return validateEnvironment();
}
