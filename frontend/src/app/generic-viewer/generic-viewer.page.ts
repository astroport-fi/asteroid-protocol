import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HumanTypePipe } from '../core/pipe/human-type.pipe';

@Component({
  selector: 'app-generic-viewer',
  templateUrl: './generic-viewer.page.html',
  styleUrls: ['./generic-viewer.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HumanTypePipe]
})
export class GenericViewerPage implements OnInit {


  @Input() mime: string = 'text/plain';
  @Input() contentPath: string = '';

  humanType: string = '';

  constructor() {
  }

  ngOnInit() {
    this.humanType = HumanTypePipe.prototype.transform(this.mime);
  }


}
