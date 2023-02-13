// @ts-check
import axios from 'axios';
import HttpsProxyAgent from 'https-proxy-agent';

import getInitialProps, { menus, messageConfig } from '../configs/index.js';
import { myUrls } from '../routes.js';

const { host, port, auth, headers } = getInitialProps();
const httpsAgent = HttpsProxyAgent({ host, port, auth });
const axiosWithProxy = axios.create({ httpsAgent });

const usersDataBase = {}; /// { id, isPremium, chatId, }

export const getMenu = (menuType = 'main') => {
  const menu = menus[menuType] ?? 'main';
  const replyMarkup = {
    inline_keyboard: [menu]
  };
  return { reply_markup: replyMarkup };
};

export const getDataFromMessage = (message) => {
  const { id: chatId } = message.chat;
  const { text } = message;
  const { first_name } = message.chat;
  return { chatId, text, first_name };
}

export const getGPTHeaders = (API_KEY) => {
  return {
    ['Content-Type']: 'application/json',
    ['Authorization']: `Bearer ${API_KEY}`,
  };
};

export const getAnswer = async (question) => {
  const data = { ...messageConfig, ['prompt']: question };
  try {
    console.log('Trying to get answer on: ', question);
    const response = await axiosWithProxy.post(myUrls.davinci, data, { headers });
    const responseText = response.data.choices[0].text;
    console.log('Got answer: ', response.data.choices[0].text);
    return responseText;
  } catch (error) {
    console.log('ERROR IS:   ', error?.message);
  }
};

export const getUserData = (msg) => {
  const chatId = msg.chat.id;
  const name = msg.chat.first_name;
  if (!usersDataBase[chatId]) {
    createNewUser(chatId, name);
  }
  const { text } = msg;
  const { isPremium } = usersDataBase[chatId];
  return { isPremium, name, text, chatId }
};

const createNewUser = (chatId, name) => {
  usersDataBase[chatId] = { chatId, isPremium: false, name };
};

export const setUserPremium = (id) => {
  usersDataBase[id].isPremium = true; /// Здесь мы добавляем 30 дней, а не подписку флажим
}


