
const mainMenu = [
  { text: 'Как пользоваться', callback_data: '/showAbout' },
  { text: 'Инфо о подписке', callback_data: '/showSubscription' },
  { text: 'Ввести код доступа', callback_data: '/enterCode' }
];

const subscriptionMenu = [
  { text: 'Мой аккаунт', callback_data: '/showProfile' },
  { text: 'Купить подписку', callback_data: '/showSubscription' },
  { text: 'Ввести код доступа', callback_data: '/enterCode' }
];

const aboutMenu = [
  { text: 'Перейти на сайт', callback_data: '/redirectToAbout' },
  { text: 'Купить подписку', callback_data: '/showSubscription' },
];

const menus = {
  main: mainMenu,
  subscription: subscriptionMenu,
  about: aboutMenu,
}

export const getMenu = (menuType = 'main') => {
  const menu = menus[menuType] ?? 'main';
  const replyMarkup = {
    inline_keyboard: [menu]
  };
  return { reply_markup: replyMarkup };
};
