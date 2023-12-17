import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';


@Component({
  selector: 'app-view-inscription',
  templateUrl: './view-inscription.page.html',
  styleUrls: ['./view-inscription.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ViewInscriptionPage implements OnInit {
  isLoading = false;

  constructor(private activatedRoute: ActivatedRoute) {
    console.log("WE GOT", activatedRoute.snapshot.params["txhash"]);
    this.isLoading = true;
  }

  ngOnInit() {
  }

}
