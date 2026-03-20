import dotenv from 'dotenv';
dotenv.config();

export const bigDataConfig = {
  graphqlEndpoint: process.env.BIG_DATA_GRAPHQL_URL || 'http://bigdata:4000/graphql',
  apiKey: process.env.BIG_DATA_API_KEY || '',
  timeout: Number(process.env.BIG_DATA_TIMEOUT) || 10000,
};
