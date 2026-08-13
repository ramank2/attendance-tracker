const CONFIG={"employees": [["AE01", "Sonu Thakur", "BD Head"], ["AE02", "Amit Saraf", "CS Head"], ["AE03", "Jyoti Kumari", "Account"], ["AE04", "Sunil Sah", "Support Staff"], ["AE28", "Nitesh Kumar", "Support Staff"], ["AE30", "Shankar Das", "Support Staff"], ["AE07", "Vishwadeep Bhosale", "Admin"], ["AE08", "Omkar Patil", "Ops"], ["AE09", "Krishnakant Thakur", "Ops"], ["AE10", "Swati Rohi", "Jr. Designer"], ["AE11", "karan", "Support Staff"], ["AE12", "Ram Kumar", "Support Staff"], ["AE13", "Jagdish", "Support Staff"], ["AE14", "Janavi", "Trainee(designer)"], ["AE15", "Atharav", "Account"], ["AE16", "Umang", "Executive"], ["AE17", "Didi", ""], ["AE18", "", ""], ["AE19", "", ""], ["AE20", "", ""], ["AE21", "", ""], ["AE22", "", ""], ["AE23", "", ""], ["AE24", "", ""], ["AE25", "", ""], ["AE26", "", ""]], "statuses": [["OP", "Office Present"], ["HP", "Half Day Present"], ["PL", "Planned Leave"], ["SL", "Sick Leave"], ["UL", "Unplanned Leave"], ["CP", "Client Site Present"], ["CO", "Compensatory Off"], ["GP", "Godown / Warehouse Present"], ["LM", "Late Marked After 10:30 AM"], ["WFH", "Work From Home"], ["NH", "National Holiday"], ["FL", "Festival Holiday"], ["WL", "Weekend Holiday"]], "years": [2026, 2027, 2028, 2029, 2030]};
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


const statusMap=Object.fromEntries(CONFIG.statuses.map(x=>[x[0],x[1]]));
const codes=CONFIG.statuses.map(x=>x[0]);
const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const years=CONFIG.years;
const $=id=>document.getElementById(id);
const normalizedEmployees=CONFIG.employees.map(e=>Array.isArray(e)?{id:e[0],name:e[1],designation:e[2]}:e);
const cloudReady=typeof SUPABASE_CONFIG!=="undefined" &&
  SUPABASE_CONFIG.url && !SUPABASE_CONFIG.url.includes("PASTE_YOUR") &&
  SUPABASE_CONFIG.anonKey && !SUPABASE_CONFIG.anonKey.includes("PASTE_YOUR");
const sb=cloudReady && window.supabase
  ? window.supabase.createClient(SUPABASE_CONFIG.url,SUPABASE_CONFIG.anonKey)
  : null;

let state={employees:normalizedEmployees,attendance:{},holidays:[]};
let cloudUser=null;
let cloudSyncing=false;

function localCache(){try{return JSON.parse(localStorage.getItem(KEY)||"null")}catch{return null}}
function saveLocal(){localStorage.setItem(KEY,JSON.stringify(state))}
function save(){saveLocal()}
function key(y,m){return `${y}-${String(m+1).padStart(2,"0")}`}
function daysInMonth(y,m){return new Date(y,m+1,0).getDate()}
function pad(n){return String(n).padStart(2,"0")}
function dateKey(y,m,d){return `${y}-${pad(m+1)}-${pad(d)}`}
function holidayFor(date){return state.holidays.find(h=>h.date===date)}
function employees(){return state.employees.filter(e=>e.id)}
function monthData(y,m){return state.attendance[key(y,m)]||(state.attendance[key(y,m)]={})}
function statusValue(y,m,id,d){return monthData(y,m)[id]?.[d]||""}

function setCloudStatus(text,kind=""){
  const el=$("cloudStatus"); if(!el)return;
  el.textContent=text; el.className="cloud-status "+kind;
}
function openAuth(){ $("authModal").classList.remove("hidden"); $("authMessage").textContent=""; }
function closeAuth(){ $("authModal").classList.add("hidden"); }
function setUiEnabled(enabled){
  document.querySelectorAll("main button, main input, main select").forEach(el=>el.disabled=!enabled);
}

