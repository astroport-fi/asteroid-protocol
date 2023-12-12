import { Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { IonApp, IonRouterOutlet, IonContent, IonSplitPane, IonMenu, IonHeader, IonToolbar, IonTitle } from '@ionic/angular/standalone';
import { HomePage } from './home/home.page';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {

  }
}
