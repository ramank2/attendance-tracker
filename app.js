const CONFIG={"employees": [["AE01", "Sonu Thakur", "BD Head"], ["AE02", "Amit Saraf", "CS Head"], ["AE03", "Jyoti Kumari", "Account"], ["AE04", "Sunil Sah", "Support Staff"], ["AE28", "Nitesh Kumar", "Support Staff"], ["AE30", "Shankar Das", "Support Staff"], ["AE07", "Vishwadeep Bhosale", "Admin"], ["AE08", "Omkar Patil", "Ops"], ["AE09", "Krishnakant Thakur", "Ops"], ["AE10", "Swati Rohi", "Jr. Designer"], ["AE11", "karan", "Support Staff"], ["AE12", "Ram Kumar", "Support Staff"], ["AE13", "Jagdish", "Support Staff"], ["AE14", "Janavi", "Trainee(designer)"], ["AE15", "Atharav", "Account"], ["AE16", "Umang", "Executive"], ["AE17", "Didi", ""], ["AE18", "", ""], ["AE19", "", ""], ["AE20", "", ""], ["AE21", "", ""], ["AE22", "", ""], ["AE23", "", ""], ["AE24", "", ""], ["AE25", "", ""], ["AE26", "", ""]], "statuses": [["OP", "Office Present"], ["HP", "Half Day Present"], ["PL", "Planned Leave"], ["SL", "Sick Leave"], ["UL", "Unplanned Leave"], ["CP", "Client Site Present"], ["CO", "Compensatory Off"], ["GP", "Godown / Warehouse Present"], ["LM", "Late Marked After 10.30am"], ["WFH", "Work From Home"], ["NH", "National Holiday"], ["FL", "Festival Holiday"], ["WL", "Weekend Leave"]], "years": [2026, 2027, 2028, 2029, 2030]};
const KEY="attendanceTracker_v1";
const normalizedEmployees=CONFIG.employees.map(e=>Array.isArray(e)?{id:e[0],name:e[1],designation:e[2]}:e);

const state=JSON.parse(localStorage.getItem(KEY)||"null")||{
  employees:normalizedEmployees,
  attendance:{},
  holidays:[]
};

if(!Array.isArray(state.employees) || !state.employees.length)
  state.employees=normalizedEmployees;
