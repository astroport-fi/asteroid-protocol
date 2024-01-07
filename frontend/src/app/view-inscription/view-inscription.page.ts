import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from 'src/environments/environment';
import { Chain } from '../core/types/zeus';
import { ShortenAddressPipe } from '../core/pipe/shorten-address.pipe';


@Component({
  selector: 'app-view-inscription',
  templateUrl: './view-inscription.page.html',
  styleUrls: ['./view-inscription.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ShortenAddressPipe, RouterLink, DatePipe]
})
export class ViewInscriptionPage implements OnInit {
  isLoading = false;
  inscription: any;
  explorerTxUrl: string = environment.api.explorer;

  constructor(private activatedRoute: ActivatedRoute) {

  }

  async ngOnInit() {
    this.isLoading = true;

    console.log(this.activatedRoute.snapshot.params["txhash"]);
    console.log(parseInt(this.activatedRoute.snapshot.params["txhash"]) - 1)
    const chain = Chain(environment.api.endpoint)

    const result = await chain('query')({
      inscription: [
        {
          where: {
            _or: [
              {
                transaction: {
                  hash: {
                    _eq: this.activatedRoute.snapshot.params["txhash"]
                  }
                }
              },
              {
                id: {
                  _eq: parseInt(this.activatedRoute.snapshot.params["txhash"]) + 1 // Inscriptions are numbered from 0, searching for 28 should show db id 29
                }
              }
            ]
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
    this.isLoading = false;
  }

}
