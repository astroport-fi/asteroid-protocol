import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
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
} from '@ionic/angular/standalone';
import { LottieComponent } from 'ngx-lottie';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { TableModule } from 'primeng/table';
import { environment } from 'src/environments/environment';
import { DateAgoPipe } from '../core/pipe/date-ago.pipe';
import { HumanSupplyPipe } from '../core/pipe/human-supply.pipe';
import { HumanTypePipe } from '../core/pipe/human-type.pipe';
import { ShortenAddressHiddenPipe } from '../core/pipe/shorten-address-hidden.pipe';
import { ShortenAddressPipe } from '../core/pipe/shorten-address.pipe';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';
import {
  AsteroidService,
  Collection,
  Inscription,
  Token,
  TokenHolding,
} from '../core/service/asteroid.service';
import { PriceService } from '../core/service/price.service';
import { WalletService } from '../core/service/wallet.service';
import { ConnectedWallet } from '../core/types/connected-wallet';
import { DashboardPage } from '../dashboard/dashboard.page';
import { TableRowDirective } from '../directives/table-row.directive';
import { GenericPreviewPage } from '../generic-preview/generic-preview.page';
import { WalletEmptyComponent } from '../wallet-empty/wallet-empty.component';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrl: './wallet.component.scss',
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
    TableRowDirective,
    WalletEmptyComponent,
  ],
})
export class WalletPage implements OnInit {
  selectedSection: string = 'tokens';
  isLoading = true;
  selectedAddress: string = '';
  tokens: Token[] | null = null;
  holdings: TokenHolding[] | null = null;
  inscriptions: Inscription[] | null = null;
  collections: Collection[] | null = null;
  isWalletConnected = false;
  connectedAccount: any;
  baseTokenPrice: number = 0;

  constructor(
    private activatedRoute: ActivatedRoute,
    private walletService: WalletService,
    private priceService: PriceService,
    private asteroidService: AsteroidService,
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

        this.tokens = await this.asteroidService.getTokens(0, 500, {
          currentOwner: this.selectedAddress,
        });

        this.holdings = await this.asteroidService.getTokenHoldings(
          this.selectedAddress,
        );

        this.inscriptions = await this.asteroidService.getInscriptions(0, 500, {
          currentOwner: this.selectedAddress,
        });

        this.collections = await this.asteroidService.getCollections(0, 500, {
          creator: this.selectedAddress,
        });
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
