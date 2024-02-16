import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Chain } from '../types/zeus';

@Injectable({
  providedIn: 'root',
})
export class PriceService {
  constructor() {}

  async fetchBaseTokenUSDPrice() {
    const chain = Chain(environment.api.endpoint);

    const statusResult = await chain('query')({
      status: [
        {
          where: {
            chain_id: {
              _eq: environment.chain.chainId,
            },
          },
        },
        {
          base_token: true,
          base_token_usd: true,
        },
      ],
    });

    return statusResult.status[0].base_token_usd || 0.0;
  }
}
