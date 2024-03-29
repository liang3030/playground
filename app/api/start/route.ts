import { FrameRequest, getFrameMessage } from '@coinbase/onchainkit';
import { NextRequest, NextResponse } from 'next/server';
import { NEXT_PUBLIC_URL, ZORA_COLLECTION_ADDRESS, ZORA_TOKEN_ID } from '../../config';
import { getAddressButtons } from '../../lib/addresses';
import { allowedOrigin } from '../../lib/origin';
import { kv } from '@vercel/kv';
import { getFrameHtml } from '../../lib/getFrameHtml';
import { Session } from '../../lib/types';
import { mintResponse } from '../../lib/responses';

async function getResponse(req: NextRequest): Promise<NextResponse> {
  console.log('test');
  const body: FrameRequest = await req.json();
  // console.log(body);
  console.log('go here');

  const { isValid, message } = await getFrameMessage(body, {
    neynarApiKey: process.env.NEYNAR_API_KEY,
  });
  console.log(message);
  if (message?.button === 1 && isValid && allowedOrigin(message)) {
    const isActive = message.raw.action.interactor.active_status === 'active';

    if (isActive) {
      const fid = message.interactor.fid;
      const { transactionId, transactionHash } = ((await kv.get(`session:${fid}`)) ??
        {}) as Session;
      if (transactionHash) {
        // Already minted
        return new NextResponse(
          getFrameHtml({
            buttons: [
              {
                label: 'Transaction',
                action: 'link',
                target: `https://basescan.org/tx/${transactionHash}`,
              },
              {
                label: 'Mint',
                action: 'mint',
                target: `eip155:8453:${ZORA_COLLECTION_ADDRESS}:${ZORA_TOKEN_ID}`,
              },
            ],
            image: `https://www.furrend.xyz/blog_7.9bde0092.png`,
          }),
        );
      } else if (transactionId) {
        // Mint in queue
        return new NextResponse(
          getFrameHtml({
            buttons: [
              {
                label: '🔄 Check status',
              },
            ],
            post_url: `${NEXT_PUBLIC_URL}/api/check`,
            image: `https://www.furrend.xyz/blog_7.9bde0092.png`,
          }),
        );
      } else {
        const buttons = getAddressButtons(message.interactor);
        return new NextResponse(
          getFrameHtml({
            buttons,
            image: `https://www.furrend.xyz/blog_7.9bde0092.png`,
            post_url: `${NEXT_PUBLIC_URL}/api/confirm`,
          }),
        );
      }
    } else {
      return mintResponse();
    }
  } else return new NextResponse('Unauthorized', { status: 401 });
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = 'force-dynamic';
