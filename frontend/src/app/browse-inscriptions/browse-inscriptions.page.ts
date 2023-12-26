import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Chain, order_by } from '../core/types/zeus';
import { environment } from 'src/environments/environment';
import { DateAgoPipe } from '../core/pipe/date-ago.pipe';
import { HumanTypePipe } from '../core/pipe/human-type.pipe';

@Component({
  selector: 'app-browse-inscriptions',
  templateUrl: './browse-inscriptions.page.html',
  styleUrls: ['./browse-inscriptions.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, DateAgoPipe, HumanTypePipe, DecimalPipe]
})
export class BrowseInscriptionsPage implements OnInit {

  isLoading = true;
  inscriptions: any = null;

  constructor() {
  }

  async ngOnInit() {
    const chain = Chain(environment.api.endpoint)

    const result = await chain('query')({
      inscription: [
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

    this.inscriptions = result.inscription;
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
