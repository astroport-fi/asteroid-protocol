import { Component, Input, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronForward, keySharp, pencilSharp, createSharp, checkmark, closeOutline, close, helpCircleOutline } from "ionicons/icons";
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import { LottieComponent } from 'ngx-lottie';
import { WalletService } from '../core/service/wallet.service';
import { environment } from 'src/environments/environment';
import { ChainService } from '../core/service/chain.service';
import { delay } from '../core/helpers/delay';
import { Chain } from '../core/types/zeus';
import { TxFee } from '../core/types/tx-fee';
import { MaskitoElementPredicateAsync, MaskitoOptions } from '@maskito/core';
import { maskitoNumberOptionsGenerator } from '@maskito/kit';
import { MaskitoModule } from '@maskito/angular';
import { CFT20Service } from '../core/metaprotocol/cft20.service';
import { TransactionFlowModalPage } from '../transaction-flow-modal/transaction-flow-modal.page';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';
import { StripSpacesPipe } from '../core/pipe/strip-spaces.pipe';
import { MarketplaceService } from '../core/metaprotocol/marketplace.service';

@Component({
  selector: 'app-buy-wizard-modal',
  templateUrl: './buy-wizard-modal.page.html',
  styleUrls: ['./buy-wizard-modal.page.scss'],
  standalone: true,
  imports: [IonicModule, ReactiveFormsModule, CommonModule, FormsModule, RouterLink, LottieComponent, MaskitoModule, StripSpacesPipe, TokenDecimalsPipe]
})
export class BuyWizardModalPage implements OnInit {

  @Input() hash: string = '';
  @Input() metaprotocol: string = 'inscription';
  @Input() metaprotocolAction: string = 'inscribe';

  wizardStep: "deposit" | "buy" | "inflight" | "failed" | "invalid" = "deposit";
  errorText: string = "";
  listing: any = null;
  status: any = null;
  isLoading: boolean = true;
  currentChain = environment.chain;
  explorerTxUrl: string = environment.api.explorer;

  // @Input() resultCTA: string = 'View inscription';
  // @Input() routerLink: string | [] = '';
  // @Input() urn: string = '';
  // @Input() metadata: string;
  // @Input() data: string;
  @Input() messages: any[] = [];
  @Input() messagesJSON: any[] = [];
  @Input() overrideFee: number = 0;

  isSimulating: boolean = true;
  // errorText: string = '';
  txHash: string = '';
  // state: 'sign' | 'submit' | 'success-onchain' | 'success-indexer' | 'success-inscribed' | 'failed' | 'error' = 'sign';
  // explorerTxUrl: string = environment.api.explorer;
  chain: any = null;
  gasEstimate: number = parseInt(environment.fees.chain.gasLimit);
  chainFee: number = this.gasEstimate * this.currentChain.feeCurrencies[0].gasPriceStep.average / 1000000; // Divide by 1 million to get the fee in uatom since the gas price is in 0.005 uatom format
  protocolFee: number = 0.005;
  protocolFeeAbsolute: number = 0.005;


  constructor(private walletService: WalletService, private chainService: ChainService, private modalCtrl: ModalController, private router: Router, private builder: FormBuilder, private protocolService: MarketplaceService) {
    addIcons({ checkmark, closeOutline, close, helpCircleOutline });
    this.chain = Chain(environment.api.endpoint);
  }

  async ngOnInit() {
    this.isLoading = true;
    const ownAccount = await this.walletService.getAccount();

    const result = await this.chain('query')({
      status: [
        {},
        {
          last_processed_height: true,
          last_known_height: true,
        }
      ],
      marketplace_listing: [
        {
          where: {
            transaction: {
              hash: {
                _eq: this.hash
              }
            }
          }
        }, {
          id: true,
          is_cancelled: true,
          is_deposited: true,
          is_filled: true,
          total: true,
          seller_address: true,
          depositor_address: true,
          deposit_total: true,
          depositor_timedout_block: true,
        }
      ],
    });
    this.listing = result.marketplace_listing[0];
    this.status = result.status[0];

    this.isLoading = false;

    if (result.marketplace_listing.length == 0) {
      this.wizardStep = "invalid";
      this.errorText = "Listing not found";
      return;
    }
    if (this.listing.is_cancelled || this.listing.is_filled) {
      this.wizardStep = "invalid";
      this.errorText = "This listing has already been cancelled or filled";
      return;
    }
    if (this.listing.is_deposited && ownAccount.address != this.listing.depositor_address) {
      // Check if the deposit has expired
      if (this.listing.depositor_timedout_block > this.status.last_known_height) {
        this.wizardStep = "invalid";
        this.errorText = "This listing already has a deposit, wait for the deposit to expire or choose a different listing";
        return;
      }

      // If it hasn't expired, allow reserve

    } else {
      // We are the depositor, we can buy if the timeout hasn't passed
      // although this should use the regular transaction flow
      if (this.listing.depositor_timedout_block > this.status.last_known_height) {
        this.wizardStep = "buy";
        return;
      }
      // If the timeout has passed, show regular deposit flow
    }
  }

