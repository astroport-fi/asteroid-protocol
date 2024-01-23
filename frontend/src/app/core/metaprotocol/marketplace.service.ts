import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { WalletStatus } from '../enum/wallet-status.enum';
import { defaultRegistryTypes, SigningStargateClient } from '@cosmjs/stargate';
import { AccountResponse } from '../types/account-response';
import { api } from '../helpers/api';


@Injectable({
    providedIn: 'root'
})
export class MarketplaceService {
    version: string = 'v1';

    constructor() { }

    buildURN(chainId: string, operation: string, params: Map<string, string>) {
        // The URN for buying a token is as follows
        // urn:{metaprotocol}:{chain-id}@{version};{op}${param1}={value1},{param2}={value2},{param3}={value3}
        // urn:marketplace:cosmoshub-1@v1;buy$h=listinghash
        const paramString = Array.from(params, ([key, value]) => `${key}=${value}`).join(',');
        const urn = `urn:marketplace:${chainId}@${this.version};${operation}$${paramString}`;

        return urn;
    }

}