else
  state.employees=state.employees.map(e=>Array.isArray(e)?{id:e[0],name:e[1],designation:e[2]}:e);
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
  $("summaryMonth").innerHTML=months.map((x,i)=>`<option value="${i}">${x}</option>`).join("");
  $("yearSelect").innerHTML=years.map(y=>`<option>${y}</option>`).join("");
  $("summaryYear").innerHTML=years.map(y=>`<option>${y}</option>`).join("");
  const now=new Date(), y=years.includes(now.getFullYear())?now.getFullYear():2026;
  $("monthSelect").value=now.getMonth();$("yearSelect").value=y;
  $("summaryMonth").value=now.getMonth();$("summaryYear").value=y;
}
function renderLegend(){
 $("legend").innerHTML=CONFIG.statuses.map(([c,l])=>`<span class="badge"><b>${c}</b> ${l}</span>`).join("");
}
function statusOptions(selected){
 return `<option value=""></option>`+CONFIG.statuses.map(([c,l])=>`<option value="${c}" ${selected===c?"selected":""}>${c}</option>`).join("");
}
function renderAttendance(){
 const y=+$("yearSelect").value,m=+$("monthSelect").value,n=daysInMonth(y,m),filter=$("empFilter").value.toLowerCase();
 $("monthTitle").textContent=`${months[m]} ${y} Attendance`;
 $("monthInfo").textContent=`${n} calendar days • ${employees().length} employees`;
 let h="<thead><tr><th class='sticky'>Emp ID</th><th class='sticky'>Name</th><th class='sticky'>Designation</th>";
 for(let d=1;d<=n;d++){const dt=new Date(y,m,d),wk=dt.getDay()===0||dt.getDay()===6,hol=holidayFor(dateKey(y,m,d));h+=`<th class="date-head ${wk?"weekend":""} ${hol?"holiday":""}">${d}<br><small>${dt.toLocaleDateString("en-IN",{weekday:"short"})}</small>${hol?`<br><small>${hol.type}</small>`:""}</th>`}
 h+="</tr></thead><tbody>";
 employees().filter(e=>`${e.id} ${e.name} ${e.designation}`.toLowerCase().includes(filter)).forEach(e=>{
   h+=`<tr><td class="sticky"><b>${e.id}</b></td><td class="sticky name">${e.name||""}</td><td class="sticky">${e.designation||""}</td>`;
   for(let d=1;d<=n;d++){const dt=new Date(y,m,d),wk=dt.getDay()===0||dt.getDay()===6,hol=holidayFor(dateKey(y,m,d)),v=statusValue(y,m,e.id,d);
     h+=`<td class="${wk?"weekend":""} ${hol?"holiday":""}"><select class="status-select" data-id="${e.id}" data-day="${d}" title="${statusMap[v]||"Select status"}">${statusOptions(v)}</select></td>`}
   h+="</tr>";
 });
 h+="</tbody>";$("attendanceTable").innerHTML=h;
 document.querySelectorAll(".status-select").forEach(s=>s.addEventListener("change",()=>{setStatus(y,m,s.dataset.id,+s.dataset.day,s.value);s.title=statusMap[s.value]||"Select status";renderSummary()}));
}
function fillWeekends(){
 const y=+$("yearSelect").value,m=+$("monthSelect").value,n=daysInMonth(y,m);
 employees().forEach(e=>{for(let d=1;d<=n;d++){const dt=new Date(y,m,d),wk=dt.getDay()===0||dt.getDay()===6;if(wk&&!holidayFor(dateKey(y,m,d))&&!statusValue(y,m,e.id,d))setStatus(y,m,e.id,d,"WL")}});
 renderAttendance();renderSummary();
}
function countsFor(id,y,m0,m1){
 const out=Object.fromEntries(codes.map(c=>[c,0]));
 let recorded=0;
 for(let m=m0;m<=m1;m++){const n=daysInMonth(y,m);for(let d=1;d<=n;d++){const v=statusValue(y,m,id,d);if(v){out[v]=(out[v]||0)+1;recorded++}}}
 return {...out,recorded};
}
function holidayCounts(y,m0,m1){
 let nh=0,fl=0,weekend=0,calendar=0;
 for(let m=m0;m<=m1;m++){const n=daysInMonth(y,m);for(let d=1;d<=n;d++){const dt=new Date(y,m,d),date=dateKey(y,m,d);calendar++;if(dt.getDay()===0||dt.getDay()===6)weekend++;const h=holidayFor(date);if(h?.type==="NH")nh++;if(h?.type==="FL")fl++;}}
 return {nh,fl,weekend,calendar};
}
function presentEq(c){return (c.OP||0)+(c.CP||0)+(c.GP||0)+(c.WFH||0)+(c.LM||0)+(c.CO||0)+(c.HP||0)*.5}
function renderSummary(){
 const y=+$("summaryYear").value,m=+$("summaryMonth").value,filter=$("summaryFilter").value.toLowerCase();
 const mhol=holidayCounts(y,m,m), yhol=holidayCounts(y,0,11);
 $("kpis").innerHTML=[
  ["MTD Calendar Days",mhol.calendar],["MTD Weekend",mhol.weekend],["MTD NH",mhol.nh],["MTD FL",mhol.fl],
  ["YTD Calendar Days",yhol.calendar],["YTD Weekend",yhol.weekend],["YTD NH",yhol.nh],["YTD FL",yhol.fl]
 ].map(x=>`<div class="kpi"><small>${x[0]}</small><strong>${x[1]}</strong></div>`).join("");
 const cols=[["OP","Office"],["HP","Half Day"],["PL","Planned"],["SL","Sick"],["UL","Unplanned"],["CP","Client"],["CO","Comp Off"],["GP","Godown"],["LM","Late"],["WFH","WFH"],["NH","NH"],["FL","FL"],["WL","Weekend"],["Present Eq.","Present Eq."],["Recorded","Recorded"]];
 let h="<thead><tr><th>ID</th><th>Name</th><th>Designation</th>"+cols.map(c=>`<th>${c[0]}</th>`).join("")+"<th>MTD %</th><th>YTD %</th></tr></thead><tbody>";
 employees().filter(e=>`${e.id} ${e.name}`.toLowerCase().includes(filter)).forEach(e=>{
   const mc=countsFor(e.id,y,m,m),yc=countsFor(e.id,y,0,11);
   const mwork=Math.max(0,mhol.calendar-mhol.weekend-mhol.nh-mhol.fl),ywork=Math.max(0,yhol.calendar-yhol.weekend-yhol.nh-yhol.fl);
   const mp=mwork?Math.min(100,presentEq(mc)/mwork*100):0,yp=ywork?Math.min(100,presentEq(yc)/ywork*100):0;
   h+=`<tr><td><b>${e.id}</b></td><td style="text-align:left">${e.name||""}</td><td>${e.designation||""}</td>${cols.map(c=>`<td>${c[0]==="Present Eq."?presentEq(mc).toFixed(1):c[0]==="Recorded"?mc.recorded:(mc[c[0]]||0)}</td>`).join("")}<td>${mp.toFixed(1)}%</td><td>${yp.toFixed(1)}%</td></tr>`;
 });
 h+="</tbody>";$("summaryTable").innerHTML=h;
}
function renderHolidays(){
 const hs=[...state.holidays].sort((a,b)=>a.date.localeCompare(b.date));
 $("holidayTable").innerHTML=`<thead><tr><th>Date</th><th>Type</th><th>Name</th><th>Action</th></tr></thead><tbody>`+
 hs.map((h,i)=>`<tr><td>${h.date}</td><td><b>${h.type}</b></td><td>${h.name||""}</td><td><button class="btn delete" data-hi="${i}">Delete</button></td></tr>`).join("")+"</tbody>";
 document.querySelectorAll("[data-hi]").forEach(b=>b.onclick=()=>{const sorted=[...state.holidays].sort((a,b)=>a.date.localeCompare(b.date));const target=sorted[+b.dataset.hi];state.holidays=state.holidays.filter(x=>x!==target);save();renderHolidays();renderAttendance();renderSummary()});
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
 $("summaryYear").onchange=renderSummary;$("summaryMonth").onchange=renderSummary;$("summaryFilter").oninput=renderSummary;
 $("fillWeekends").onclick=fillWeekends;$("saveMonth").onclick=()=>{save();alert("Month saved in this browser.")};
 $("addHoliday").onclick=()=>{const date=$("holidayDate").value,type=$("holidayType").value,name=$("holidayName").value.trim();if(!date)return alert("Select a date.");state.holidays=state.holidays.filter(h=>h.date!==date);state.holidays.push({date,type,name});save();$("holidayName").value="";renderHolidays();renderAttendance();renderSummary()};
 $("addEmployee").onclick=()=>{const id=$("empId").value.trim(),name=$("empName").value.trim(),designation=$("empDesignation").value.trim();if(!id)return alert("Emp ID is required.");const e=state.employees.find(x=>x.id===id);if(e){e.name=name;e.designation=designation}else state.employees.push({id,name,designation});save();$("empId").value="";$("empName").value="";$("empDesignation").value="";renderEmployees();renderAttendance();renderSummary()};
 $("exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`attendance-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href)};
 $("importFile").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const x=JSON.parse(await f.text());if(!x.employees||!x.attendance)throw 0;localStorage.setItem(KEY,JSON.stringify(x));location.reload()}catch{alert("Invalid attendance backup file.")}};
}
setupSelectors();renderLegend();wire();renderAttendance();renderSummary();renderHolidays();renderEmployees();