  async deposit() {

    const deposit: bigint = this.listing.deposit_total as bigint;

    const purchaseMessage = {
      typeUrl: "/cosmos.bank.v1beta1.MsgSend",
      value: MsgSend.encode({
        fromAddress: (await this.walletService.getAccount()).address,
        toAddress: this.listing.seller_address,
        amount: [
          {
            denom: "uatom",
            amount: deposit.toString(),
          }
        ],
      }).finish(),
    }

    const purchaseMessageJSON = {
      '@type': "/cosmos.bank.v1beta1.MsgSend",
      from_address: (await this.walletService.getAccount()).address,
      to_address: this.listing.seller_address,
      amount: [
        {
          denom: "uatom",
          amount: deposit.toString(),
        }
      ],
    }

    // Construct metaprotocol memo message
    const params = new Map([
      ["h", this.hash],
    ]);
    const urn = this.protocolService.buildURN(environment.chain.chainId, 'deposit', params);
    console.log("URN", urn);


    const fees = await this.updateFees();
    try {
      await this.updateSimulate(urn, null, null, fees, [purchaseMessageJSON]);
    } catch (e) {
      this.wizardStep = "failed";
      this.errorText = "Failed to simulate transaction: " + e;
      return;
    }

    // Submit transaction to sign and broadcast
    try {
      await this.submitTransaction(urn, null, null, fees, [purchaseMessage]);
    } catch (e) {
      this.wizardStep = "failed";
      this.errorText = "Failed to submit transaction: " + e;
      return;
    }

  }


  cancel() {
    this.modalCtrl.dismiss();
  }

  // TODO: This was taken from the regular transaction flow
  // It should be moved to it's own service together with all the messy transaction stuff
  async updateFees() {
    const fees: TxFee = {
      metaprotocol: {
        receiver: (environment.fees.protocol as any)[this.metaprotocol][this.metaprotocolAction].receiver,
        denom: (environment.fees.protocol as any)[this.metaprotocol][this.metaprotocolAction].denom,
        amount: (environment.fees.protocol as any)[this.metaprotocol][this.metaprotocolAction].amount,
      },
      chain: {
        denom: this.currentChain.feeCurrencies[0].coinMinimalDenom,
        amount: "0",
      },
      gasLimit: environment.fees.chain.gasLimit,
    }
    if (this.overrideFee > 0) {
      fees.metaprotocol.amount = this.overrideFee.toString();
    }

    this.protocolFee = parseInt(fees.metaprotocol.amount) / 10 ** this.currentChain.feeCurrencies[0].coinDecimals;
    this.protocolFeeAbsolute = parseInt(fees.metaprotocol.amount);

    this.gasEstimate = parseInt(environment.fees.chain.gasLimit);
    return fees;
  }

  // TODO: This was taken from the regular transaction flow
  // It should be moved to it's own service together with all the messy transaction stuff
  async updateSimulate(urn: string, metadata: string | null, data: string | null, fees: TxFee, messages: any[]) {
    const simulateTx = await this.walletService.createSimulated(urn, metadata, data, fees, messages);
    const result = await this.chainService.simulateTransaction(simulateTx);

    if (result) {
      this.gasEstimate = parseInt(result.gas_used);
      // Bump gas by 60% to account for any changes
      this.gasEstimate = this.gasEstimate + (this.gasEstimate * 0.6);

      // Divide by 1 million to get the fee in uatom since the gas price is in 0.005 uatom format
      this.chainFee = (this.gasEstimate * this.currentChain.feeCurrencies[0].gasPriceStep.average) / 1000000;

      // Bump the chain fee by 40% to account for extra storage needed on top of the 40% gas bump
      this.chainFee = this.chainFee + (this.chainFee * 0.4);

      // Convert to uatom
      this.chainFee = this.chainFee * 10 ** this.currentChain.feeCurrencies[0].coinDecimals;
    }
  }

  async submitTransaction(urn: string, metadata: string | null, data: string | null, fees: TxFee, messages: any[]) {
    try {

      const signedTx = await this.walletService.sign(urn, metadata, data, fees, messages);
      // const signedTx = await this.walletService.signMobile(this.urn, this.metadata, this.data, fees, this.messages);

      this.wizardStep = 'inflight';
      this.txHash = await this.walletService.broadcast(signedTx);

      // Keep checking the chain is this TX is successful every second
      // for 180 seconds (3 minutes)
      for (let i = 0; i < 180; i++) {
        await delay(1000);
        try {
          if (this.wizardStep == 'inflight') {
            const tx = await this.chainService.fetchTransaction(this.txHash);
            if (tx) {
              if (tx.code == 0) {
                // Depending on the flow, we need to either show success for purchase
                // or we need to move on to buying

                this.wizardStep = 'success-onchain';
              }
            }
            // } else {
            //   // Transaction was found on chain, now check indexer
            //   // const result = await this.chain('query')({
            //   //   transaction: [
            //   //     {
            //   //       where: {
            //   //         hash: {
            //   //           _eq: this.txHash
            //   //         }
            //   //       }
            //   //     }, {
            //   //       id: true,
            //   //       hash: true,
            //   //       status_message: true,
            //   //     }
            //   //   ]
            //   // });

            //   // if (result.transaction.length > 0) {
            //   //   this.wizardStep = 'success-indexer';
            //   //   // Indexer has it, keep checking until statusMessage changes
            //   //   // to something else than pending
            //   //   if (result.transaction[0].status_message.toLowerCase() == 'success') {
            //   //     this.wizardStep = 'success-inscribed';
            //   //     break;
            //   //   } else if (result.transaction[0].status_message.toLowerCase().includes('error')) {
            //   //     // We hit an error
            //   //     this.wizardStep = 'failed';
            //   //     this.errorText = this.mapToHumanError(result.transaction[0].status_message);
            //   //     break;
            //   //   }
            //   // }
            // }
          }
        catch (e) {
            console.error(e);
          }
        }
    } catch (error: any) {
        // this.state = 'error';

        // if (error instanceof Error) {
        //   this.errorText = error.message;
        // }
      }
    }
}
