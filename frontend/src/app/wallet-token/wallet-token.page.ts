import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { Chain, order_by } from '../core/types/zeus';
import { environment } from 'src/environments/environment';
import { DateAgoPipe } from '../core/pipe/date-ago.pipe';
import { HumanTypePipe } from '../core/pipe/human-type.pipe';
import { HumanSupplyPipe } from '../core/pipe/human-supply.pipe';
import { ShortenAddressPipe } from '../core/pipe/shorten-address.pipe';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CFT20Service } from '../core/metaprotocol/cft20.service';
import { TransactionFlowModalPage } from '../transaction-flow-modal/transaction-flow-modal.page';
import { WalletService } from '../core/service/wallet.service';
import { MaskitoElementPredicateAsync, MaskitoOptions } from '@maskito/core';
import { maskitoNumberOptionsGenerator } from '@maskito/kit';
import { MaskitoModule } from '@maskito/angular';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-wallet-token',
  templateUrl: './wallet-token.page.html',
  styleUrls: ['./wallet-token.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule, DateAgoPipe, HumanTypePipe, DecimalPipe, HumanSupplyPipe, TokenDecimalsPipe, RouterLink, ShortenAddressPipe, MaskitoModule, TableModule],
})
export class WalletTokenPage implements OnInit {

  isLoading = false;
  token: any;
  history: any;
  balance: any;
  address: string = '';
  previousAddress: string = '';
  explorerTxUrl: string = environment.api.explorer;
  showTransfer: boolean = false;
  showSell: boolean = false;


  transferForm: FormGroup;
  sellForm: FormGroup;

  readonly numberMask: MaskitoOptions;
  readonly decimalMask: MaskitoOptions;

  readonly maskPredicate: MaskitoElementPredicateAsync = async (el) => (el as HTMLIonInputElement).getInputElement();
  readonly decimalMaskPredicate: MaskitoElementPredicateAsync = async (el) => (el as HTMLIonInputElement).getInputElement();

  constructor(private activatedRoute: ActivatedRoute, private protocolService: CFT20Service, private modalCtrl: ModalController, private walletService: WalletService, private builder: FormBuilder) {
    this.transferForm = this.builder.group({
      basic: this.builder.group({
        destination: ['', [Validators.required, Validators.minLength(45), Validators.maxLength(45), Validators.pattern("^[a-zA-Z0-9]*$")]],
        amount: [10, [Validators.required, Validators.pattern("^[0-9. ]*$")]],
      }),
    });

    this.sellForm = this.builder.group({
      basic: this.builder.group({
        amount: [10, [Validators.required, Validators.pattern("^[0-9. ]*$")]],
        price: [0.55, [Validators.required, Validators.pattern("^[0-9. ]*$")]],
      }),
    });

    this.numberMask = maskitoNumberOptionsGenerator({
      decimalSeparator: '.',
      thousandSeparator: ' ',
      precision: 0,
      min: 1.000000,
    });

    this.decimalMask = maskitoNumberOptionsGenerator({
      decimalSeparator: '.',
      thousandSeparator: ' ',
      precision: 6,
      min: 0,
    });
  }

  async ngOnInit() {
    this.isLoading = true;

    this.previousAddress = this.activatedRoute.snapshot.queryParams["address"];

    try {

      const chain = Chain(environment.api.endpoint)
      const result = await chain('query')({
        token: [
          {
            where: {
              ticker: {
                _eq: this.activatedRoute.snapshot.params["ticker"]
              }
            }
          }, {
            id: true,
            name: true,
            ticker: true,
            decimals: true,
            transaction: {
              hash: true,
            },
            content_path: true,
            content_size_bytes: true,
            circulating_supply: true,
          }
        ]
      });

      this.token = result.token[0];


      const account = await this.walletService.getAccount();
      this.address = account.address;

      const balanceResult = await chain('query')({
        token_holder: [
          {
            where: {
              address: {
                _eq: account.address
              },
              token_id: {
                _eq: this.token.id
              }
            },
          }, {
            id: true,
            amount: true,
            token: {
              decimals: true,
            }
          }
        ],
        token_address_history: [
          {
            where: {
              _or: [
                {
                  sender: {
                    _eq: account.address
                  },
                },
                {
                  receiver: {
                    _eq: account.address
                  },
                }
              ],
              token_id: {
                _eq: this.token.id
              }
            },
            order_by: [
              {
                height: order_by.desc
              }
            ],
          }, {
            id: true,
            height: true,
            token: {
              decimals: true,
            },
            transaction: {
              hash: true,
            },
            action: true,
            amount: true,
            sender: true,
            receiver: true,
            date_created: true,
          }
        ]
      });

      this.history = balanceResult.token_address_history;
      if (balanceResult.token_holder.length == 1) {
        this.balance = balanceResult.token_holder[0];
      } else {
        this.balance = {
          amount: 0,
          token: {
            decimals: 0,
          }
        };
      }
    } catch (err) {
      this.balance = {
        amount: 0,
        token: {
          decimals: 0,
        }
      };
      this.history = [];
    }


    this.isLoading = false;
  }

  async transfer() {

    if (!this.transferForm.valid) {
      this.transferForm.markAllAsTouched();
      return;
    }

    // Construct metaprotocol memo message
    const params = new Map([
      ["tic", this.token.ticker],
      ["amt", this.transferForm.value.basic.amount],
      ["dst", this.transferForm.value.basic.destination],
    ]);
    const urn = this.protocolService.buildURN(environment.chain.chainId, 'transfer', params);
    const modal = await this.modalCtrl.create({
      keyboardClose: true,
      backdropDismiss: false,
      component: TransactionFlowModalPage,
      componentProps: {
        urn,
        metadata: null,
        data: null,
        routerLink: ['/app/manage/token', this.token.transaction.hash],
        resultCTA: 'View transaction',
        metaprotocol: 'cft20',
        metaprotocolAction: 'transfer',
      }
    });
    modal.present();
  }

  async sell() {

    if (!this.sellForm.valid) {
      this.sellForm.markAllAsTouched();
      return;
    }

    // Construct metaprotocol memo message
    const params = new Map([
      ["tic", this.token.ticker],
      ["amt", this.sellForm.value.basic.amount],
      ["ppt", this.sellForm.value.basic.price],
    ]);
    const urn = this.protocolService.buildURN(environment.chain.chainId, 'list', params);
    const modal = await this.modalCtrl.create({
      keyboardClose: true,
      backdropDismiss: false,
      component: TransactionFlowModalPage,
      componentProps: {
        urn,
        metadata: null,
        data: null,
        routerLink: ['/app/manage/token', this.token.transaction.hash],
        resultCTA: 'View transaction',
        metaprotocol: 'cft20',
        metaprotocolAction: 'list',
      }
    });
    modal.present();
  }

  openTransfer() {
    this.showTransfer = true;
  }

  cancelTransfer() {
    this.showTransfer = false;
  }

  openSell() {
    this.showSell = true;
  }

  cancelSell() {
    this.showSell = false;
  }



}
