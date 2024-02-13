// TODO: change to ngrok proxy url
export const NEXT_PUBLIC_URL =
  process.env.NEXT_PUBLIC_VERCEL_ENV || 'https://playground-git-main-liang3030.vercel.app/';

export const ZORA_COLLECTION_ADDRESS = '0x3f5411d39e834e1df03f7da4be6524a229b7234f';

export const ZORA_TOKEN_ID = '1';
export const CARD_DIMENSIONS = {
  width: 800,
  height: 800,
};
export const TOKEN_IMAGE = `${NEXT_PUBLIC_URL}/horse.png`;