async function signIn(){
  if(!sb)return;
  const email=$("authEmail").value.trim(),password=$("authPassword").value;
  if(!email||!password){$("authMessage").textContent="Enter email and password.";return}
  $("authMessage").textContent="Signing in...";
  const {data,error}=await sb.auth.signInWithPassword({email,password});
  if(error){$("authMessage").textContent=error.message;return}
  cloudUser=data.user; closeAuth(); await loadCloud();
}
async function signUp(){
  if(!sb)return;
  const email=$("authEmail").value.trim(),password=$("authPassword").value;
  if(!email||password.length<6){$("authMessage").textContent="Use an email and a password of at least 6 characters.";return}
  $("authMessage").textContent="Creating account...";
  const {data,error}=await sb.auth.signUp({email,password});
  if(error){$("authMessage").textContent=error.message;return}
  $("authMessage").textContent=data.session?"Account created.":"Account created. Check your email if confirmation is enabled.";
}
async function signOut(){
  if(sb)await sb.auth.signOut();
  cloudUser=null; setCloudStatus("Cloud: signed out","offline");
  $("authBtn").textContent="Sign In";
  setUiEnabled(false); openAuth();
}

async function cloudLoadTable(table){
  const {data,error}=await sb.from(table).select("*");
  if(error)throw error;
  return data||[];
}
async function cloudUpsert(table,rows){
  if(!sb||!cloudUser||!rows.length)return;
  const {error}=await sb.from(table).upsert(rows);
  if(error)throw error;
}
async function cloudDeleteAttendance(emp_id,attendance_date){
  if(!sb||!cloudUser)return;
  const {error}=await sb.from("attendance").delete().eq("emp_id",emp_id).eq("attendance_date",attendance_date);
  if(error)throw error;
}

async function seedConfiguredEmployees(){
  const rows=normalizedEmployees.map(e=>({emp_id:e.id,name:e.name||"",designation:e.designation||"",active:true}));
  const {error}=await sb.from("employees").upsert(rows,{onConflict:"emp_id",ignoreDuplicates:true});
  if(error)throw error;
}
async function seedFixedAndConfiguredHolidays(){
  const rows=[];
  years.forEach(y=>defaultHolidayRecords(y).forEach(h=>rows.push({
    holiday_date:h.date,holiday_type:h.type,name:h.name,locked:!!h.locked
  })));
  if(rows.length){
    const {error}=await sb.from("holidays").upsert(rows,{onConflict:"holiday_date",ignoreDuplicates:true});
    if(error)throw error;
  }
}
async function uploadLocalDataIfCloudEmpty(local){
  if(!local)return;
  const hasAttendance=Object.values(local.attendance||{}).some(md=>Object.values(md||{}).some(x=>Object.keys(x||{}).length));
  if(!hasAttendance && !(local.holidays||[]).length)return;
  if(!confirm("Cloud attendance is empty. Upload this browser's existing local data to the shared cloud database?"))return;

  const attendanceRows=[];
  Object.entries(local.attendance||{}).forEach(([ym,empMap])=>{
    Object.entries(empMap||{}).forEach(([empId,days])=>{
      Object.entries(days||{}).forEach(([day,status])=>{
        const [y,m]=ym.split("-").map(Number);
        attendanceRows.push({emp_id:empId,attendance_date:dateKey(y,m-1,+day),status_code:status});
      });
    });
  });
  if(attendanceRows.length)await cloudUpsert("attendance",attendanceRows);
  const holidayRows=(local.holidays||[]).map(h=>({holiday_date:h.date,holiday_type:h.type,name:h.name||"",locked:!!h.locked}));
  if(holidayRows.length)await cloudUpsert("holidays",holidayRows);
}
async function loadCloud(){
  if(!sb)return;
  cloudSyncing=true; setCloudStatus("Cloud: syncing..."); setUiEnabled(false);
  try{
    const local=localCache();
    await seedConfiguredEmployees();
    await seedFixedAndConfiguredHolidays();
    const [er,ar,hr]=await Promise.all([
      cloudLoadTable("employees"),cloudLoadTable("attendance"),cloudLoadTable("holidays")
    ]);

    if(!ar.length)await uploadLocalDataIfCloudEmpty(local);

    const [employeesRows,attendanceRows,holidayRows]=await Promise.all([
      cloudLoadTable("employees"),cloudLoadTable("attendance"),cloudLoadTable("holidays")
    ]);

    const dbEmployees=employeesRows.map(e=>({id:e.emp_id,name:e.name||"",designation:e.designation||""}));
    const byId=new Map(dbEmployees.map(e=>[e.id,e]));
    state.employees=normalizedEmployees.map(e=>byId.get(e.id)||e);
    dbEmployees.forEach(e=>{if(!byId.has(e.id))state.employees.push(e)});

    state.attendance={};
    attendanceRows.forEach(r=>{
      const dt=new Date(r.attendance_date+"T00:00:00");
      const ym=key(dt.getFullYear(),dt.getMonth());
      state.attendance[ym] ||= {};
      state.attendance[ym][r.emp_id] ||= {};
      state.attendance[ym][r.emp_id][dt.getDate()]=r.status_code;
    });
    state.holidays=holidayRows.map(h=>({date:h.holiday_date,type:h.holiday_type,name:h.name||"",locked:!!h.locked}));
    saveLocal();

    setCloudStatus("Cloud: synced","online");
    $("authBtn").textContent="Sign Out";
    $("storageMessage").textContent="Cloud sync is active. Use the same account on other devices to see the same data.";
    setUiEnabled(true);
    renderAttendance();renderSummary();renderHolidays();renderEmployees();
  }catch(err){
    console.error(err);
    setCloudStatus("Cloud: error","offline");
    alert("Cloud sync failed: "+err.message);
    setUiEnabled(false);
  }finally{cloudSyncing=false}
}

