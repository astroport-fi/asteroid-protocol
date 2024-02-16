import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
// import { FormsModule } from '@angular/forms';
// import { IonicModule } from '@ionic/angular';
import {
  AlertController,
  IonAvatar,
  IonBackButton,
  IonButton,
  IonButtons,
  IonChip,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonLabel,
  IonMenuButton,
  IonProgressBar,
  IonRow,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { LottieComponent } from 'ngx-lottie';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { TableModule } from 'primeng/table';
import { environment } from 'src/environments/environment';
import { Chain } from '../core/helpers/zeus';
import { DateAgoPipe } from '../core/pipe/date-ago.pipe';
import { HumanSupplyPipe } from '../core/pipe/human-supply.pipe';
import { HumanTypePipe } from '../core/pipe/human-type.pipe';
import { ShortenAddressHiddenPipe } from '../core/pipe/shorten-address-hidden.pipe';
import { ShortenAddressPipe } from '../core/pipe/shorten-address.pipe';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';
import { PriceService } from '../core/service/price.service';
import { WalletService } from '../core/service/wallet.service';
import { ConnectedWallet } from '../core/types/connected-wallet';
import { order_by } from '../core/types/zeus';
import { DashboardPage } from '../dashboard/dashboard.page';
import { GenericPreviewPage } from '../generic-preview/generic-preview.page';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.page.html',
  styleUrls: ['./wallet.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    DateAgoPipe,
    HumanTypePipe,
    DecimalPipe,
    HumanSupplyPipe,
    TokenDecimalsPipe,
    RouterLink,
    DashboardPage,
    NgScrollbarModule,
    TableModule,
    ShortenAddressPipe,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonBackButton,
    IonTitle,
    IonProgressBar,
    IonButton,
    IonAvatar,
    IonChip,
    IonIcon,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    LottieComponent,
    GenericPreviewPage,
    ShortenAddressHiddenPipe,
  ],
})
export class WalletPage implements OnInit {
  selectedSection: string = 'tokens';
  isLoading = true;
  selectedAddress: string = '';
  tokens: any = null;
  holdings: any = null;
  inscriptions: any = null;
  listedInscriptions: any = null;
  isWalletConnected = false;
  connectedAccount: any;
  baseTokenPrice: number = 0;

  constructor(
    private activatedRoute: ActivatedRoute,
    private walletService: WalletService,
    private priceService: PriceService,
  ) {}

  async ngOnInit() {
    const walletDataJSON = localStorage.getItem(
      environment.storage.connectedWalletKey,
    );
    if (walletDataJSON) {
      const walletData: ConnectedWallet = JSON.parse(walletDataJSON);
      try {
        const account = await this.walletService.getAccount();
        if (account) {
          this.isWalletConnected = true;
          this.connectedAccount = account;
        }
      } catch (e) {
        // Wallet connection rejected
        localStorage.clear();
        this.isWalletConnected = false;
        this.selectedAddress = '';
      }
    }

    this.activatedRoute.params.subscribe(async (params) => {
      this.selectedAddress =
        params['address'] || this.connectedAccount?.address;
      this.selectedSection =
        this.activatedRoute.snapshot.queryParams['section'] || 'tokens';

      this.isLoading = true;

      try {
        this.baseTokenPrice = await this.priceService.fetchBaseTokenUSDPrice();

        const chain = Chain(environment.api.endpoint);

        const tokensResult = await chain('query')({
          token: [
            {
              offset: 0,
              limit: 500,
              order_by: [
                {
                  date_created: order_by.desc,
                },
              ],
              where: {
                current_owner: {
                  _eq: this.selectedAddress,
                },
              },
            },
            {
              id: true,
              transaction: {
                hash: true,
              },
              current_owner: true,
              content_path: true,
              name: true,
              ticker: true,
              max_supply: true,
              decimals: true,
              launch_timestamp: true,
              last_price_base: true,
              date_created: true,
            },
          ],
        });
        this.tokens = tokensResult.token;

        const holderResult = await chain('query')({
          token_holder: [
            {
              offset: 0,
              limit: 500,
              where: {
                address: {
                  _eq: this.selectedAddress,
                },
              },
            },
            {
              token: {
                ticker: true,
                content_path: true,
                max_supply: true,
                circulating_supply: true,
                decimals: true,
                last_price_base: true,
                transaction: {
                  hash: true,
                },
              },
              amount: true,
              date_updated: true,
            },
          ],
        });

        this.holdings = holderResult.token_holder;

        const result = await chain('query')({
          inscription: [
            {
              offset: 0,
              limit: 500,
              order_by: [
                {
                  date_created: order_by.desc,
                },
              ],
              where: {
                current_owner: {
                  _eq: this.selectedAddress,
                },
              },
            },
            {
              id: true,
              transaction: {
                hash: true,
              },
              // transaction_hash: true,
              current_owner: true,
              content_path: true,
              content_size_bytes: true,
              date_created: true,
              __alias: {
                name: {
                  metadata: [
                    {
                      path: '$.metadata.name',
                    },
                    true,
                  ],
                },
                description: {
                  metadata: [
                    {
                      path: '$.metadata.description',
                    },
                    true,
                  ],
                },
                mime: {
                  metadata: [
                    {
                      path: '$.metadata.mime',
                    },
                    true,
                  ],
                },
              },
            },
          ],
        });

        this.inscriptions = result.inscription;

        const listedResult = await chain('query')({
          marketplace_inscription_detail: [
            {
              where: {
                marketplace_listing: {
                  seller_address: {
                    _eq: this.selectedAddress,
                  },
                  is_cancelled: {
                    _eq: false,
                  },
                  is_filled: {
                    _eq: false,
                  },
                },
              },
              limit: 50, // TODO: Move
              order_by: [
                {
                  id: order_by.asc,
                },
              ],
            },
            {
              id: true,
              marketplace_listing: {
                seller_address: true,
                total: true,
                depositor_address: true,
                is_deposited: true,
                depositor_timedout_block: true,
                deposit_total: true,
                transaction: {
                  hash: true,
                },
              },
              inscription: {
                id: true,
                transaction: {
                  hash: true,
                },
                // transaction_hash: true,
                current_owner: true,
                content_path: true,
                content_size_bytes: true,
                date_created: true,
                __alias: {
                  name: {
                    metadata: [
                      {
                        path: '$.metadata.name',
                      },
                      true,
                    ],
                  },
                  description: {
                    metadata: [
                      {
                        path: '$.metadata.description',
                      },
                      true,
                    ],
                  },
                  mime: {
                    metadata: [
                      {
                        path: '$.metadata.mime',
                      },
                      true,
                    ],
                  },
                },
              },
              date_created: true,
            },
          ],
        });

        this.listedInscriptions = listedResult.marketplace_inscription_detail;
      } catch (e) {
        console.log(e);
      }

      this.isLoading = false;
    });
  }

  sectionChanged($event: any) {
    this.selectedSection = $event.detail.value;
  }
}
