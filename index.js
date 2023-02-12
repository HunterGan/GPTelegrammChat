// @ts-check
import TelegramApi from 'node-telegram-bot-api';
import axios from 'axios';
import HttpsProxyAgent from 'https-proxy-agent';
import dotenv from 'dotenv';

import { myUrls } from './routes.js';
import { messageConfig, botCommands } from './configs/index.js';
import { getDataFromMessage, getGPTHeaders, getMenu } from './src/index.js';

/// ********CONFIGURING******** ///

dotenv.config({ path: `.env.local`, override: true });

const token = process.env.TG_TOKEN;
if (!token) {
  throw new Error('Telegram token is not defined');
}

const [host, port] = process.env.PROXY_HOST_PORT.split(':');
const auth = process.env.PROXY_AUTH;
const API_KEY = process.env.CHAT_API_KEY;
const headers = getGPTHeaders(API_KEY);

const bot = new TelegramApi(token, { polling: true });
const httpsAgent = HttpsProxyAgent({ host, port, auth });
const axiosWithProxy = axios.create({ httpsAgent });

const usersDataBase = {}; /// { id, isPremium, chatId, }
const waitingForCode = new Set();

/// ********Sources******** ///

const getAnswer = async (question) => {
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

const init = () => {

  bot.setMyCommands(botCommands);

  bot.on('message', async msg => {
    const { chatId, text, first_name } = getDataFromMessage(msg);
    usersDataBase[chatId] ||= { chatId, isPremium: false, name: msg.chat.first_name };
    const { isPremium } = usersDataBase[chatId];

    if (waitingForCode.has(chatId)) {
      if (text === 'hunter') {
        usersDataBase[chatId].isPremium = true; /// Здесь мы добавляем 30 дней, а не подписку флажим
        await bot.sendMessage(chatId, 'Поздравляю тебя, господин! Жду твоих мудрых вопросов!');
      } else {
        await bot.sendMessage(chatId, 'Неверный пароль. Для получения пароля необходимо оплатить подписку на сайте. Если вы оплатили, но пароль не срабатывает - обратитесь к администратору');
      }
      waitingForCode.delete(chatId);
      return;
    }
    if (text === '/start') {
      await bot.sendSticker(chatId, 'https://tlgrm.eu/_/stickers/5eb/843/5eb8436f-51c7-315b-abc5-7f45216b5502/2.webp');
      await bot.sendMessage(chatId, 'Welcome to GPT-3 Chat bot');
      return bot.sendMessage(chatId, `Ваш текущий тарифный план: ${isPremium ? 'Premium unlimited' : 'Без доступа к чату'}`, getMenu('main'));
    }

    if (text === '/menu') {
      return bot.sendMessage(chatId, '***** Главное меню *****', getMenu('main'));
    }

    if (text.startsWith('/getIp')) {
      console.log('Setting request to address: ', myUrls.getIp)
      axiosWithProxy.get(myUrls.getIp)
        .then(response => console.log(response.data))
        .catch(error => console.log('not got', error.message));
    }
    axios.request
    if (usersDataBase[chatId].isPremium) {
      console.log('trying to get data');
      getAnswer(text)
        .then(response => bot.sendMessage(chatId, response))
        .catch(error => bot.sendMessage(chatId, 'Ups, произошла ошибка! Иди на *уй!!'));
    } else {
      console.log('unauthorized entry');
      return bot.sendMessage(chatId, 'Для использования бота необходима подписка', getMenu('subscription'));
    }

    if (text.startsWith('/models')) {
      axios.get(myUrls.models, { headers })
        .then(response => console.log(response.data.data[0]))
        .catch(error => console.log('not got', error.message));
    }
  });

  bot.on('callback_query', async (msg) => {
    const action = msg.data;
    const chatId = msg.message?.chat.id;
    const buildProfile = (id) => {
      console.log('im working!!');
      try {
        const { userId, name, isPremium } = usersDataBase[id];
        const userData = [
          `Идентификатор: ${userId}`,
          `Имя пользователя: ${name}`,
          `Тарифный план: ${isPremium ? 'Премиум' : 'Без тарифного плана'}`,
        ];
        return userData.join('\n');
      } catch (e) {
        console.log('EEEERRRRRRRRRRRROOOOOOOORRR', e.message);
      }

    };

    switch (action) {
      case '/showAbout':
        return chatId && bot.sendMessage(chatId, 'Как пользоваться ботом\nЗдесь нужно кратко описать как пользоваться ботом - примеры. Подробные кейсы использования будут на сайте, стараемся переадресовать клиентов туда. Ссфлка ниже.', getMenu('about'));
      case '/showSubscription':
        return chatId && bot.sendMessage(chatId, 'Здесь вкратце инфа о подписке - цена, срок, что за это будет. Купить можно на сайте. Ссылка ниже. После покупки получаем на сайте код - его нужно будет отправить боту в чат.', getMenu('subscription'));
      case '/enterCode':
        waitingForCode.add(chatId);
        return chatId && bot.sendMessage(chatId, 'Здесь пользователю еще раз кинуть иструкцию как получить и ввести. Пользователь, оплатив подписку, получает на сайте код, который вводит в чат.');
      case '/showProfile':
        const profile = buildProfile(chatId);
        return chatId && profile && bot.sendMessage(chatId, profile);
      case '/redirectToAbout':
        return chatId && bot.sendMessage(chatId, 'Переходим на сайт\nВ разработке');
    }
  });
};

init();


