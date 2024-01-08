import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InfiniteScrollCustomEvent, IonicModule, IonNav, IonNavLink } from '@ionic/angular';
import { Chain, order_by } from '../core/types/zeus';
import { environment } from 'src/environments/environment';
import { DateAgoPipe } from '../core/pipe/date-ago.pipe';
import { HumanTypePipe } from '../core/pipe/human-type.pipe';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ViewInscriptionPage } from '../view-inscription/view-inscription.page';
import { ShortenAddressPipe } from '../core/pipe/shorten-address.pipe';
import { NgScrollbarModule } from 'ngx-scrollbar';


@Component({
  selector: 'app-list-inscriptions',
  templateUrl: './list-inscriptions.page.html',
  styleUrls: ['./list-inscriptions.page.scss'],
  standalone: true,
  // providers: [IonNav],
  imports: [IonicModule, CommonModule, FormsModule, DateAgoPipe, HumanTypePipe, DecimalPipe, RouterLink, ShortenAddressPipe, NgScrollbarModule]
})
export class ListInscriptionsPage implements OnInit {

  isLoading = true;
  selectedAddress: string = '';
  inscriptions: any = null;
  offset = 0;
  limit = 50;
  lastFetchCount = 0;

  constructor(private activatedRoute: ActivatedRoute) {
    this.lastFetchCount = this.limit;
  }

  async ngOnInit() {
    this.activatedRoute.params.subscribe(async params => {
      this.selectedAddress = params["address"];
      this.isLoading = true;
      const chain = Chain(environment.api.endpoint)

      const result = await chain('query')({
        inscription: [
          {
            offset: this.offset,
            limit: this.limit,
            order_by: [
              {
                date_created: order_by.desc
              }
            ],
            where: {
              current_owner: {
                _eq: this.selectedAddress
              }
            }
          }, {
            id: true,
            transaction: {
              hash: true
            },
            // transaction_hash: true,
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
    });




  }

  async onIonInfinite(event: Event) {
    if (this.lastFetchCount < this.limit) {
      // (event as InfiniteScrollCustomEvent).target.disabled = true;
      (event as InfiniteScrollCustomEvent).target.complete();
      return;
    }

    this.offset += this.limit;
    const chain = Chain(environment.api.endpoint)

    const result = await chain('query')({
      inscription: [
        {
          offset: this.offset,
          limit: this.limit,
          order_by: [
            {
              date_created: order_by.desc
            }
          ],
          where: {
            current_owner: {
              _eq: this.selectedAddress
            }
          }
        }, {
          id: true,
          transaction: {
            hash: true
          },
          // transaction_hash: true,
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

    this.inscriptions.push(...result.inscription);
    this.lastFetchCount = result.inscription.length;
    (event as InfiniteScrollCustomEvent).target.complete();
  }

}
