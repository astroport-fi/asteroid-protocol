import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-create-alter-ego',
  templateUrl: './create-alter-ego.page.html',
  styleUrls: ['./create-alter-ego.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule, RouterLink]
})
export class CreateAlterEgoPage implements OnInit {
  createForm: FormGroup;

  constructor(private builder: FormBuilder) {
    this.createForm = this.builder.group({
      basic: this.builder.group({
        name: "",
        bio: "",
        link: "",
        imageUpload: null
      }),
    });
  }

  ngOnInit() {
  }

}
