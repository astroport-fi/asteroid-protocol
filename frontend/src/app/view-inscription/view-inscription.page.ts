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
import { Chain, order_by } from '../core/types/zeus';
import { GenericPreviewPage } from '../generic-preview/generic-preview.page';
import { TransferInscriptionModalPage } from '../transfer-inscription-modal/transfer-inscription-modal.page';

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
    private meta: Meta
  ) {}

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
}
