import { Component, Input, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronForward, keySharp, pencilSharp, createSharp, checkmark, closeOutline, close } from "ionicons/icons";
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
  imports: [IonicModule, ReactiveFormsModule, CommonModule, FormsModule, RouterLink, LottieComponent, MaskitoModule, StripSpacesPipe]
})
export class BuyWizardModalPage implements OnInit {

  @Input() hash: string = '';

  wizardStep: "deposit" | "buy" = "deposit";


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
    const sender = await this.walletService.getAccount();

    // const chain = Chain(environment.api.endpoint);
    // const result = await chain('query')({
    //   token: [
    //     {
    //       where: {
    //         ticker: {
    //           _eq: this.ticker
    //         }
    //       }
    //     }, {
    //       id: true,
    //       decimals: true,
    //       last_price_base: true,
    //     }
    //   ],
    // });
    // if (result.token.length > 0) {
    //   this.sellForm.patchValue({
    //     basic: {
    //       price: TokenDecimalsPipe.prototype.transform(result.token[0].last_price_base as number, 6)
    //     }
    //   });
    // }

    // const balanceResult = await chain('query')({
    //   token_holder: [
    //     {
    //       where: {
    //         address: {
    //           _eq: sender.address
    //         },
    //         token_id: {
    //           _eq: result.token[0].id
    //         }
    //       }
    //     }, {
    //       amount: true,
    //     }
    //   ]
    // });
    // if (balanceResult.token_holder.length > 0) {
    //   // Get the sender's balance with decimals
    //   this.senderBalance = TokenDecimalsPipe.prototype.transform(parseInt(balanceResult.token_holder[0].amount as string), result.token[0].decimals as number);
    // }


  }

  async submit() {
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
    this.wizardStep = "buy";
  }

  cancel() {
    this.modalCtrl.dismiss();
  }

}
