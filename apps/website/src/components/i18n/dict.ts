export type Locale = 'uz' | 'ru' | 'en';

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export interface Dict {
  nav: {
    home: string;
    catalog: string;
    ai: string;
    collections: string;
    contact: string;
    search: string;
    wishlist: string;
    cart: string;
    profile: string;
  };
  cta: {
    viewCollection: string;
    aiAdvisor: string;
    addToCart: string;
    buyNow: string;
    viewAll: string;
    subscribe: string;
    send: string;
    sizeGuide: string;
    tryOn: string;
    notifyBack: string;
  };
  hero: {
    title1: string;
    title2: string;
    subtitle: string;
  };
  sections: {
    categories: string;
    popular: string;
    reviews: string;
    newsletter: string;
    newsletterHint: string;
  };
  common: {
    som: string;
    loading: string;
    search: string;
    emailPh: string;
  };
  loyalty: {
    title: string;
    balance: string;
    earned: string;
    howTo: string;
    apply: string;
  };
}

export const UZ: Dict = {
  nav: {
    home: 'Bosh sahifa',
    catalog: 'Katalog',
    ai: 'AI Maslahatchi',
    collections: 'Kolleksiyalar',
    contact: 'Aloqa',
    search: 'Qidirish',
    wishlist: 'Sevimlilar',
    cart: 'Savat',
    profile: 'Profil',
  },
  cta: {
    viewCollection: "Kolleksiyani ko'rish",
    aiAdvisor: 'AI Maslahatchi',
    addToCart: "Savatga qo'shish",
    buyNow: 'Hoziroq xarid qilish',
    viewAll: 'Barchasi',
    subscribe: "Obuna bo'lish",
    send: 'Yuborish',
    sizeGuide: "O'lcham qo'llanmasi",
    tryOn: 'Virtual sinab ko\'rish',
    notifyBack: 'Qaytganda xabar bering',
  },
  hero: {
    title1: 'Mukammallikni',
    title2: 'his qiling',
    subtitle:
      "Har bir ayol uchun yaratilgan premium sifatli ro'mollar va hijoblar",
  },
  sections: {
    categories: 'Kategoriyalar',
    popular: 'Mashhur mahsulotlar',
    reviews: 'Mijozlar fikri',
    newsletter: 'Yangiliklar va maxsus takliflar',
    newsletterHint:
      "Eng so'nggi yangiliklar va chegirmalardan birinchi bo'lib xabardor bo'ling",
  },
  common: {
    som: "so'm",
    loading: 'Yuklanmoqda…',
    search: 'Mahsulot nomi, mato, rang...',
    emailPh: 'Elektron pochtangiz',
  },
  loyalty: {
    title: 'Hijob ballari',
    balance: 'Balansingiz',
    earned: "Jami yig'ilgan",
    howTo: 'Har xaridda 2% ball oling va keyingi buyurtmada xarajat qiling.',
    apply: 'Ballarni ishlatish',
  },
};

export const RU: Dict = {
  nav: {
    home: 'Главная',
    catalog: 'Каталог',
    ai: 'AI-консультант',
    collections: 'Коллекции',
    contact: 'Контакты',
    search: 'Поиск',
    wishlist: 'Избранное',
    cart: 'Корзина',
    profile: 'Профиль',
  },
  cta: {
    viewCollection: 'Смотреть коллекцию',
    aiAdvisor: 'AI-консультант',
    addToCart: 'В корзину',
    buyNow: 'Купить сейчас',
    viewAll: 'Все',
    subscribe: 'Подписаться',
    send: 'Отправить',
    sizeGuide: 'Таблица размеров',
    tryOn: 'Виртуальная примерка',
    notifyBack: 'Сообщить о наличии',
  },
  hero: {
    title1: 'Почувствуйте',
    title2: 'совершенство',
    subtitle:
      'Премиальные платки и хиджабы, созданные для каждой женщины',
  },
  sections: {
    categories: 'Категории',
    popular: 'Популярные товары',
    reviews: 'Отзывы клиентов',
    newsletter: 'Новости и спецпредложения',
    newsletterHint:
      'Будьте первой в курсе новых поступлений и скидок',
  },
  common: {
    som: 'сум',
    loading: 'Загрузка…',
    search: 'Название, ткань, цвет...',
    emailPh: 'Ваш e-mail',
  },
  loyalty: {
    title: 'Баллы Hijob',
    balance: 'Ваш баланс',
    earned: 'Всего накоплено',
    howTo: 'С каждой покупки 2% баллов — тратьте их на следующий заказ.',
    apply: 'Применить баллы',
  },
};

export const EN: Dict = {
  nav: {
    home: 'Home',
    catalog: 'Catalog',
    ai: 'AI Advisor',
    collections: 'Collections',
    contact: 'Contact',
    search: 'Search',
    wishlist: 'Wishlist',
    cart: 'Cart',
    profile: 'Profile',
  },
  cta: {
    viewCollection: 'View collection',
    aiAdvisor: 'AI Advisor',
    addToCart: 'Add to cart',
    buyNow: 'Buy now',
    viewAll: 'See all',
    subscribe: 'Subscribe',
    send: 'Send',
    sizeGuide: 'Size guide',
    tryOn: 'Virtual try-on',
    notifyBack: 'Notify me',
  },
  hero: {
    title1: 'Feel the',
    title2: 'perfection',
    subtitle:
      'Premium scarves and hijabs crafted for every woman',
  },
  sections: {
    categories: 'Categories',
    popular: 'Popular products',
    reviews: 'Customer reviews',
    newsletter: 'News & special offers',
    newsletterHint:
      'Be the first to know about new drops and discounts',
  },
  common: {
    som: 'UZS',
    loading: 'Loading…',
    search: 'Name, fabric, color...',
    emailPh: 'Your email',
  },
  loyalty: {
    title: 'Hijob points',
    balance: 'Your balance',
    earned: 'Total earned',
    howTo: 'Earn 2% back on every order and spend it on the next one.',
    apply: 'Apply points',
  },
};

export const DICTIONARIES: Record<Locale, Dict> = { uz: UZ, ru: RU, en: EN };
