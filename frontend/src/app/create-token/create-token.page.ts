import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-create-token',
  templateUrl: './create-token.page.html',
  styleUrls: ['./create-token.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule, RouterLink]
})
export class CreateTokenPage implements OnInit {

  // Hold the form for persistance
  createForm: FormGroup;

  constructor(private builder: FormBuilder) {
    this.createForm = this.builder.group({
      basic: this.builder.group({
        name: "",
        description: "",
      }),
    });
  }

  ngOnInit() {
  }

}
