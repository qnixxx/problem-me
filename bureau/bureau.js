/* Bureau editorial preview: no telemetry, data collection or browser storage. */
(()=>{'use strict';
const forecasts=[
['SCATTERED MISUNDERSTANDINGS.','One important email will begin with “just circling back.” Visibility improves after tea.'],
['CLOUDY WITH A CHANCE OF TABS.','Seventeen browser tabs are open. The one you need is among the first sixteen.'],
['MINOR SCHEDULING TURBULENCE.','A meeting will be arranged to determine whether another meeting is required.'],
['THE SOCK VORTEX REMAINS ACTIVE.','Laundry is expected to emerge warmer, cleaner and marginally less symmetrical.'],
['HIGH PRESSURE, LOW STAKES.','Someone will announce they are “not stressed” unusually loudly.'],
['AN UNEXPECTED UPDATE FRONT.','The computer will pick the least convenient moment to become a better version of itself.'],
['INTERMITTENT IMPATIENCE.','The shortest queue is expected to develop a fascinating and complicated backstory.'],
['ISOLATED EPISODES OF FORGETFULNESS.','Entering a room may erase the entire reason you walked there.'],
['A GENTLE WAVE OF INDECISION.','One small choice may attract seventeen helpful, mutually exclusive opinions.'],
['SUNNY, EXCEPT FOR THE PRINTER.','Urgent paper-based tasks have an elevated chance of spontaneous philosophical reflection.']
];
const title=document.getElementById('forecast-title');
if(title){
  const today=new Date();const day=Math.floor(Date.UTC(today.getFullYear(),today.getMonth(),today.getDate())/86400000);
  const forecast=forecasts[(day%forecasts.length+forecasts.length)%forecasts.length];
  title.textContent=forecast[0];document.getElementById('forecast-copy').textContent=forecast[1];
  document.getElementById('forecast-date').textContent=new Intl.DateTimeFormat('en',{day:'2-digit',month:'short',year:'numeric'}).format(today).toUpperCase();
}
const surprise=document.getElementById('surprise-case');
if(surprise)surprise.addEventListener('click',()=>{
 const cases=['exhibits/printer.html','exhibits/sock.html','exhibits/queue.html'];
 location.assign(cases[Math.floor(Math.random()*cases.length)]);
});
})();