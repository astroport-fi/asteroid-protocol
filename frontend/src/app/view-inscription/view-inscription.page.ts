import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { Chain } from '../core/types/zeus';


@Component({
  selector: 'app-view-inscription',
  templateUrl: './view-inscription.page.html',
  styleUrls: ['./view-inscription.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ViewInscriptionPage implements OnInit {
  isLoading = false;
  inscription: any;

  constructor(private activatedRoute: ActivatedRoute) {

  }

  async ngOnInit() {
    console.log("WE GOT", this.activatedRoute.snapshot.params["txhash"]);
    this.isLoading = true;

    const chain = Chain(environment.api.endpoint)

    const result = await chain('query')({
      inscription: [
        {
          where: {
            transaction_hash: {
              _eq: this.activatedRoute.snapshot.params["txhash"]
            }
          }
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

    this.inscription = result.inscription[0];
    this.isLoading = false;
  }

}
