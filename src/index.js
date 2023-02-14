// @ts-check
import TelegramApi from 'node-telegram-bot-api';
import axios from 'axios';
import HttpsProxyAgent from 'https-proxy-agent';

import { myUrls } from '../routes.js';
import getInitialProps, { messageConfig, botCommands } from '../configs/index.js';
import { getMenu, getUserData, setUserPremium, buildProfile } from '../api/index.js';

/// ********CONFIGURING******** ///

const { host, port, auth, headers } = getInitialProps();
const httpsAgent = HttpsProxyAgent({ host, port, auth });
const axiosWithProxy = axios.create({ httpsAgent });


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
  console.log('start');

  const { token } = getInitialProps();
  const bot = new TelegramApi(token, { polling: true });

  bot.setMyCommands(botCommands);

  bot.on('message', async msg => {
    const { isPremium, chatId, text } = getUserData(msg);

    if (waitingForCode.has(chatId)) {
      if (text === 'hunter') {
        setUserPremium(chatId);
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

    if (isPremium) {
      console.log('trying to get data');
      try {
        const answer = await getAnswer(text);
        await bot.sendMessage(chatId, answer);
        return;
      } catch (e) {
        console.log('Need handling error', Object.keys(e.response));
        await bot.sendMessage(chatId, 'Упс, кажется я сейчас загружен, попробуй спросить через пару минут...');
        return;
      }
    } else {
      console.log('unauthorized entry');
      return bot.sendMessage(chatId, 'Для использования бота необходима подписка', getMenu('subscription'));
    }
  });

  bot.on('callback_query', async (msg) => {
    const action = msg.data;
    const chatId = msg.message?.chat.id;
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

export default init;


