export function createFallback(date) {
  return {
    date,
    week_start: date,
    energy: null,
    sessions: [],
    week: [
      {key:'sport',name:'Sport / Calisthenics',target_minutes:324,minimum_minutes:180,actual_minutes:0,progress:0},
      {key:'german',name:'German',target_minutes:216,minimum_minutes:120,actual_minutes:0,progress:0},
      {key:'guitar',name:'Guitar',target_minutes:135,minimum_minutes:60,actual_minutes:0,progress:0},
      {key:'reading',name:'Reading',target_minutes:216,minimum_minutes:120,actual_minutes:0,progress:0}
    ],
    targets: [],
    roadmap: [
      {id:1,horizon:'six_month',title:'German - Momente B1',detail:'Finish 24 lessons by 31 Dec 2026.'},
      {id:2,horizon:'compass',title:'Physical mastery',detail:'Calisthenics stays permanent; rotating sports stay editable.'}
    ],
    lessons: Array.from({length:24},(_,i)=>({lesson:i+1,planned_start:'',planned_end:'',completed_at:null}))
  };
}
