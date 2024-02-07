import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-percentage-change',
  templateUrl: './percentage-change.component.html',
  styleUrl: './percentage-change.component.scss',
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class PercentageChangeComponent implements OnInit, OnChanges {
  @Input() value!: number;
  @Input() baseValue!: number;
  @Input() title = '';
  change!: number;

  ngOnInit() {
    this.calculateChange();
  }

  calculateChange() {
    this.change =
      Math.round(((this.value - this.baseValue) / this.baseValue) * 1e4) / 1e4;
  }

  getColor() {
    if (this.change < 0.02) {
      return 'success';
    } else if (this.change < 0.05) {
      return 'warning';
    } else {
      return 'danger';
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('baseValue' in changes) {
      this.baseValue = changes['baseValue'].currentValue;
    }

    if ('value' in changes) {
      this.value = changes['value'].currentValue;
    }

    this.calculateChange();
  }
}
