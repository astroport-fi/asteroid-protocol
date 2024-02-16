import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonicModule, ModalController } from '@ionic/angular';
import { MaskitoModule } from '@maskito/angular';
import { MaskitoElementPredicateAsync, MaskitoOptions } from '@maskito/core';
import { maskitoNumberOptionsGenerator } from '@maskito/kit';
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import { addIcons } from 'ionicons';
import {
  checkmark,
  chevronForward,
  close,
  closeOutline,
  createSharp,
  helpCircleOutline,
  keySharp,
  pencilSharp,
} from 'ionicons/icons';
import { LottieComponent } from 'ngx-lottie';
import { environment } from 'src/environments/environment';
import { delay } from '../core/helpers/delay';
import { CFT20Service } from '../core/metaprotocol/cft20.service';
import { MarketplaceService } from '../core/metaprotocol/marketplace.service';
import { StripSpacesPipe } from '../core/pipe/strip-spaces.pipe';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';
import { ChainService } from '../core/service/chain.service';
import { WalletService } from '../core/service/wallet.service';
import { TxFee } from '../core/types/tx-fee';
import { Chain } from '../core/types/zeus';
import { TransactionFlowModalPage } from '../transaction-flow-modal/transaction-flow-modal.page';

@Component({
  selector: 'app-buy-wizard-modal',
  templateUrl: './buy-wizard-modal.page.html',
  styleUrls: ['./buy-wizard-modal.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    RouterLink,
    LottieComponent,
    MaskitoModule,
    StripSpacesPipe,
    TokenDecimalsPipe,
  ],
})
export class BuyWizardModalPage implements OnInit {
  @Input() hash: string = '';
  @Input() metaprotocol: string = 'inscription';
  @Input() metaprotocolAction: string = 'inscribe';
  @Input() marketplaceType: string = 'cft20';

  wizardStep:
    | 'deposit'
    | 'buy'
    | 'inflight-deposit'
    | 'inflight-buy'
    | 'failed'
    | 'invalid'
    | 'success' = 'deposit';
  errorText: string = '';
  listing: any = null;
  status: any = null;
  isLoading: boolean = true;
  currentChain = environment.chain;
  explorerTxUrl: string = environment.api.explorer;

  @Input() messages: any[] = [];
  @Input() messagesJSON: any[] = [];
  @Input() overrideFee: number = 0;

  isSimulating: boolean = true;
  txHash: string = '';
  chain: any = null;
  gasEstimate: number = parseInt(environment.fees.chain.gasLimit);
  chainFee: number =
    (this.gasEstimate *
      this.currentChain.feeCurrencies[0].gasPriceStep.average) /
    1000000; // Divide by 1 million to get the fee in uatom since the gas price is in 0.005 uatom format
  chainFeeDisplay: number = 0;
  protocolFee: number = 0.005;
  protocolFeeAbsolute: number = 0.005;

