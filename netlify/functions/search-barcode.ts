import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import { Axios } from 'axios';
import { load } from 'cheerio';

const barcodeBgBaseUrl = encodeURI('https://barcode.bg/barcode/BG/Информация-за-баркод.htm');
const responseHeaders: Record<string, string | number> = {
  'content-type': 'application/json',
};
const userAgents: string[] = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:129.0) Gecko/20100101 Firefox/135.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
];
const axios = new Axios({
  timeout: 10 * 1000,
  headers: {
    'content-type': 'text/html',
  },
});

const pickRandomUserAgent = (): string => userAgents[Math.trunc(Math.random() * userAgents.length)];

const parseBarcodeResult = (html: string): string | null => {
  const $ = load(html);
  const $table = $('.randomBarcodes');

  if ($table.length === 0) {
    return null;
  }

  const title = $('.pageTitle').text();
  const titleParts = title.split(' - Баркод:');
  return titleParts[0];
};

const handler: Handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  if (!event.queryStringParameters?.['barcode']) {
    return {
      statusCode: 400,
      headers: responseHeaders,
      body: JSON.stringify({ message: 'Missing barcode parameter' }),
    };
  }

  try {
    const httpRes = await axios.get<string>(barcodeBgBaseUrl, {
      params: {
        barcode: event.queryStringParameters['barcode'],
      },
      headers: {
        'User-Agent': pickRandomUserAgent(),
      },
    });

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({ product: parseBarcodeResult(httpRes.data) }),
    };
  } catch (err) {
    return {
      statusCode: 422,
      headers: responseHeaders,
      body: JSON.stringify({ message: (err as Error).message }),
    };
  }
};

export { handler };
