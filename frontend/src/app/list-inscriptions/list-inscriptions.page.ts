import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InfiniteScrollCustomEvent, IonicModule } from '@ionic/angular';
import { Chain, order_by } from '../core/types/zeus';
import { environment } from 'src/environments/environment';
import { DateAgoPipe } from '../core/pipe/date-ago.pipe';
import { HumanTypePipe } from '../core/pipe/human-type.pipe';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ShortenAddressPipe } from '../core/pipe/shorten-address.pipe';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { GenericPreviewPage } from '../generic-preview/generic-preview.page';


@Component({
  selector: 'app-list-inscriptions',
  templateUrl: './list-inscriptions.page.html',
  styleUrls: ['./list-inscriptions.page.scss'],
  standalone: true,
  // providers: [IonNav],
  imports: [IonicModule, CommonModule, FormsModule, DateAgoPipe, HumanTypePipe, DecimalPipe, RouterLink, ShortenAddressPipe, NgScrollbarModule, GenericPreviewPage]
})
export class ListInscriptionsPage implements OnInit {

  isLoading = true;
  selectedAddress: string = '';
  inscriptions: any = null;
  offset = 0;
  limit = 50;
  lastFetchCount = 0;
  chain;
  order: order_by = order_by.desc;

  constructor(private activatedRoute: ActivatedRoute) {
    this.lastFetchCount = this.limit;
    this.chain = Chain(environment.api.endpoint)
  }

  async ngOnInit() {
    this.activatedRoute.params.subscribe(async params => {
      this.selectedAddress = params["address"];
      this.isLoading = true;

      const result = await this.fetchInscriptions()

      this.inscriptions = result.inscription;
      this.isLoading = false;
    });
  }

  async onIonInfinite(event: Event) {
    if (this.lastFetchCount < this.limit) {
      // (event as InfiniteScrollCustomEvent).target.disabled = true;
      await (event as InfiniteScrollCustomEvent).target.complete();
      return;
    }

    this.offset += this.limit;

    const result = await this.fetchInscriptions()

    this.inscriptions.push(...result.inscription);
    this.lastFetchCount = result.inscription.length;
    await (event as InfiniteScrollCustomEvent).target.complete();
  }


  async onChangeOrder() {
    this.offset = 0;
    const result = await this.fetchInscriptions()
    this.inscriptions = result.inscription;
  }

  async onChangeSearch(string?: string | null) {
    if (string && !isNaN(+string)) {
      const result = await this.fetchInscriptions(+string + 1)
      this.inscriptions = result.inscription
    }
  }

  async fetchInscriptions(id?: number) {

    return this.chain('query')({
      inscription: [
        {
          offset: id ? 0 : this.offset,
          limit: id ? 1 : this.limit,
          order_by: [
            {
              date_created: this.order
            }
          ],
          where: {
            ...(id ? { id: { _eq: id } } : {}),
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
          is_explicit: true,
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
  }


}
