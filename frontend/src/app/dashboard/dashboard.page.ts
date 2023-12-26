import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Chain, Gql } from '../core/types/zeus';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class DashboardPage implements OnInit {

  constructor() {

  }

  async ngOnInit() {
    const chain = Chain(environment.api.endpoint)

    const result = await chain('query')({
      transaction: [
        {}, {
          id: true,
          hash: true,
        }
      ]
    });

    for (const tx of result.transaction) {
      console.log(tx.id, tx.hash);
    }

  }

}
