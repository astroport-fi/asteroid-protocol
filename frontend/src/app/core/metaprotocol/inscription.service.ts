import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { WalletStatus } from '../enum/wallet-status.enum';
import { defaultRegistryTypes, SigningStargateClient } from '@cosmjs/stargate';
import { AccountResponse } from '../types/account-response';
import { api } from '../helpers/api';


export type InscriptionMetadata = {
    parent: Parent;
    metadata: ContentInscription;
}

export type Parent = {
    type: string;
    identifier: string;
};

export type ContentInscription = {
    name: string;
    description: string;
    mime: string;
};


@Injectable({
    providedIn: 'root'
})
export class InscriptionService {

    constructor() { }

    buildURN(chainId: string, operation: string, params: Map<string, string>) {
        // The URN for creating an inscription is
        // urn:{metaprotocol}:{chain-id}@{version};{op}?{param1}={value1}&{param2}={value2}&{param3}={value3}
        // urn:inscription:cosmoshub-1@v1;inscribe?h={hash}
        // where hash is SHA-256(base64 encoded JSON metadata + base64 encoded data)
        const paramString = Array.from(params, ([key, value]) => `${key}=${value}`).join('&');
        const urn = `urn:inscription:${chainId};${operation}?${paramString}`;

        return urn;
    }
}
