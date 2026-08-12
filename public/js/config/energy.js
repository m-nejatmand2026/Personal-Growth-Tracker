export const ENERGY = [
  ['Anger','Stress','Shock','Surprise','Aroused','Elated'],
  ['Agitated','Irritated','Restless','Energized','Optimistic','Happy'],
  ['Reactive','Worried','Displeased','Pleased','Hopeful','Grateful'],
  ['Hate','Bored','Numb','Comfortable','Satisfied','Neutral'],
  ['Pessimistic','Lonely','Tired','Relaxed','At Ease','Balanced'],
  ['Miserable','Devastated','Empty','Sleepy','Blissful','Composed']
];

export function energyScore(row) {
  return row < 3 ? 3 - row : -(row - 2);
}

export function valenceScore(column) {
  return column < 3 ? -(3 - column) : column - 2;
}

export function energyClass(row, column) {
  return row < 3 ? (column < 3 ? 'tl' : 'tr') : (column < 3 ? 'bl' : 'br');
}
