import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonicModule, ModalController } from '@ionic/angular';
import { TableModule } from 'primeng/table';
import { environment } from 'src/environments/environment';
import { ShortenAddressPipe } from '../core/pipe/shorten-address.pipe';
import { WalletService } from '../core/service/wallet.service';
import { Chain } from '../core/helpers/zeus';
import { order_by } from '../core/types/zeus';
import { GenericPreviewPage } from '../generic-preview/generic-preview.page';
import { TransferInscriptionModalPage } from '../transfer-inscription-modal/transfer-inscription-modal.page';
import { SellInscriptionModalPage } from '../sell-inscription-modal/sell-inscription-modal.page';
import { WalletRequiredModalPage } from '../wallet-required-modal/wallet-required-modal.page';
import { InscriptionService } from '../core/metaprotocol/inscription.service';
import { TransactionFlowModalPage } from '../transaction-flow-modal/transaction-flow-modal.page';
import { MarketplaceService } from '../core/metaprotocol/marketplace.service';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';

@Component({
  selector: 'app-view-inscription',
  templateUrl: './view-inscription.page.html',
  styleUrls: ['./view-inscription.page.scss'],
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
export class ViewInscriptionPage implements OnInit {
  isLoading = false;
  inscription: any;
  inscriptionHistory: any;
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
                _eq: this.activatedRoute.snapshot.params['txhash'],
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
              transaction: {
                hash: true,
              },
              total: true,
              is_cancelled: true,
              is_filled: true,
              seller_address: true,
            }
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

    const { name, description, content_path, id, transaction } =
      this.inscription;

    this.titleService.setTitle(
      `${name} Inscription #${id} on Asteroid Protocol` as string
    );
    this.meta.updateTag({
      property: 'og:url',
      content: `https://asteroidprotocol.io/app/inscription/${transaction.hash}`,
    });
    this.meta.updateTag({
      property: 'og:title',
      content: `${name} Inscription #${id} on Asteroid Protocol`,
    });
    this.meta.updateTag({
      property: 'og:image',
      content: content_path,
    });
    this.meta.updateTag({
      property: 'og:description',
      content: description,
    });
    this.meta.updateTag({
      name: 'description',
      content: description,
    });
    this.meta.updateTag({
      property: 'twitter:url',
      content: `https://asteroidprotocol.io/app/inscription/${transaction.hash}`,
    });
    this.meta.updateTag({
      property: 'twitter:title',
      content: `${name} Inscription #${id} on Asteroid Protocol`,
    });
    this.meta.updateTag({
      property: 'twitter:image',
      content: content_path,
    });
    this.meta.updateTag({
      property: 'twitter:description',
      content: description,
    });
    this.meta.updateTag({
      property: 'twitter:card',
      content: 'summary',
    });

    const resultHistory = await chain('query')({
      inscription_history: [
        {
          where: {
            inscription: {
              id: {
                _eq: this.inscription.id,
              },
            },
          },
          order_by: [
            {
              height: order_by.desc,
            },
          ],
        },
        {
          id: true,
          height: true,
          transaction: {
            hash: true,
          },
          sender: true,
          receiver: true,
          action: true,
          date_created: true,
        },
      ],
    });
    this.inscriptionHistory = resultHistory.inscription_history;

    this.isLoading = false;
  }

  async transfer() {
    const modal = await this.modalCtrl.create({
      keyboardClose: true,
      backdropDismiss: true,
      component: TransferInscriptionModalPage,

      componentProps: {
        hash: this.inscription.transaction.hash,
      },
    });
    modal.present();
  }

  async listSale() {
    const modal = await this.modalCtrl.create({
      keyboardClose: true,
      backdropDismiss: true,
      component: SellInscriptionModalPage,

      componentProps: {
        name: this.inscription.name,
        hash: this.inscription.transaction.hash,
      },
    });
    modal.present();
  }

  async cancel() {
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
