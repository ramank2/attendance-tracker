const CONFIG={"employees": [["AE01", "Sonu Thakur", "BD Head"], ["AE02", "Amit Saraf", "CS Head"], ["AE03", "Jyoti Kumari", "Account"], ["AE04", "Sunil Sah", "Support Staff"], ["AE28", "Nitesh Kumar", "Support Staff"], ["AE30", "Shankar Das", "Support Staff"], ["AE07", "Vishwadeep Bhosale", "Admin"], ["AE08", "Omkar Patil", "Ops"], ["AE09", "Krishnakant Thakur", "Ops"], ["AE10", "Swati Rohi", "Jr. Designer"], ["AE11", "karan", "Support Staff"], ["AE12", "Ram Kumar", "Support Staff"], ["AE13", "Jagdish", "Support Staff"], ["AE14", "Janavi", "Trainee(designer)"], ["AE15", "Atharav", "Account"], ["AE16", "Umang", "Executive"], ["AE17", "Didi", ""], ["AE18", "", ""], ["AE19", "", ""], ["AE20", "", ""], ["AE21", "", ""], ["AE22", "", ""], ["AE23", "", ""], ["AE24", "", ""], ["AE25", "", ""], ["AE26", "", ""]], "statuses": [["OP", "Office Present"], ["HP", "Half Day Present"], ["PL", "Planned Leave"], ["SL", "Sick Leave"], ["UL", "Unplanned Leave"], ["CP", "Client Site Present"], ["CO", "Compensatory Off"], ["GP", "Godown / Warehouse Present"], ["LM", "Late Marked After 10.30AM"], ["WFH", "Work From Home"], ["NH", "National Holiday"], ["FL", "Festival Holiday"], ["WL", "Weekend Holiday"]], "years": [2026, 2027, 2028, 2029, 2030]};
const KEY="attendanceTracker_v1";
const FIXED_NATIONAL_HOLIDAYS=[
  {month:0,day:26,name:"Republic Day"},
  {month:7,day:15,name:"Independence Day"},
  {month:9,day:2,name:"Gandhi Jayanti"}
];
const FESTIVAL_HOLIDAYS={
  2026:[
    {month:1,day:19,name:"Chhatrapati Shivaji Maharaj Jayanti"},
    {month:2,day:3,name:"Holi (Second Day)"},
    {month:2,day:19,name:"Gudhi Padwa"},
    {month:2,day:21,name:"Ramzan-Id (Id-Ul-Fitra)"},
    {month:3,day:14,name:"Dr. Babasaheb Ambedkar Jayanti"},
    {month:4,day:1,name:"Maharashtra Din & Buddha Pournima"},
    {month:4,day:28,name:"Bakri Id"},
    {month:8,day:14,name:"Ganesh Chaturthi"},
    {month:9,day:20,name:"Dasara"},
    {month:10,day:8,name:"Diwali (Laxmi Pujan / Bali Pratipada)"},
    {month:10,day:10,name:"Diwali (Laxmi Pujan / Bali Pratipada)"},
    {month:11,day:25,name:"Christmas"}
  ]
};
function defaultHolidayRecords(year){
  const fixed=FIXED_NATIONAL_HOLIDAYS.map(h=>({date:dateKey(year,h.month,h.day),type:"NH",name:h.name,locked:true}));
  const festival=(FESTIVAL_HOLIDAYS[year]||[]).map(h=>({date:dateKey(year,h.month,h.day),type:"FL",name:h.name,locked:false}));
  return [...fixed,...festival];
}
function ensureDefaultHolidays(year){
  const defaults=defaultHolidayRecords(year);
  state.holidays ||= [];
  defaults.forEach(d=>{
    const exists=state.holidays.some(h=>h.date===d.date && h.type===d.type);
    if(!exists) state.holidays.push(d);
  });
}

