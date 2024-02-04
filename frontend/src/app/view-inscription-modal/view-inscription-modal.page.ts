import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonicModule, ModalController } from '@ionic/angular';
import { TableModule } from 'primeng/table';
import { environment } from 'src/environments/environment';
import { ShortenAddressPipe } from '../core/pipe/shorten-address.pipe';
import { WalletService } from '../core/service/wallet.service';
import { Chain, order_by } from '../core/types/zeus';
import { GenericPreviewPage } from '../generic-preview/generic-preview.page';
import { TransferInscriptionModalPage } from '../transfer-inscription-modal/transfer-inscription-modal.page';
import { SellInscriptionModalPage } from '../sell-inscription-modal/sell-inscription-modal.page';
import { WalletRequiredModalPage } from '../wallet-required-modal/wallet-required-modal.page';
import { InscriptionService } from '../core/metaprotocol/inscription.service';
import { TransactionFlowModalPage } from '../transaction-flow-modal/transaction-flow-modal.page';
import { MarketplaceService } from '../core/metaprotocol/marketplace.service';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';
import { BuyWizardModalPage } from '../buy-wizard-modal/buy-wizard-modal.page';

@Component({
  selector: 'app-view-inscription-modal',
  templateUrl: './view-inscription-modal.page.html',
  styleUrls: ['./view-inscription-modal.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ShortenAddressPipe,
    RouterLink,
    DatePipe,
    GenericPreviewPage,
    TableModule,
    TokenDecimalsPipe
  ],
})
export class ViewInscriptionModalPage implements OnInit {

  @Input() hash: string = '';
  @Input() listingHash: string = '';

  isLoading = false;
  inscription: any;
  explorerTxUrl: string = environment.api.explorer;
  walletConnected: boolean = false;
  currentAddress: string = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private walletService: WalletService,
    private modalCtrl: ModalController,
    private titleService: Title,
    private meta: Meta,
    private protocolService: MarketplaceService
  ) { }

  async ngOnInit() {
    this.isLoading = true;

    this.walletConnected = await this.walletService.isConnected();
    if (this.walletConnected) {
      this.currentAddress = (await this.walletService.getAccount()).address;
    }

    const chain = Chain(environment.api.endpoint);

    const result = await chain('query')({
      inscription: [
        {
          where: {
            transaction: {
              hash: {
                _eq: this.hash,
              },
            },
            // TODO: We need to filter based on marketplace_listing status
          },
        },
        {
          id: true,
          height: true,
          transaction: {
            hash: true,
          },
          creator: true,
          current_owner: true,
          content_path: true,
          content_size_bytes: true,
          is_explicit: true,
          date_created: true,
          marketplace_inscription_details: [{
            where: {
              marketplace_listing: {
                is_cancelled: {
                  _eq: false,
                },
                is_filled: {
                  _eq: false,
                },
              },
            },
          }, {
            id: true,
            marketplace_listing: {
              seller_address: true,
              total: true,
              transaction: {
                hash: true
              }
            },
          }],
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

    this.inscription = result.inscription[0];
    console.log(this.inscription);
    this.isLoading = false;
  }

  dismiss() {
    this.modalCtrl.dismiss({
      dismissed: true,
    });
  }

  async buy() {
    const modal = await this.modalCtrl.create({
      // keyboardClose: true,
      // backdropDismiss: false,
      component: BuyWizardModalPage,
      componentProps: {
        hash: this.listingHash,
        metaprotocol: 'marketplace',
        metaprotocolAction: 'deposit',
      }
    });
    modal.present();
  }

  async delist() {
    if (!this.walletService.hasWallet()) {
      // Popup explaining that Keplr is needed and needs to be installed first
      const modal = await this.modalCtrl.create({
        keyboardClose: true,
        backdropDismiss: true,
        component: WalletRequiredModalPage,
        cssClass: 'wallet-required-modal',
      });
      modal.present();
      return;
    }

    const listingHash = this.inscription.marketplace_inscription_details[0].marketplace_listing.transaction.hash;

    // Construct metaprotocol memo message
    const params = new Map([
      ["h", listingHash],
    ]);
    const urn = this.protocolService.buildURN(environment.chain.chainId, 'delist', params);
    const modal = await this.modalCtrl.create({
      keyboardClose: true,
      backdropDismiss: false,
      component: TransactionFlowModalPage,
      componentProps: {
        urn,
        metadata: null,
        data: null,
        routerLink: ['/app/inscription/', this.inscription.transaction.hash],
        resultCTA: 'View transaction',
        metaprotocol: 'marketplace',
        metaprotocolAction: 'delist',
      }
    });
    modal.present();

  }

}
