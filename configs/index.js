// @ts-check
import dotenv from 'dotenv';

import { messageConfig } from './messageConfig.js';
import { botCommands } from './botCommands.js';
import { menus } from './menus.js';


dotenv.config({ path: `.env.local`, override: true });

const getGPTHeaders = (API_KEY) => {
  return {
    ['Content-Type']: 'application/json',
    ['Authorization']: `Bearer ${API_KEY}`,
  };
};

export const getInitialProps = () => {
  const token = process.env.TG_TOKEN;
  if (!token) {
    throw new Error('Telegram token is not defined');
  }
  // @ts-ignore
  const [host, port] = process.env.PROXY_HOST_PORT.split(':');
  const auth = process.env.PROXY_AUTH;
  const API_KEY = process.env.CHAT_API_KEY;
  const headers = getGPTHeaders(API_KEY);
  return { host, port, auth, headers, token };
}

export default getInitialProps;

export { messageConfig, botCommands, menus };