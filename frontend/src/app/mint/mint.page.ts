import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IonButton, IonHeader, IonToolbar, } from '@ionic/angular/standalone';
import { Chain } from '../core/types/zeus';
import { environment } from 'src/environments/environment';
import { CommonModule, DatePipe } from '@angular/common';
import { ShortenAddressPipe } from '../core/pipe/shorten-address.pipe';
import { HumanSupplyPipe } from '../core/pipe/human-supply.pipe';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';
import { CFT20Service } from '../core/metaprotocol/cft20.service';
import { IonicModule, ModalController } from '@ionic/angular';
import { TransactionFlowModalPage } from '../transaction-flow-modal/transaction-flow-modal.page';

@Component({
  selector: 'app-mint',
  templateUrl: 'mint.page.html',
  styleUrls: ['mint.page.scss'],
  standalone: true,
  imports: [IonicModule, RouterModule, CommonModule, ShortenAddressPipe, DatePipe, HumanSupplyPipe, TokenDecimalsPipe],
})
export class MintPage {
  isLoading = false;
  token: any;
  tokenLaunchDate: Date;
  tokenIsLaunched: boolean = false;

  constructor(private activatedRoute: ActivatedRoute, private protocolService: CFT20Service, private modalCtrl: ModalController) {
    this.tokenLaunchDate = new Date();
  }

  async ngOnInit() {
    this.isLoading = true;
    const chain = Chain(environment.api.endpoint)

    const result = await chain('query')({
      token: [
        {
          where: {
            ticker: {
              _eq: this.activatedRoute.snapshot.params["ticker"].toUpperCase() // Always stored in uppercase
            }
          }
        }, {
          id: true,
          height: true,
          transaction_hash: true,
          creator: true,
          current_owner: true,
          name: true,
          ticker: true,
          decimals: true,
          max_supply: true,
          per_wallet_limit: true,
          launch_timestamp: true,
          content_path: true,
          content_size_bytes: true,
          date_created: true,
        }
      ]
    });

    this.token = result.token[0];
    this.tokenLaunchDate = new Date(this.token.launch_timestamp * 1000);
    if (this.tokenLaunchDate.getTime() < Date.now()) {
      this.tokenIsLaunched = true;
    }
    this.isLoading = false;
  }

  async mint() {
    console.log("MINT", this.token.per_wallet_limit, this.token.ticker);

    // Construct metaprotocol memo message
    const params = new Map([
      ["tic", this.token.ticker],
      ["amt", this.token.per_wallet_limit],
    ]);
    const urn = this.protocolService.buildURN('cosmoshub-4', 'mint', params);
    const modal = await this.modalCtrl.create({
      component: TransactionFlowModalPage,
      componentProps: {
        urn,
        metadata: null,
        data: null,
      }
    });
    modal.present();
  }
}
