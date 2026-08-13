import { areasModule } from './areas/module.js';
import { capacityModule } from './capacity/module.js';
import { goalsModule } from './goals/module.js';
import { plansModule } from './plans/module.js';
import { todayIntentionsModule } from './today-intentions/module.js';

// Frontend composition root. Platform/core code must not import business modules.
export const frontendModules = Object.freeze([
  areasModule,
  goalsModule,
  plansModule,
  capacityModule,
  todayIntentionsModule
]);
