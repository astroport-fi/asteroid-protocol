import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { WalletStatus } from '../enum/wallet-status.enum';
import { defaultRegistryTypes, SigningStargateClient } from '@cosmjs/stargate';
import { AccountResponse } from '../types/account-response';
import { api } from '../helpers/api';


@Injectable({
    providedIn: 'root'
})
export class CFT20Service {
    version: string = 'v1';

    constructor() { }

    buildURN(chainId: string, operation: string, params: Map<string, string>) {
        // The URN for deploying a new token is as follows
        // urn:{metaprotocol}:{chain-id}@{version};{op}${param1}={value1},{param2}={value2},{param3}={value3}
        // urn:cft20:cosmoshub-1@v1;mint$nam=MyToken,tic=TOK
        const paramString = Array.from(params, ([key, value]) => `${key}=${value}`).join(',');
        const urn = `urn:cft20:${chainId}@${this.version};${operation}$${paramString}`;

        return urn;
    }

}
