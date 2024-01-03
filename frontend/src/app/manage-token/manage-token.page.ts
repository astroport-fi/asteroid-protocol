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

@Component({
  selector: 'app-manage-token',
  templateUrl: './manage-token.page.html',
  styleUrls: ['./manage-token.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule, DateAgoPipe, HumanTypePipe, DecimalPipe, HumanSupplyPipe, TokenDecimalsPipe, RouterLink, ShortenAddressPipe, MaskitoModule],
})
export class ManageTokenPage implements OnInit {

  isLoading = false;
  token: any;
  history: any;
  balance: any;
  address: string = '';
  previousAddress: string = '';
  explorerTxUrl: string = environment.api.explorer;
  showTransfer: boolean = false;


  transferForm: FormGroup;

  readonly numberMask: MaskitoOptions;

  readonly maskPredicate: MaskitoElementPredicateAsync = async (el) => (el as HTMLIonInputElement).getInputElement();

  constructor(private activatedRoute: ActivatedRoute, private protocolService: CFT20Service, private modalCtrl: ModalController, private walletService: WalletService, private builder: FormBuilder) {
    this.transferForm = this.builder.group({
      basic: this.builder.group({
        destination: ['', [Validators.required, Validators.minLength(45), Validators.maxLength(45), Validators.pattern("^[a-zA-Z0-9]*$")]],
        amount: [10, [Validators.required, Validators.pattern("^[0-9 ]*$")]],
      }),
    });

    this.numberMask = maskitoNumberOptionsGenerator({
      decimalSeparator: '.',
      thousandSeparator: ' ',
      precision: 0,
      min: 1.000000,
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
              transaction: {
                hash: {
                  _eq: this.activatedRoute.snapshot.params["txhash"]
                }
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
      keyboardClose: false,
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

  openTransfer() {
    this.showTransfer = true;
  }

  cancelTransfer() {
    this.showTransfer = false;
  }

}
