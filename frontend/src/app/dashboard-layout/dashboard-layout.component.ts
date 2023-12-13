import { Component } from '@angular/core';
import {
  RouterLink,
  RouterLinkActive
} from '@angular/router';
import {
  IonApp,
  IonRouterOutlet,
  IonContent,
  IonSplitPane,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
  IonItem,
  IonLabel,
  IonListHeader,
  IonIcon,
  IonChip,
  IonButton
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

import { chevronForward, keySharp, pencilSharp, createSharp } from "ionicons/icons";
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-dashboard-layout',
  templateUrl: 'dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonApp,
    IonContent,
    IonSplitPane,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonRouterOutlet,
    IonList,
    IonItem,
    IonLabel,
    IonListHeader,
    IonIcon,
    IonChip,
    IonButton,
    RouterLink,
    RouterLinkActive,
  ],
})
export class DashboardLayoutComponent {
  constructor() {
    addIcons({ chevronForward, keySharp, pencilSharp, createSharp });
  }
}
