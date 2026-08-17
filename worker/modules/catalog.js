import { activitiesModule } from './activities/module.js';
import { areasModule } from './areas/module.js';
import { capacityModule } from './capacity/module.js';
import { dailyPlanModule } from './daily-plan/module.js';
import { goalsModule } from './goals/module.js';
import { journalModule } from './journal/module.js';
import { plansModule } from './plans/module.js';
import { progressModule } from './progress/module.js';
import { todayModule } from './today/module.js';
import { wellbeingModule } from './wellbeing/module.js';
import { wellnessBoostModule } from './wellness-boost/module.js';

// Composition root: this is the one intentional place where the Worker knows
// which Version 1 business modules are installed. Core/platform code must not
// import this catalog.
export const platformModules = Object.freeze([
  areasModule,
  goalsModule,
  activitiesModule,
  plansModule,
  capacityModule,
  dailyPlanModule,
  journalModule,
  progressModule,
  wellbeingModule,
  wellnessBoostModule,
  todayModule
]);
