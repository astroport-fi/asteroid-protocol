import { HttpClient, provideHttpClient } from '@angular/common/http';
import { SecurityContext, enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';
import { provideLottieOptions } from 'ngx-lottie';
import {
  CLIPBOARD_OPTIONS,
  MARKED_OPTIONS,
  provideMarkdown,
} from 'ngx-markdown';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { AnchorService } from './app/core/service/anchor.service';
import { markedOptionsFactory } from './app/core/types/marked-options';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideHttpClient(),
    provideRouter(routes),
    provideMarkdown({
      loader: HttpClient,
      markedOptions: {
        provide: MARKED_OPTIONS,
        useFactory: markedOptionsFactory,
        deps: [AnchorService],
      },
      // markedExtensions: [gfmHeadingId()],
      // clipboardOptions: {
      //   provide: CLIPBOARD_OPTIONS,
      //   useValue: { buttonComponent: ClipboardButtonComponent },
      // },
      sanitize: SecurityContext.NONE,
    }),
    provideLottieOptions({
      player: () => import('lottie-web'),
    }),
    provideAnimations(),
  ],
});
