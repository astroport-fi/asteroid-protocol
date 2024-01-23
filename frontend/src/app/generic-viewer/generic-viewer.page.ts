import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HumanTypePipe } from '../core/pipe/human-type.pipe';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { environment } from 'src/environments/environment';
import { Chain } from '../core/types/zeus';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { cloudDownloadOutline, eyeOffOutline, linkOutline } from "ionicons/icons";
import { addIcons } from 'ionicons';
import { MarkdownComponent, } from 'ngx-markdown'
import { NgScrollbarModule } from 'ngx-scrollbar';

@Component({
  selector: 'app-generic-viewer',
  templateUrl: './generic-viewer.page.html',
  styleUrls: ['./generic-viewer.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HumanTypePipe, MarkdownComponent, RouterLink, NgScrollbarModule]
})
export class GenericViewerPage implements OnInit {

  isLoading: boolean = true;
  inscription: any;
  humanType: string = '';
  untrustedURL: any;

  constructor(private activatedRoute: ActivatedRoute, private sanitizer: DomSanitizer) {
    addIcons({ cloudDownloadOutline, linkOutline, eyeOffOutline });
  }

  async ngOnInit() {

    const chain = Chain(environment.api.endpoint)

    const result = await chain('query')({
      inscription: [
        {
          where: {
            transaction: {
              hash: {
                _eq: this.activatedRoute.snapshot.params["txhash"]
              }
            }
          }
        }, {
          id: true,
          height: true,
          transaction: {
            hash: true
          },
          creator: true,
          current_owner: true,
          content_path: true,
          content_size_bytes: true,
          date_created: true,
          is_explicit: true,
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
    this.humanType = HumanTypePipe.prototype.transform(this.inscription.mime);
    this.untrustedURL = this.sanitizer.bypassSecurityTrustResourceUrl(this.inscription.content_path);
    this.isLoading = false;
  }


}
