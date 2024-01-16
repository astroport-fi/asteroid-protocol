import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from 'src/environments/environment';
import { Chain, Subscription, order_by } from '../core/types/zeus';
import { ShortenAddressPipe } from '../core/pipe/shorten-address.pipe';
import { GenericPreviewPage } from '../generic-preview/generic-preview.page';
import { WalletService } from '../core/service/wallet.service';
import { TransferInscriptionModalPage } from '../transfer-inscription-modal/transfer-inscription-modal.page';
import { TableModule } from 'primeng/table';


@Component({
  selector: 'app-view-inscription',
  templateUrl: './view-inscription.page.html',
  styleUrls: ['./view-inscription.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ShortenAddressPipe, RouterLink, DatePipe, GenericPreviewPage, TableModule]
})
export class ViewInscriptionPage implements OnInit {
  isLoading = false;
  inscription: any;
  inscriptionHistory: any;
  explorerTxUrl: string = environment.api.explorer;
  walletConnected: boolean = false;
  currentAddress: string = "";

  constructor(private activatedRoute: ActivatedRoute, private walletService: WalletService, private modalCtrl: ModalController) {
  }

  async ngOnInit() {
    this.isLoading = true;

    this.walletConnected = await this.walletService.isConnected();
    if (this.walletConnected) {
      this.currentAddress = (await this.walletService.getAccount()).address;
    }

    const chain = Chain(environment.api.endpoint)

    const result = await chain('query')({
      inscription: [
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
          height: true,
          transaction: {
            hash: true
          },
          creator: true,
          current_owner: true,
          content_path: true,
          content_size_bytes: true,
          date_created: true,
          __alias: {
            name: {
              metadata: [{
                path: '$.metadata.name'
              },
                true
              ]
            },
            description: {
              metadata: [{
                path: '$.metadata.description'
              },
                true
              ]
            },
            mime: {
              metadata: [{
                path: '$.metadata.mime'
              },
                true
              ]
            }
          }
        }
      ]
    });
    this.inscription = result.inscription[0];

    const resultHistory = await chain('query')({
      inscription_history: [
        {
          where: {
            inscription: {
              id: {
                _eq: this.inscription.id
              }
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
          transaction: {
            hash: true,
          },
          sender: true,
          receiver: true,
          action: true,
          date_created: true,
        }
      ]
    });
    this.inscriptionHistory = resultHistory.inscription_history;

    const wsChain = Subscription(environment.api.wss);
    wsChain('subscription')({
      inscription: [
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
          height: true,
          transaction: {
            hash: true
          },
          creator: true,
          current_owner: true,
          content_path: true,
          content_size_bytes: true,
          date_created: true,
          __alias: {
            name: {
              metadata: [{
                path: '$.metadata.name'
              },
                true
              ]
            },
            description: {
              metadata: [{
                path: '$.metadata.description'
              },
                true
              ]
            },
            mime: {
              metadata: [{
                path: '$.metadata.mime'
              },
                true
              ]
            }
          }
        }
      ]
    }).on(({ inscription }) => {
      this.inscription = inscription[0];
    });

    this.isLoading = false;
  }

  async transfer() {
    const modal = await this.modalCtrl.create({
      keyboardClose: true,
      backdropDismiss: true,
      component: TransferInscriptionModalPage,

      componentProps: {
        hash: this.inscription.transaction.hash
      }
    });
    modal.present();
  }

}
