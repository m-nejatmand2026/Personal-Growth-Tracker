export const JOURNAL_TEMPLATES = Object.freeze({
  free: Object.freeze({ label: 'Free write', prompts: Object.freeze(['What do I want to capture before I forget it?']) }),
  morning: Object.freeze({ label: 'Morning', prompts: Object.freeze(['What matters most today?','How do I want to show up today?','What can wait?']) }),
  evening: Object.freeze({ label: 'Evening', prompts: Object.freeze(['What went well today?','What was difficult?','What did I learn?','What matters tomorrow?']) }),
  reflection: Object.freeze({ label: 'Reflection', prompts: Object.freeze(['What happened?','What did I notice in myself?','What do I want to remember or do differently?']) })
});
