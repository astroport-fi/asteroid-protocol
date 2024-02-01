import { Component, Input, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronForward, keySharp, pencilSharp, createSharp, checkmark, closeOutline, close } from "ionicons/icons";
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

  wizardStep: "deposit" | "buy" | "inflight" | "failed" | "invalid" = "deposit";
  errorText: string = "";
  listing: any = null;
  status: any = null;
  isLoading: boolean = true;

  // sellForm: FormGroup;
  minTradeSize: number = (environment.fees.protocol.marketplace["list.cft20"] as any).minTradeSize;
  senderBalance: number = 0;

  minDepositAbsolute: number = (environment.fees.protocol.marketplace["list.cft20"] as any).minDepositAbsolute;
  minDepositPercent: number = (environment.fees.protocol.marketplace["list.cft20"] as any).minDepositPercent;
  maxDepositPercent: number = (environment.fees.protocol.marketplace["list.cft20"] as any).maxDepositPercent;
  minTimeout: number = (environment.fees.protocol.marketplace["list.cft20"] as any).minTimeout;
  maxTimeout: number = (environment.fees.protocol.marketplace["list.cft20"] as any).maxTimeout;



  // readonly numberMask: MaskitoOptions;
  // readonly decimalMask: MaskitoOptions;

  readonly maskPredicate: MaskitoElementPredicateAsync = async (el) => (el as HTMLIonInputElement).getInputElement();
  readonly decimalMaskPredicate: MaskitoElementPredicateAsync = async (el) => (el as HTMLIonInputElement).getInputElement();

  constructor(private walletService: WalletService, private chainService: ChainService, private modalCtrl: ModalController, private router: Router, private builder: FormBuilder, private protocolService: MarketplaceService) {
    addIcons({ checkmark, closeOutline, close });

    // this.sellForm = this.builder.group({
    //   basic: this.builder.group({
    //     amount: [10, [Validators.required, Validators.pattern("^[0-9. ]*$")]],
    //     price: [0.1, [Validators.required, Validators.pattern("^[0-9. ]*$")]],
    //     minDeposit: [this.minDepositPercent, [Validators.required, Validators.min(this.minDepositPercent), Validators.max(this.maxDepositPercent), Validators.pattern("^[0-9. ]*$")]],
    //     timeoutBlocks: [this.minTimeout, [Validators.required, Validators.min(this.minTimeout), Validators.max(this.maxTimeout), Validators.pattern("^[0-9 ]*$")]],
    //   }),
    // });

    // this.numberMask = maskitoNumberOptionsGenerator({
    //   decimalSeparator: '.',
    //   thousandSeparator: ' ',
    //   precision: 0,
    //   min: 1.000000,
    // });

    // this.decimalMask = maskitoNumberOptionsGenerator({
    //   decimalSeparator: '.',
    //   thousandSeparator: ' ',
    //   precision: 6,
    //   min: 0,
    // });
  }

  async ngOnInit() {
    this.isLoading = true;
    const ownAccount = await this.walletService.getAccount();


    const chain = Chain(environment.api.endpoint);
    const result = await chain('query')({
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
      this.wizardStep = "invalid";
      this.errorText = "This listing already has a deposit, wait for the deposit to expire or choose a different listing";
      return;
    } else {
      // We are the depositor, we can buy if the timeout hasn't passed
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
    // const modal = await this.modalCtrl.create({
    //   keyboardClose: true,
    //   backdropDismiss: false,
    //   component: TransactionFlowModalPage,
    //   componentProps: {
    //     urn,
    //     metadata: null,
    //     data: null,
    //     routerLink: ['/app/market', this.token.ticker],
    //     resultCTA: 'Back to market',
    //     metaprotocol: 'marketplace',
    //     metaprotocolAction: 'deposit',
    //     messages: [purchaseMessage],
    //     messagesJSON: [purchaseMessageJSON],
    //   }
    // });
    // modal.present();


    // if (!this.sellForm.valid) {
    //   this.sellForm.markAllAsTouched();
    //   return;
    // }

    // // Close the sell modal
    // this.modalCtrl.dismiss();

    // const amount = StripSpacesPipe.prototype.transform(this.sellForm.value.basic.amount).toString();
    // const ppt = StripSpacesPipe.prototype.transform(this.sellForm.value.basic.price).toString();

    // let minDepositPercent = parseFloat(StripSpacesPipe.prototype.transform(this.sellForm.value.basic.minDeposit).toString());
    // // We represent the percentage as a multiplier
    // const minDepositMultiplier = minDepositPercent / 100;
    // const timeoutBlocks = StripSpacesPipe.prototype.transform(this.sellForm.value.basic.timeoutBlocks).toString();

    // // Construct metaprotocol memo message
    // const params = new Map([
    //   ["tic", this.ticker],
    //   ["amt", amount],
    //   ["ppt", ppt],
    //   ["mindep", minDepositMultiplier.toString()],
    //   ["to", timeoutBlocks],
    // ]);

    // // Calculate the amount of ATOM for the listing fee
    // // The listing fee is mindep % of amount * ppt
    // let listingFee = parseFloat(amount) * parseFloat(ppt) * minDepositMultiplier;
    // // Avoid very small listing fees
    // if (listingFee < this.minDepositAbsolute) {
    //   listingFee = this.minDepositAbsolute;
    // }
    // // Convert to uatom
    // listingFee = listingFee * 10 ** 6;
    // listingFee = Math.floor(listingFee);

    // const urn = this.protocolService.buildURN(environment.chain.chainId, 'list.cft20', params);
    // const modal = await this.modalCtrl.create({
    //   keyboardClose: true,
    //   backdropDismiss: false,
    //   component: TransactionFlowModalPage,
    //   componentProps: {
    //     urn,
    //     metadata: null,
    //     data: null,
    //     routerLink: ['/app/manage/token', this.ticker],
    //     resultCTA: 'View transaction',
    //     metaprotocol: 'marketplace',
    //     metaprotocolAction: 'list.cft20',
    //     overrideFee: listingFee,
    //   }
    // });
    // modal.present();
  }

  next() {
    // this.wizardStep = "failed";

    // this.errorText = "Deposit not availble anymore"
  }

  cancel() {
    this.modalCtrl.dismiss();
  }

}
