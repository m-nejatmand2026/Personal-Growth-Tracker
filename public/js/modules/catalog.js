import { activitiesModule } from './activities/module.js';
import { areasModule } from './areas/module.js';
import { capacityModule } from './capacity/module.js';
import { dailyPlanModule } from './daily-plan/module.js';
import { goalsModule } from './goals/module.js';
import { journalModule } from './journal/module.js';
import { plansModule } from './plans/module.js';
import { progressModule } from './progress/manifest.js';
import { wellbeingModule } from './wellbeing/module.js';

// Frontend composition root. Platform/core code must not import business modules.
export const frontendModules = Object.freeze([
  areasModule,
  goalsModule,
  activitiesModule,
  plansModule,
  capacityModule,
  dailyPlanModule,
  journalModule,
  progressModule,
  wellbeingModule
]);
