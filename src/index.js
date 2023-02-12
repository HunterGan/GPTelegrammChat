// @ts-check
import { getMenu } from './menus.js';


const getDataFromMessage = (message) => {
  const { id: chatId } = message.chat;
  const { text } = message;
  const { first_name } = message.chat;
  return { chatId, text, first_name };
}

const getGPTHeaders = (API_KEY) => {
  return {
    ['Content-Type']: 'application/json',
    ['Authorization']: `Bearer ${API_KEY}`,
  };
};

export { getMenu, getDataFromMessage, getGPTHeaders };