async function setStatus(y,m,id,d,v){
  const md=monthData(y,m);md[id] ||= {};
  const iso=dateKey(y,m,d);
  try{
    if(v)md[id][d]=v; else delete md[id][d];
    saveLocal();
    if(sb&&cloudUser){
      if(v)await cloudUpsert("attendance",[{emp_id:id,attendance_date:iso,status_code:v}]);
      else await cloudDeleteAttendance(id,iso);
    }
  }catch(err){alert("Could not save attendance to cloud: "+err.message)}
}
function ensureDefaultHolidays(year){
  const defaults=defaultHolidayRecords(year);
  state.holidays ||= [];
  defaults.forEach(d=>{
    if(!state.holidays.some(h=>h.date===d.date)){
      state.holidays.push(d);
    }
  });
}
function setupSelectors(){
  $("monthSelect").innerHTML=months.map((x,i)=>`<option value="${i}">${x}</option>`).join("");
  $("yearSelect").innerHTML=years.map(y=>`<option>${y}</option>`).join("");
  $("holidayYear").innerHTML=years.map(y=>`<option>${y}</option>`).join("");
  const now=new Date(), y=years.includes(now.getFullYear())?now.getFullYear():2026;
  $("monthSelect").value=now.getMonth();$("yearSelect").value=y;
  const todayISO=new Date().toISOString().slice(0,10);
  const monthStart=`${y}-${String(now.getMonth()+1).padStart(2,"0")}-01`;
  $("summaryStart").value=monthStart;$("summaryEnd").value=todayISO;$("holidayYear").value=y;
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
 document.querySelectorAll("[data-del]").forEach(b=>b.onclick=async()=>{if(confirm("Delete employee master record? Historical attendance remains in backup data.")){
     state.employees=state.employees.filter(x=>x.id!==b.dataset.del);saveLocal();
     if(sb&&cloudUser){const {error}=await sb.from("employees").delete().eq("emp_id",b.dataset.del);if(error)alert("Could not delete employee from cloud: "+error.message)}
     renderEmployees();renderAttendance();renderSummary()
   }});
}

