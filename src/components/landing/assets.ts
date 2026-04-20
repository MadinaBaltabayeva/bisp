const U = (id: string, w: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

export const LANDING_HERO = U("1581092795360-fd1ca04f0952", 2000);

export const LANDING_CATEGORY_IMAGES: Record<string, string> = {
  tools: U("1504148455328-c376907d081c", 800),
  electronics: U("1519389950473-47ba0277781c", 800),
  sports: U("1517649763962-0c623066013b", 800),
  outdoor: U("1504851149312-7a075b496cc7", 800),
  vehicles: U("1449824913935-59a10b8d2000", 800),
  clothing: U("1483985988355-763728e1935b", 800),
  music: U("1511379938547-c1f69419868d", 800),
  "home-garden": U("1416879595882-3373a0480b5b", 800),
};
