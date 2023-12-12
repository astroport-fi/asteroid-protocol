import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PageService {
  isHome: boolean = true;

  constructor() { }

  setHomeActive() {
  }
}