  constructor(
    private walletService: WalletService,
    private chainService: ChainService,
    private modalCtrl: ModalController,
    private router: Router,
    private builder: FormBuilder,
    private protocolService: MarketplaceService,
  ) {
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
        },
      ],
      marketplace_listing: [
        {
          where: {
            transaction: {
              hash: {
                _eq: this.hash,
              },
            },
          },
        },
        {
          id: true,
          is_cancelled: true,
          is_deposited: true,
          is_filled: true,
          total: true,
          seller_address: true,
          depositor_address: true,
          deposit_total: true,
          depositor_timedout_block: true,
        },
      ],
    });
    this.listing = result.marketplace_listing[0];
    this.status = result.status[0];

    // Determine type of listing
    const listingTypeResult = await this.chain('query')({
      marketplace_cft20_detail: [
        {
          where: {
            listing_id: {
              _eq: this.listing.id,
            },
          },
        },
        {
          id: true,
        },
      ],
    });
    if (listingTypeResult.marketplace_cft20_detail.length > 0) {
      this.marketplaceType = 'cft20';
    } else {
      this.marketplaceType = 'inscription';
    }

    // Calculate transaction cost
    let totaluatom: bigint = this.listing.total as bigint;
    const deposit: bigint = this.listing.deposit_total as bigint;
    if (deposit > totaluatom) {
      // If deposit is greater than total, then just sent 1uatom to complete the transaction
      totaluatom = BigInt(1);
    } else {
      // Subtract deposit amount already sent
      totaluatom -= deposit;
    }
    let decimalTotal = parseFloat(totaluatom.toString()) / 10 ** 6; // for ATOM

    // Calculate the trading fee
    let overrideFee = (environment.fees.protocol.marketplace['buy'] as any)
      .amount;
    if (
      (environment.fees.protocol.marketplace['buy'] as any).type ==
      'dynamic-percent'
    ) {
      const feePercentage = parseFloat(
        (environment.fees.protocol.marketplace['buy'] as any).amount,
      );
      let fee = decimalTotal * feePercentage;
      if (fee < 0.000001) {
        fee = 0.000001;
      }

      fee = parseFloat(fee.toFixed(6));
      this.protocolFee = fee;
      fee = fee * 10 ** 6; // for ATOM
      this.protocolFeeAbsolute = fee;
      this.overrideFee = fee;
    }

    // Simulate the transaction to get accurate gas estimate
    if (this.wizardStep == 'deposit') {
      await this.deposit(true);
    } else if (this.wizardStep == 'buy') {
      await this.buy(true);
    }

    this.chainFeeDisplay = this.chainFee; // * 10 ** this.currentChain.feeCurrencies[0].coinDecimals;

    this.isLoading = false;

    if (result.marketplace_listing.length == 0) {
      this.wizardStep = 'invalid';
      this.errorText = 'Listing not found';
      return;
    }
    if (this.listing.is_cancelled || this.listing.is_filled) {
      this.wizardStep = 'invalid';
      this.errorText = 'This listing has already been cancelled or filled';
      return;
    }
    if (
      this.listing.is_deposited &&
      ownAccount.address != this.listing.depositor_address
    ) {
      // Check if the deposit has expired
      if (
        this.listing.depositor_timedout_block > this.status.last_known_height
      ) {
        this.wizardStep = 'invalid';
        this.errorText =
          'This listing already has a deposit, wait for the deposit to expire or choose a different listing';
        return;
      }

      // If it hasn't expired, allow reserve
    } else if (ownAccount.address == this.listing.depositor_address) {
      // We are the depositor, we can buy if the timeout hasn't passed
      // although this should use the regular transaction flow
      if (
        this.listing.depositor_timedout_block > this.status.last_known_height
      ) {
        this.wizardStep = 'buy';
        return;
      }
      // If the timeout has passed, show regular deposit flow
    }
  }

  async deposit(simulateOnly: boolean = true) {
    const deposit: bigint = this.listing.deposit_total as bigint;

    const purchaseMessage = {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: MsgSend.encode({
        fromAddress: (await this.walletService.getAccount()).address,
        toAddress: this.listing.seller_address,
        amount: [
          {
            denom: 'uatom',
            amount: deposit.toString(),
          },
        ],
      }).finish(),
    };

    const purchaseMessageJSON = {
      '@type': '/cosmos.bank.v1beta1.MsgSend',
      from_address: (await this.walletService.getAccount()).address,
      to_address: this.listing.seller_address,
      amount: [
        {
          denom: 'uatom',
          amount: deposit.toString(),
        },
      ],
    };

    // Construct metaprotocol memo message
    const params = new Map([['h', this.hash]]);
    const urn = this.protocolService.buildURN(
      environment.chain.chainId,
      'deposit',
      params,
    );

    let fees = await this.updateFees();
    // No fees on deposit
    fees.metaprotocol.denom = 'uatom';
    fees.metaprotocol.amount = '0';

    try {
      await this.updateSimulate(urn, null, null, fees, [purchaseMessageJSON]);
    } catch (e) {
      this.wizardStep = 'failed';
      this.errorText = 'Failed to simulate transaction: ' + e;
      return;
    }
    if (simulateOnly) {
      return;
    }
    // Submit transaction to sign and broadcast
    try {
      await this.submitTransaction(urn, null, null, fees, [purchaseMessage]);
    } catch (e) {
      this.wizardStep = 'failed';
      this.errorText = 'Failed to submit transaction: ' + e;
      return;
    }
  }

  async buy(simulateOnly: boolean = true) {
    let fees = await this.updateFees();
    fees.metaprotocol.receiver = (
      environment.fees.protocol.marketplace['buy'] as any
    ).receiver;
    fees.metaprotocol.denom = 'uatom';
    fees.metaprotocol.amount = this.protocolFeeAbsolute.toString();

    let total: bigint = this.listing.total as bigint;
    total -= this.listing.deposit_total as bigint;

    const purchaseMessage = {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: MsgSend.encode({
        fromAddress: (await this.walletService.getAccount()).address,
        toAddress: this.listing.seller_address,
        amount: [
          {
            denom: 'uatom',
            amount: total.toString(),
          },
        ],
      }).finish(),
    };

    const purchaseMessageJSON = {
      '@type': '/cosmos.bank.v1beta1.MsgSend',
      from_address: (await this.walletService.getAccount()).address,
      to_address: this.listing.seller_address,
      amount: [
        {
          denom: 'uatom',
          amount: total.toString(),
        },
      ],
    };

    // Construct metaprotocol memo message
    const params = new Map([['h', this.hash]]);
    const urn = this.protocolService.buildURN(
      environment.chain.chainId,
      'buy.' + this.marketplaceType,
      params,
    );

    try {
      await this.updateSimulate(urn, null, null, fees, [purchaseMessageJSON]);
    } catch (e) {
      this.wizardStep = 'failed';
      this.errorText = 'Failed to simulate transaction: ' + e;
      return;
    }
    if (simulateOnly) {
      return;
    }

    // Submit transaction to sign and broadcast
    try {
      await this.submitTransaction(urn, null, null, fees, [purchaseMessage]);
    } catch (e) {
      this.wizardStep = 'failed';
      this.errorText = 'Failed to submit transaction: ' + e;
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
        receiver: (environment.fees.protocol as any)[this.metaprotocol][
          this.metaprotocolAction
        ].receiver,
        denom: (environment.fees.protocol as any)[this.metaprotocol][
          this.metaprotocolAction
        ].denom,
        amount: (environment.fees.protocol as any)[this.metaprotocol][
          this.metaprotocolAction
        ].amount,
      },
      chain: {
        denom: this.currentChain.feeCurrencies[0].coinMinimalDenom,
        amount: '0',
      },
      gasLimit: environment.fees.chain.gasLimit,
    };
    if (this.overrideFee > 0) {
      fees.metaprotocol.amount = this.overrideFee.toString();
    }
    this.protocolFee =
      parseInt(fees.metaprotocol.amount) /
      10 ** this.currentChain.feeCurrencies[0].coinDecimals;
    this.protocolFeeAbsolute = parseInt(fees.metaprotocol.amount);

    this.gasEstimate = parseInt(environment.fees.chain.gasLimit);
    return fees;
  }

  // TODO: This was taken from the regular transaction flow
  // It should be moved to it's own service together with all the messy transaction stuff
  async updateSimulate(
    urn: string,
    metadata: string | null,
    data: string | null,
    fees: TxFee,
    messages: any[],
  ) {
    const simulateTx = await this.walletService.createSimulated(
      urn,
      metadata,
      data,
      fees,
      messages,
    );
    const result = await this.chainService.simulateTransaction(simulateTx);

    if (result) {
      this.gasEstimate = parseInt(result.gas_used);
      // Bump gas by 60% to account for any changes
      this.gasEstimate = this.gasEstimate + this.gasEstimate * 0.6;

      // Divide by 1 million to get the fee in uatom since the gas price is in 0.005 uatom format
      this.chainFee =
        (this.gasEstimate *
          this.currentChain.feeCurrencies[0].gasPriceStep.average) /
        1000000;

      // Bump the chain fee by 40% to account for extra storage needed on top of the 40% gas bump
      this.chainFee = this.chainFee + this.chainFee * 0.4;

      // Convert to uatom
      this.chainFee =
        this.chainFee * 10 ** this.currentChain.feeCurrencies[0].coinDecimals;
    }
  }

  async submitTransaction(
    urn: string,
    metadata: string | null,
    data: string | null,
    fees: TxFee,
    messages: any[],
  ) {
    try {
      fees.chain.denom = this.currentChain.feeCurrencies[0].coinMinimalDenom;
      fees.chain.amount = this.chainFee.toFixed(0);
      fees.gasLimit = this.gasEstimate.toFixed(0);

      const signedTx = await this.walletService.sign(
        urn,
        metadata,
        data,
        fees,
        messages,
      );

      this.wizardStep = 'inflight-deposit';
      if (urn.includes('buy')) {
        this.wizardStep = 'inflight-buy';
      }
      this.txHash = await this.walletService.broadcast(signedTx);

      // Keep checking the chain is this TX is successful every second
      // for 180 seconds (3 minutes)
      for (let i = 0; i < 180; i++) {
        await delay(1000);
        try {
          if (this.wizardStep == 'inflight-deposit') {
            const tx = await this.chainService.fetchTransaction(this.txHash);
            if (tx) {
              if (tx.code == 0) {
                // Depending on the flow, we need to either show success for purchase
                // or we need to move on to buying
                // Query API to see if deposit was accepted
                // Transaction was found on chain, now check indexer
                const result = await this.chain('query')({
                  transaction: [
                    {
                      where: {
                        hash: {
                          _eq: this.txHash,
                        },
                      },
                    },
                    {
                      id: true,
                      hash: true,
                      status_message: true,
                    },
                  ],
                });
                if (result.transaction.length > 0) {
                  if (
                    result.transaction[0].status_message.toLowerCase() ==
                    'success'
                  ) {
                    // If the indexer reported success, we can move on to the next step
                    this.txHash = '';
                    // const fees = await this.updateFees();
                    // Simulate buy to get correct fees
                    await this.buy(true);
                    this.wizardStep = 'buy';
                    this.chainFeeDisplay = this.chainFee;
                    break;
                  } else if (
                    result.transaction[0].status_message
                      .toLowerCase()
                      .includes('error')
                  ) {
                    // We hit an error
                    this.wizardStep = 'failed';
                    this.errorText = this.mapToHumanError(
                      result.transaction[0].status_message,
                    );
                    break;
                  }
                }
              }
            }
          } else if (this.wizardStep == 'inflight-buy') {
            const tx = await this.chainService.fetchTransaction(this.txHash);
            if (tx) {
              if (tx.code == 0) {
                // Depending on the flow, we need to either show success for purchase
                // or we need to move on to buying
                // Query API to see if deposit was accepted
                // Transaction was found on chain, now check indexer
                const result = await this.chain('query')({
                  transaction: [
                    {
                      where: {
                        hash: {
                          _eq: this.txHash,
                        },
                      },
                    },
                    {
                      id: true,
                      hash: true,
                      status_message: true,
                    },
                  ],
                });
                if (result.transaction.length > 0) {
                  if (
                    result.transaction[0].status_message.toLowerCase() ==
                    'success'
                  ) {
                    this.wizardStep = 'success';
                  } else if (
                    result.transaction[0].status_message
                      .toLowerCase()
                      .includes('error')
                  ) {
                    // We hit an error
                    this.wizardStep = 'failed';
                    this.errorText = this.mapToHumanError(
                      result.transaction[0].status_message,
                    );
                    break;
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    } catch (error: any) {
      this.wizardStep = 'failed';

      if (error instanceof Error) {
        this.errorText = error.message;
      }
    }
  }

  mapToHumanError(error: string) {
    if (error.includes('already has a deposit')) {
      return 'This listing already has a deposit, please wait or choose a different listing';
    }
    if (error.includes('order by id') && error.includes("doesn't exist")) {
      return 'The sell order has already been filled or removed';
    }

    return error;
  }

  finish() {
    this.router.navigate(['/app/wallet']);
    this.modalCtrl.dismiss();
  }
}