function wire(){
 document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{
   document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
   document.querySelectorAll(".tab-panel").forEach(x=>x.classList.remove("active"));
   t.classList.add("active");$(t.dataset.tab).classList.add("active");
   if(t.dataset.tab==="summary")renderSummary();
 });
 $("monthSelect").onchange=renderAttendance;$("yearSelect").onchange=renderAttendance;$("empFilter").oninput=renderAttendance;
 $("summaryFilter").oninput=renderSummary;$("applySummary").onclick=renderSummary;
 $("summaryStart").onchange=renderSummary;$("summaryEnd").onchange=renderSummary;
 $("holidayYear").onchange=()=>{ensureDefaultHolidays(+$("holidayYear").value);renderHolidays();renderAttendance();renderSummary();};
 $("fillWeekends").onclick=fillSundays;
 $("saveMonth").onclick=async()=>{
   if(!sb||!cloudUser){alert("Please sign in to cloud sync first.");return}
   alert("All changes are saved automatically to the cloud.");
 };
 $("addHoliday").onclick=async()=>{
   const date=$("holidayDate").value,type=$("holidayType").value,name=$("holidayName").value.trim(),y=+$("holidayYear").value;
   if(!date)return alert("Select a date.");
   if(+date.slice(0,4)!==y)return alert("Select a date from the selected holiday year.");
   if(type==="NH")return alert("National Holidays are fixed: 26 Jan, 15 Aug and 2 Oct.");
   if(!name)return alert("Enter the festival holiday name.");
   const rec={date,type,name,locked:false};
   state.holidays=state.holidays.filter(h=>h.date!==date);
   state.holidays.push(rec);saveLocal();
   try{
     if(sb&&cloudUser)await cloudUpsert("holidays",[{holiday_date:date,holiday_type:type,name,locked:false}]);
     $("holidayName").value="";renderHolidays();renderAttendance();renderSummary();
   }catch(err){alert("Could not save holiday to cloud: "+err.message)}
 };
 $("addEmployee").onclick=async()=>{
   const id=$("empId").value.trim(),name=$("empName").value.trim(),designation=$("empDesignation").value.trim();
   if(!id)return alert("Emp ID is required.");
   const e=state.employees.find(x=>x.id===id);
   if(e){e.name=name;e.designation=designation}else state.employees.push({id,name,designation});
   saveLocal();
   try{
     if(sb&&cloudUser)await cloudUpsert("employees",[{emp_id:id,name,designation,active:true}]);
     $("empId").value="";$("empName").value="";$("empDesignation").value="";
     renderEmployees();renderAttendance();renderSummary();
   }catch(err){alert("Could not save employee to cloud: "+err.message)}
 };
 $("exportBtn").onclick=()=>{
   const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
   const a=document.createElement("a");a.href=URL.createObjectURL(blob);
   a.download=`attendance-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);
 };
 $("importFile").onchange=async e=>{
   const f=e.target.files[0];if(!f)return;
   try{
     const x=JSON.parse(await f.text());if(!x.employees||!x.attendance)throw 0;
     state=x;saveLocal();
     if(sb&&cloudUser){
       await cloudUpsert("employees",(state.employees||[]).map(e=>({emp_id:e.id,name:e.name||"",designation:e.designation||"",active:true})));
       const attendanceRows=[];
       Object.entries(state.attendance||{}).forEach(([ym,empMap])=>{
         Object.entries(empMap||{}).forEach(([empId,days])=>Object.entries(days||{}).forEach(([day,status])=>{
           const [yy,mm]=ym.split("-").map(Number);
           attendanceRows.push({emp_id:empId,attendance_date:dateKey(yy,mm-1,+day),status_code:status});
         }));
       });
       if(attendanceRows.length)await cloudUpsert("attendance",attendanceRows);
       if((state.holidays||[]).length)await cloudUpsert("holidays",state.holidays.map(h=>({holiday_date:h.date,holiday_type:h.type,name:h.name||"",locked:!!h.locked})));
       await loadCloud();
     }else{location.reload()}
   }catch(err){alert("Invalid attendance backup or cloud import error: "+(err.message||""))}
 };
 $("authBtn").onclick=()=>cloudUser?signOut():openAuth();
 $("signInBtn").onclick=signIn;$("signUpBtn").onclick=signUp;$("closeAuthBtn").onclick=closeAuth;
}

async function init(){
 setupSelectors();renderLegend();wire();
 const local=localCache();
 if(local){
   state=local;
   state.employees=Array.isArray(state.employees)?state.employees:normalizedEmployees;
   state.attendance=state.attendance||{};state.holidays=state.holidays||[];
 }else{
   state={employees:normalizedEmployees,attendance:{},holidays:[]};
 }
 if(!cloudReady){
   setCloudStatus("Cloud: setup required","offline");
   $("storageMessage").textContent="Cloud is not configured yet. Add Supabase settings to enable multi-device sync.";
   setUiEnabled(true);
   ensureDefaultHolidays(2026);renderAttendance();renderSummary();renderHolidays();renderEmployees();
   return;
 }
 const {data}=await sb.auth.getSession();
 cloudUser=data.session?.user||null;
 if(cloudUser){await loadCloud();}
 else{
   setCloudStatus("Cloud: sign in required","offline");
   setUiEnabled(false);openAuth();
 }
}
init();
