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
  console.log(body);
  console.log('go here');

  console.log(process.env.NEYNAR_API_KEY);
  const { isValid, message } = await getFrameMessage(body, {
    neynarApiKey: process.env.NEYNAR_API_KEY,
  });
  // {
  //   "valid": true,
  //   "action": {
  //     "object": "validated_frame_action",
  //     "interactor": {
  //       "object": "user",
  //       "fid": 260631,
  //       "custody_address": "0xf269b5c8e594e5cff00d7411210b2e23b2bbc228",
  //       "username": "bella03",
  //       "display_name": "Bella",
  //       "pfp_url": "https://i.imgur.com/AGWaXFA.jpg",
  //       "profile": {
  //         "bio": {
  //           "text": "Dev"
  //         }
  //       },
  //       "follower_count": 21,
  //       "following_count": 1,
  //       "verifications": [
  //         "0x91b547360010f6dd7ba638a47c42e6edce7a8e88"
  //       ],
  //       "active_status": "inactive"
  //     },
  //     "tapped_button": {
  //       "index": 1
  //     },
  //     "input": {
  //       "text": ""
  //     },
  //     "url": "https://37b1-2a01-c23-5deb-8400-909f-5499-b2ad-4341.ngrok-free.app",
  //     "cast": {
  //       "object": "cast_dehydrated",
  //       "hash": "0xab977f6ce45d2039de240c2fde02ce2f881d3707",
  //       "fid": 260631
  //     },
  //     "timestamp": "2024-02-13T16:35:43.000Z"
  //   },
  //   "signature_temporary_object": {
  //     "note": "temporary object for signature validation, might be removed in future versions. do not depend on this object, reach out if needed.",
  //     "hash": "0x6b8651d98fc53568677a67d86156f5760edcf267",
  //     "hash_scheme": "HASH_SCHEME_BLAKE3",
  //     "signature": "nB4GpbQ7K6pKNdE1UkEsvmBO7LTUFhb0z1XaWkbvcQN9IDBK4e1FtlCQZtCHJZf8aLOWo3mNh9CCTDbWt7fJCQ==",
  //     "signature_scheme": "SIGNATURE_SCHEME_ED25519",
  //     "signer": "0xc0e9f6136868bce2214bfc27f1fbbf82932490061e7a4d2f5482f74682d85c37"
  //   }
  // }

  if (message?.button === 1 && isValid && allowedOrigin(message)) {
    const isActive = message.raw.action.interactor.active_status === 'active';

    if (isActive) {
      const fid = message.interactor.fid;
      const { transactionId, transactionHash } = ((await kv.get(`session:260631`)) ??
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
            image: `${NEXT_PUBLIC_URL}/api/images/claimed`,
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
            image: `${NEXT_PUBLIC_URL}/api/images/check`,
          }),
        );
      } else {
        const buttons = getAddressButtons(message.interactor);
        return new NextResponse(
          getFrameHtml({
            buttons,
            image: `${NEXT_PUBLIC_URL}/api/images/select`,
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
