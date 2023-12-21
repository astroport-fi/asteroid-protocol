import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { WalletStatus } from '../enum/wallet-status.enum';
import { defaultRegistryTypes, SigningStargateClient } from '@cosmjs/stargate';
import { AccountResponse } from '../types/account-response';
import { api } from '../helpers/api';


@Injectable({
    providedIn: 'root'
})
export class InscriptionService {

    constructor() { }

}
