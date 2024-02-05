import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { order_by } from '@asteroid-protocol/sdk';
import { InfiniteScrollCustomEvent, IonicModule } from '@ionic/angular';
import { DateAgoPipe } from '../core/pipe/date-ago.pipe';
import {
  AsteroidService,
  Collection,
  Inscription,
} from '../core/service/asteroid.service';
import { GenericPreviewPage } from '../generic-preview/generic-preview.page';

@Component({
  selector: 'app-view-collection',
  templateUrl: './view-collection.component.html',
  styleUrl: './view-collection.component.scss',
  standalone: true,
  imports: [IonicModule, GenericPreviewPage, RouterModule, DateAgoPipe],
})
export class ViewCollectionPage implements OnInit {
  inscriptions: Inscription[] = [];
  collection: Collection | undefined;
  isLoading = true;
  offset = 0;
  limit = 50;
  lastFetchCount = this.limit;

  constructor(
    private asteroidService: AsteroidService,
    private activatedRoute: ActivatedRoute,
  ) {}

  async ngOnInit() {
    const symbol = this.activatedRoute.snapshot.params['symbol'];
    if (!symbol) {
      // @todo error message
      return;
    }

    this.collection = await this.asteroidService.getCollection(symbol);

    if (!this.collection) {
      // @todo error message
      return;
    }

    this.inscriptions = await this.fetchInscriptions();
    this.isLoading = false;
  }

  async fetchInscriptions() {
    return this.asteroidService.getInscriptions(
      this.offset,
      this.limit,
      {
        collectionId: this.collection!.id,
      },
      {
        id: order_by.asc,
      },
    );
  }

  async onIonInfinite(event: InfiniteScrollCustomEvent) {
    if (this.lastFetchCount < this.limit) {
      await event.target.complete();
      return;
    }
    this.offset += this.limit;
    const inscriptions = await this.fetchInscriptions();
    this.inscriptions.push(...inscriptions);
    this.lastFetchCount = inscriptions.length;
    await event.target.complete();
  }
}