const normalizedEmployees=CONFIG.employees.map(e=>Array.isArray(e)?{id:e[0],name:e[1],designation:e[2]}:e);
const state=JSON.parse(localStorage.getItem(KEY)||"null")||{employees:normalizedEmployees,attendance:{},holidays:[]};
if(!Array.isArray(state.employees) || !state.employees.length) state.employees=normalizedEmployees;
else state.employees=state.employees.map(e=>Array.isArray(e)?{id:e[0],name:e[1],designation:e[2]}:e);
const statusMap=Object.fromEntries(CONFIG.statuses.map(x=>[x[0],x[1]]));
const codes=CONFIG.statuses.map(x=>x[0]);
const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const years=CONFIG.years;
const $=id=>document.getElementById(id);
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function key(y,m){return `${y}-${String(m+1).padStart(2,"0")}`}
function daysInMonth(y,m){return new Date(y,m+1,0).getDate()}
function pad(n){return String(n).padStart(2,"0")}
function dateKey(y,m,d){return `${y}-${pad(m+1)}-${pad(d)}`}
function holidayFor(date){return state.holidays.find(h=>h.date===date)}
function employees(){return state.employees.filter(e=>e.id)}
function monthData(y,m){return state.attendance[key(y,m)]||(state.attendance[key(y,m)]={})}
function statusValue(y,m,id,d){return monthData(y,m)[id]?.[d]||""}
function setStatus(y,m,id,d,v){const md=monthData(y,m);md[id] ||= {};if(v)md[id][d]=v;else delete md[id][d];save()}
function setupSelectors(){
  $("monthSelect").innerHTML=months.map((x,i)=>`<option value="${i}">${x}</option>`).join("");
  $("yearSelect").innerHTML=years.map(y=>`<option>${y}</option>`).join("");
  $("holidayYear").innerHTML=years.map(y=>`<option>${y}</option>`).join("");
  const now=new Date(), y=years.includes(now.getFullYear())?now.getFullYear():2026;
  $("monthSelect").value=now.getMonth();$("yearSelect").value=y;
  const todayISO=new Date().toISOString().slice(0,10);
  const monthStart=`${y}-${String(now.getMonth()+1).padStart(2,"0")}-01`;
  $("summaryStart").value=monthStart;
  $("summaryEnd").value=todayISO;
  $("holidayYear").value=y;
  years.forEach(yr=>ensureDefaultHolidays(yr));
  save();
}
function renderLegend(){
 $("legend").innerHTML=CONFIG.statuses.map(([c,l])=>`<span class="badge"><b>${c}</b> ${l}</span>`).join("");
}
function statusOptions(selected){
 return `<option value=""></option>`+CONFIG.statuses.map(([c,l])=>`<option value="${c}" ${selected===c?"selected":""}>${c}</option>`).join("");
}
function renderAttendance(){
 const y=+$("yearSelect").value,m=+$("monthSelect").value,n=daysInMonth(y,m),filter=$("empFilter").value.toLowerCase();
 ensureDefaultHolidays(y);
 employees().forEach(e=>{for(let d=1;d<=n;d++){
   const date=dateKey(y,m,d),dt=new Date(y,m,d),sun=dt.getDay()===0,hol=holidayFor(date);
   if(hol&&!statusValue(y,m,e.id,d))setStatus(y,m,e.id,d,hol.type);
   else if(sun&&!statusValue(y,m,e.id,d))setStatus(y,m,e.id,d,"WL");
 }});
 $("monthTitle").textContent=`${months[m]} ${y} Attendance`;
 $("monthInfo").textContent=`${n} calendar days • ${employees().length} employees`;
 let h="<thead><tr><th class='sticky'>Emp ID</th><th class='sticky'>Name</th><th class='sticky'>Designation</th>";
 for(let d=1;d<=n;d++){const dt=new Date(y,m,d),sun=dt.getDay()===0,hol=holidayFor(dateKey(y,m,d));h+=`<th class="date-head ${sun?"weekend":""} ${hol?"holiday":""}">${d}<br><small>${dt.toLocaleDateString("en-IN",{weekday:"short"})}</small>${hol?`<br><small>${hol.type}</small>`:""}`}
 h+="</tr></thead><tbody>";
 employees().filter(e=>`${e.id} ${e.name} ${e.designation}`.toLowerCase().includes(filter)).forEach(e=>{
   h+=`<tr><td class="sticky"><b>${e.id}</b></td><td class="sticky name">${e.name||""}</td><td class="sticky">${e.designation||""}</td>`;
   for(let d=1;d<=n;d++){const dt=new Date(y,m,d),sun=dt.getDay()===0,hol=holidayFor(dateKey(y,m,d)),v=statusValue(y,m,e.id,d);
     h+=`<td class="${sun?"weekend":""} ${hol?"holiday":""}"><select class="status-select" data-id="${e.id}" data-day="${d}" title="${statusMap[v]||"Select status"}">${statusOptions(v)}</select></td>`}
   h+="</tr>";
 });
 h+="</tbody>";$("attendanceTable").innerHTML=h;
 document.querySelectorAll(".status-select").forEach(s=>s.addEventListener("change",()=>{setStatus(y,m,s.dataset.id,+s.dataset.day,s.value);s.title=statusMap[s.value]||"Select status";renderSummary()}));
}
function fillSundays(){
 const y=+$("yearSelect").value,m=+$("monthSelect").value,n=daysInMonth(y,m);
 employees().forEach(e=>{for(let d=1;d<=n;d++){
   const dt=new Date(y,m,d),sun=dt.getDay()===0,hol=holidayFor(dateKey(y,m,d));
   if(sun&&!hol&&!statusValue(y,m,e.id,d))setStatus(y,m,e.id,d,"WL");
 }});
 renderAttendance();renderSummary();
}
function dateRangeDates(startISO,endISO){
 const out=[];
 if(!startISO||!endISO||startISO>endISO)return out;
 let d=new Date(startISO+"T00:00:00"),end=new Date(endISO+"T00:00:00");
 while(d<=end){
   out.push({year:d.getFullYear(),month:d.getMonth(),day:d.getDate(),date:dateKey(d.getFullYear(),d.getMonth(),d.getDate()),dt:new Date(d)});
   d.setDate(d.getDate()+1);
 }
 return out;
}
function countsForRange(id,startISO,endISO){
 const out=Object.fromEntries(codes.map(c=>[c,0]));
 let recorded=0;
 dateRangeDates(startISO,endISO).forEach(x=>{
   const v=statusValue(x.year,x.month,id,x.day);
   if(v){out[v]=(out[v]||0)+1;recorded++}
 });
 return {...out,recorded};
}
function holidayCountsRange(startISO,endISO){
 let nh=0,fl=0,weekend=0,calendar=0;
 dateRangeDates(startISO,endISO).forEach(x=>{
   calendar++;
   if(x.dt.getDay()===0)weekend++;
   const h=holidayFor(x.date);
   if(h?.type==="NH")nh++;
   if(h?.type==="FL")fl++;
 });
 return {nh,fl,weekend,calendar};
}
function presentEq(c){
 // Full-present codes count as 1 day; HP counts as 0.5 day.
 return (c.OP||0)+(c.CP||0)+(c.GP||0)+(c.WFH||0)+(c.LM||0)+(c.CO||0)+(c.HP||0)*0.5;
}
function renderSummary(){
 const startISO=$("summaryStart").value,endISO=$("summaryEnd").value,filter=$("summaryFilter").value.toLowerCase();
 if(!startISO||!endISO||startISO>endISO){
   $("kpis").innerHTML=`<div class="kpi"><small>Status</small><strong>Invalid range</strong></div>`;
   $("summaryTable").innerHTML="";return;
 }
 const hol=holidayCountsRange(startISO,endISO);
 $("summaryRangeLabel").textContent=`${startISO} to ${endISO}`;
 $("kpis").innerHTML=[
  ["Calendar Days",hol.calendar],["Weekend (Sunday)",hol.weekend],
  ["National Holiday",hol.nh],["Festival Holiday",hol.fl]
 ].map(x=>`<div class="kpi"><small>${x[0]}</small><strong>${x[1]}</strong></div>`).join("");
 const cols=[
  ["OP","Office Present"],["HP","Half Day Present"],["PL","Planned Leave"],["SL","Sick Leave"],
  ["UL","Unplanned Leave"],["CP","Client Site"],["CO","Comp Off"],["GP","Godown"],
  ["LM","Late Mark"],["WFH","Work From Home"],["NH","National Holiday"],["FL","Festival Holiday"],
  ["WL","Weekend"],["Present Equivalent","Present Equivalent"],["Recorded","Recorded"]
 ];
 let h="<thead><tr><th>ID</th><th>Name</th><th>Designation</th>"+
   cols.map(c=>`<th title="${c[1]}">${c[0]}</th>`).join("")+
   "<th>Attendance %</th></tr></thead><tbody>";
 employees().filter(e=>`${e.id} ${e.name} ${e.designation}`.toLowerCase().includes(filter)).forEach(e=>{
   const c=countsForRange(e.id,startISO,endISO);
   const officialWorkingDays=Math.max(0,hol.calendar-hol.weekend-hol.nh-hol.fl);
   const pct=officialWorkingDays?Math.min(100,presentEq(c)/officialWorkingDays*100):0;
   h+=`<tr><td><b>${e.id}</b></td><td style="text-align:left">${e.name||""}</td><td>${e.designation||""}</td>`+
      cols.map(col=>`<td>${col[0]==="Present Equivalent"?presentEq(c).toFixed(1):col[0]==="Recorded"?c.recorded:(c[col[0]]||0)}</td>`).join("")+
      `<td>${pct.toFixed(1)}%</td></tr>`;
 });
 $("summaryTable").innerHTML=h+"</tbody>";
}
function renderHolidays(){
 const y=+$("holidayYear").value;
 ensureDefaultHolidays(y);
 const hs=state.holidays.filter(h=>h.date.startsWith(`${y}-`)).sort((a,b)=>a.date.localeCompare(b.date));
 $("holidayTitle").textContent=`Holiday Calendar — ${y}`;
 $("holidayTable").innerHTML=`<thead><tr><th>Date</th><th>Day</th><th>Code</th><th>Holiday</th><th>Type</th><th>Action</th></tr></thead><tbody>`+
 hs.map(h=>`<tr><td>${h.date}</td><td>${new Date(h.date+"T00:00:00").toLocaleDateString("en-IN",{weekday:"long"})}</td><td><b>${h.type}</b></td><td style="text-align:left">${h.name||""}</td><td>${h.type==="NH"?"National Holiday":"Festival Holiday"}</td><td>${h.type==="NH"||h.locked?`<span class="muted">Fixed</span>`:`<button class="btn delete" data-hdate="${h.date}" data-htype="${h.type}">Delete</button>`}</td></tr>`).join("")+"</tbody>";
 document.querySelectorAll("[data-hdate]").forEach(b=>b.onclick=()=>{
   state.holidays=state.holidays.filter(h=>!(h.date===b.dataset.hdate&&h.type===b.dataset.htype));
   save();renderHolidays();renderAttendance();renderSummary();
 });
}
function renderEmployees(){
 $("employeeTable").innerHTML=`<thead><tr><th>ID</th><th>Name</th><th>Designation</th><th>Action</th></tr></thead><tbody>`+
 employees().map((e,i)=>`<tr><td><b>${e.id}</b></td><td>${e.name||""}</td><td>${e.designation||""}</td><td><button class="btn" data-edit="${e.id}">Edit</button> <button class="btn delete" data-del="${e.id}">Delete</button></td></tr>`).join("")+"</tbody>";
 document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>{const e=state.employees.find(x=>x.id===b.dataset.edit);$("empId").value=e.id;$("empName").value=e.name;$("empDesignation").value=e.designation||""});
 document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{if(confirm("Delete employee master record? Historical attendance remains in backup data.")){state.employees=state.employees.filter(x=>x.id!==b.dataset.del);save();renderEmployees();renderAttendance();renderSummary()}});
}
function wire(){
 document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".tab-panel").forEach(x=>x.classList.remove("active"));t.classList.add("active");$(t.dataset.tab).classList.add("active");if(t.dataset.tab==="summary")renderSummary();});
 $("monthSelect").onchange=renderAttendance;$("yearSelect").onchange=renderAttendance;$("empFilter").oninput=renderAttendance;
 $("summaryFilter").oninput=renderSummary;$("applySummary").onclick=renderSummary;$("summaryStart").onchange=renderSummary;$("summaryEnd").onchange=renderSummary;$("holidayYear").onchange=()=>{ensureDefaultHolidays(+$("holidayYear").value);save();renderHolidays()};
 $("fillWeekends").onclick=fillSundays;$("saveMonth").onclick=()=>{save();alert("Month saved in this browser.")};
 $("addHoliday").onclick=()=>{const date=$("holidayDate").value,type=$("holidayType").value,name=$("holidayName").value.trim(),y=+$("holidayYear").value;if(!date)return alert("Select a date.");if(+date.slice(0,4)!==y)return alert("Select a date from the selected holiday year.");if(type==="NH")return alert("National Holidays are fixed: 26 Jan, 15 Aug and 2 Oct.");if(!name)return alert("Enter the festival holiday name.");state.holidays=state.holidays.filter(h=>h.date!==date);state.holidays.push({date,type,name,locked:false});save();$("holidayName").value="";renderHolidays();renderAttendance();renderSummary()};
 $("addEmployee").onclick=()=>{const id=$("empId").value.trim(),name=$("empName").value.trim(),designation=$("empDesignation").value.trim();if(!id)return alert("Emp ID is required.");const e=state.employees.find(x=>x.id===id);if(e){e.name=name;e.designation=designation}else state.employees.push({id,name,designation});save();$("empId").value="";$("empName").value="";$("empDesignation").value="";renderEmployees();renderAttendance();renderSummary()};
 $("exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`attendance-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href)};
 $("importFile").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const x=JSON.parse(await f.text());if(!x.employees||!x.attendance)throw 0;localStorage.setItem(KEY,JSON.stringify(x));location.reload()}catch{alert("Invalid attendance backup file.")}};
}
setupSelectors();renderLegend();wire();renderAttendance();renderSummary();renderHolidays();renderEmployees();
