import { activitiesModule } from './activities/module.js';
import { areasModule } from './areas/module.js';
import { capacityModule } from './capacity/module.js';
import { dailyPlanModule } from './daily-plan/module.js';
import { goalsModule } from './goals/module.js';
import { insightsModule } from './insights/manifest.js';
import { journalModule } from './journal/module.js';
import { loggerModule } from './logger/manifest.js';
import { plansModule } from './plans/module.js';
import { progressModule } from './progress/manifest.js';
import { todayModule } from './today/manifest.js';
import { wellbeingModule } from './wellbeing/module.js';
import { wellnessBoostModule } from './wellness-boost/module.js';

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
  loggerModule,
  wellbeingModule,
  wellnessBoostModule,
  insightsModule,
  todayModule
]);
