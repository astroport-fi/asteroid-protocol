import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ModalController } from '@ionic/angular';
import { MaskitoModule } from '@maskito/angular';
import { MaskitoElementPredicateAsync, MaskitoOptions } from '@maskito/core';
import { maskitoNumberOptionsGenerator } from '@maskito/kit';
import { ATOM_DECIMALS } from 'src/constants';
import { environment } from 'src/environments/environment';
import { MarketplaceService } from '../core/metaprotocol/marketplace.service';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';
import {
  AsteroidService,
  Token,
  TokenHolding,
} from '../core/service/asteroid.service';
import { WalletService } from '../core/service/wallet.service';
import { TokenHoldingsModalComponent } from '../token-holdings-modal/token-holdings-modal.component';
import { TransactionFlowModalPage } from '../transaction-flow-modal/transaction-flow-modal.page';

@Component({
  selector: 'app-swap-sell',
  templateUrl: './swap-sell.component.html',
  styleUrl: './swap-sell.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    MaskitoModule,
    TokenDecimalsPipe,
  ],
})
export class SwapSellPage implements OnInit {
  @Input({ required: true }) token!: Token;
  @Input({ required: true }) baseTokenUSD!: number;

  tokenHolding: TokenHolding | undefined;
  baseAmount: number = 0;
  tokenAmount: number = 0;
  rate: number = 0;

  sellForm = this.formBuilder.group({
    amount: [''],
    tokenAmount: [''],
    rate: [''],
  });

  readonly decimalMask: MaskitoOptions;
  readonly maskPredicate: MaskitoElementPredicateAsync = async (el) =>
    (el as HTMLIonInputElement).getInputElement();

  constructor(
    private formBuilder: FormBuilder,
    private modalCtrl: ModalController,
    private router: Router,
    private asteroidService: AsteroidService,
    private walletService: WalletService,
    private protocolService: MarketplaceService,
  ) {
    this.decimalMask = maskitoNumberOptionsGenerator({
      decimalSeparator: '.',
      thousandSeparator: ' ',
      precision: 6,
      min: 0,
    });
  }

  async ngOnInit() {
    const address = await this.walletService.getAddress();
    this.tokenHolding = await this.asteroidService.getTokenHolding(
      this.token.id,
      address,
    );

    this.updateRate(this.token!.last_price_base);

    this.sellForm.controls['tokenAmount'].valueChanges.subscribe((change) => {
      if (change) {
        const amount = parseFloat(change.replace(/ /g, ''));
        this.tokenAmount = amount;
        this.updateBaseAmount();
      } else {
        this.tokenAmount = 0;
      }
    });

    this.sellForm.controls['amount'].valueChanges.subscribe((change) => {
      if (change) {
        const amount = parseFloat(change.replace(/ /g, ''));
        this.baseAmount = amount * ATOM_DECIMALS;
        this.updateRate(this.baseAmount / this.tokenAmount);
      } else {
        this.baseAmount = 0;
      }
    });

    this.sellForm.controls['rate'].valueChanges.subscribe((change) => {
      if (change) {
        this.rate = parseFloat(change.replace(/ /g, '')) * ATOM_DECIMALS;
        this.updateBaseAmount();
      }
    });
  }

  updateRate(rate: number) {
    this.rate = rate;
    this.sellForm.controls['rate'].setValue(
      (this.rate / ATOM_DECIMALS).toString(),
      {
        emitEvent: false,
      },
    );
  }

  updateBaseAmount() {
    this.baseAmount = this.tokenAmount * this.rate;
    this.sellForm.controls['amount'].setValue(
      (Math.round(this.baseAmount) / ATOM_DECIMALS).toString(),
      { emitEvent: false },
    );
  }

  async openTokenModal() {
    const emitter = new EventEmitter<TokenHolding>();
    const modal = await this.modalCtrl.create({
      component: TokenHoldingsModalComponent,
      componentProps: {
        baseTokenUSD: this.baseTokenUSD,
        selectionChange: emitter,
      },
    });
    emitter.subscribe((holding) => {
      this.modalCtrl.dismiss();
      if (this.token.id !== holding.token.id) {
        this.router.navigate(['/app/swap', holding.token.ticker, 'sell']);
      }
    });
    await modal.present();
  }

  async sell() {
    if (!this.sellForm.valid) {
      this.sellForm.markAllAsTouched();
      return;
    }

    const config = environment.fees.protocol.marketplace['list.cft20'];

    const { tokenAmount, rate } = this.sellForm.value;
    if (!tokenAmount || !rate) {
      return;
    }

    // We represent the percentage as a multiplier
    const minDepositMultiplier = config.minDepositPercent / 100;

    // Construct metaprotocol memo message
    const params = new Map([
      ['tic', this.token.ticker],
      ['amt', tokenAmount],
      ['ppt', rate],
      ['mindep', minDepositMultiplier.toString()],
      ['to', config.minTimeout.toString()],
    ]);

    // Calculate the amount of ATOM for the listing fee
    // The listing fee is mindep % of amount * ppt
    let listingFee =
      parseFloat(tokenAmount) * parseFloat(rate) * minDepositMultiplier;
    // Avoid very small listing fees
    if (listingFee < config.minDepositAbsolute) {
      listingFee = config.minDepositAbsolute;
    }
    // Convert to uatom
    listingFee = listingFee * 10 ** 6;
    listingFee = Math.floor(listingFee);

    const urn = this.protocolService.buildURN(
      environment.chain.chainId,
      'list.cft20',
      params,
    );
    const modal = await this.modalCtrl.create({
      keyboardClose: true,
      backdropDismiss: false,
      component: TransactionFlowModalPage,
      componentProps: {
        urn,
        metadata: null,
        data: null,
        routerLink: ['/app/manage/token', this.token.ticker],
        resultCTA: 'View transaction',
        metaprotocol: 'marketplace',
        metaprotocolAction: 'list.cft20',
        overrideFee: listingFee,
      },
    });
    modal.present();
  }
}
