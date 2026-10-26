import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { addIcons } from 'ionicons';
import {
  addCircleOutline,
  informationCircleOutline,
  peopleOutline,
  schoolOutline,
  trophyOutline,
} from 'ionicons/icons';

import { AppModule } from './app/app.module';

addIcons({
  'add-circle-outline': addCircleOutline,
  'information-circle-outline': informationCircleOutline,
  'people-outline': peopleOutline,
  'school-outline': schoolOutline,
  'trophy-outline': trophyOutline,
});

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
