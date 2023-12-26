import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Chain, order_by } from '../core/types/zeus';
import { environment } from 'src/environments/environment';
import { DateAgoPipe } from '../core/pipe/date-ago.pipe';
import { HumanTypePipe } from '../core/pipe/human-type.pipe';
import { HumanSupplyPipe } from '../core/pipe/human-supply.pipe';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';

@Component({
  selector: 'app-browse-tokens',
  templateUrl: './browse-tokens.page.html',
  styleUrls: ['./browse-tokens.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, DateAgoPipe, HumanTypePipe, DecimalPipe, HumanSupplyPipe, TokenDecimalsPipe]
})
export class BrowseTokensPage implements OnInit {

  isLoading = true;
  tokens: any = null;

  constructor() {
  }

  async ngOnInit() {
    const chain = Chain(environment.api.endpoint);

    const result = await chain('query')({
      token: [
        {
          offset: 0,
          limit: 10,
          order_by: [
            {
              date_created: order_by.desc
            }
          ]
        }, {
          id: true,
          transaction_hash: true,
          current_owner: true,
          content_path: true,
          name: true,
          ticker: true,
          max_supply: true,
          decimals: true,
          launch_timestamp: true,
          date_created: true
        }
      ]
    });

    // const result = await chain('query')({
    //   inscription: [
    //     {
    //       offset: 0,
    //       limit: 10,
    //       order_by: [
    //         {
    //           date_created: order_by.desc
    //         }
    //       ]
    //     }, {
    //       id: true,
    //       transaction_hash: true,
    //       current_owner: true,
    //       content_path: true,
    //       content_size_bytes: true,
    //       date_created: true,
    //       __alias: {
    //         name: {
    //           metadata: [{
    //             path: '$.metadata.name'
    //           },
    //             true
    //           ]
    //         },
    //         description: {
    //           metadata: [{
    //             path: '$.metadata.description'
    //           },
    //             true
    //           ]
    //         },
    //         mime: {
    //           metadata: [{
    //             path: '$.metadata.mime'
    //           },
    //             true
    //           ]
    //         }
    //       }
    //     }
    //   ]
    // });

    this.tokens = result.token;
    this.isLoading = false;

  }

  onIonInfinite(event: Event) {
    console.log("LOAD MORE");
    // this.generateItems();
    // setTimeout(() => {
    //   (ev as InfiniteScrollCustomEvent).target.complete();
    // }, 500);
  }

}
