/* ═══ إعدادات ═══ */
var USERS=[{u:'حسين',p:'1979',role:'admin',name:'حسين'},{u:'مستخدم',p:'1234',role:'user',name:'مستخدم'}];
var CUR='د.ع.';
var REPO='USERNAME/REPO'; /* ← ضع مستودعك هنا مثل: ahmedbrzan/complex */
var LS_DATA='cmpx_v11',SS_SESS='cmpx_sess_v11',LS_LAST='cmpx_last_v11';
function $(s){return document.querySelector(s)}
function $$(s){return Array.prototype.slice.call(document.querySelectorAll(s))}
var DB=JSON.parse(localStorage.getItem(LS_DATA)||'null');
var session=JSON.parse(sessionStorage.getItem(SS_SESS)||'null');
var state={cat:'out',range:'today',month:ym(new Date()),day:dstr(new Date()),q:''};
var WB=null,ACTIVE=null,CUR_SHEET='',VIEW_ROWS=[],GITFILES=[],searchTimer=null,idbDB=null;
/* ═══ أدوات ═══ */
function ym(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}
function dstr(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function addDays(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x}
function startOfWeek(d){var x=new Date(d);x.setDate(x.getDate()-x.getDay());return x}
var TODAY=dstr(new Date());
function fmtD(iso){if(!iso)return '—';var p=iso.split('-');return p[2]+'-'+p[1]+'-'+p[0]}
function money(n,wc){var s=(Number(n)||0).toLocaleString('en-US',{maximumFractionDigits:2});return wc?s+'<span class="cur">'+CUR+'</span>':s}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function wdLong(ds){try{return new Intl.DateTimeFormat('ar',{weekday:'long'}).format(new Date(ds+'T00:00:00'))}catch(e){return ''}}
function showOv(el){el.classList.add('show');document.body.classList.add('locked')}
function hideOv(el){el.classList.remove('show');if(!document.querySelector('.ov.show'))document.body.classList.remove('locked')}
function norm(s){return String(s==null?'':s).replace(/[\u064B-\u0652\u0670\u0640]/g,'').replace(/[أإآٱ]/g,'ا').replace(/[ىئ]/g,'ي').replace(/ؤ/g,'و').replace(/ة/g,'ه').replace(/[٠-٩]/g,function(d){return '٠١٢٣٤٥٦٧٨٩'.indexOf(d)}).toLowerCase()}
function smartRx(q){var nq=norm(q),p=[];for(var i=0;i<nq.length;i++){var c=nq[i];if(c==='ا')p.push('[اأإآٱ]');else if(c==='ي')p.push('[يىئ]');else if(c==='ه')p.push('[هة]');else if(c==='و')p.push('[وؤ]');else p.push(c.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));}return new RegExp('('+p.join('')+')','g')}
function hi(txt,q){var raw=String(txt==null?'':txt);if(!q)return esc(raw);var rx;try{rx=smartRx(q)}catch(e){return esc(raw)}var out='',last=0,m;rx.lastIndex=0;while((m=rx.exec(raw))){out+=esc(raw.slice(last,m.index))+'<mark>'+esc(m[0])+'</mark>';last=m.index+m[0].length;if(!m[0].length)rx.lastIndex++;}return out+esc(raw.slice(last))}
var toastTimer=null;
function showToast(msg,err,dur){dur=dur||2200;var t=$('#toast');$('#toastMsg').textContent=msg;t.classList.toggle('err',!!err);t.querySelector('.prog').style.animationDuration=dur+'ms';t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(function(){t.classList.remove('show')},dur)}
function setNum(id,v){$(id).innerHTML=money(v,true)}
function tick(){var n=new Date();$('#clockNow').textContent=n.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});$('#dateNow').textContent=wdLong(dstr(n))+' '+fmtD(dstr(n))}
tick();setInterval(tick,20000);
/* ═══ حفظ محلي IndexedDB ═══ */
function idb(){return new Promise(function(res,rej){var q=indexedDB.open('cx-save',1);q.onupgradeneeded=function(e){e.target.result.createObjectStore('save',{keyPath:'name'})};q.onsuccess=function(e){idbDB=e.target.result;res()};q.onerror=function(){rej(q.error)}})}
function putLocal(name,blob){return new Promise(function(res,rej){var tx=idbDB.transaction('save','readwrite');tx.objectStore('save').put({name:name,blob:blob,ts:Date.now()});tx.oncomplete=res;tx.onerror=rej})}
function getLocal(name){return new Promise(function(res,rej){var tx=idbDB.transaction('save','readonly');var q=tx.objectStore('save').get(name);q.onsuccess=function(){res(q.result)};q.onerror=rej})}
function allLocal(){return new Promise(function(res,rej){var tx=idbDB.transaction('save','readonly');var q=tx.objectStore('save').getAll();q.onsuccess=function(){res(q.result||[])};q.onerror=rej})}
function renderLocal(){if(!idbDB){$('#locList').innerHTML='<span class="tag">التخزين غير متاح</span>';return}
allLocal().then(function(list){list.sort(function(a,b){return (b.ts||0)-(a.ts||0)});
$('#locList').innerHTML=list.map(function(r){return '<div class="fchip"><b>📍 '+esc(r.name)+'</b><button class="btn-mini" data-loc="'+esc(r.name)+'">فتح</button></div>'}).join('')||'<span class="tag">لا حفظ محلي بعد</span>'})}
function openLocal(name){getLocal(name).then(function(rec){if(!rec)return;rec.blob.arrayBuffer().then(function(buf){setActive(rec.name,buf)});localStorage.setItem(LS_LAST,name)})}
$('#saveBtn').onclick=function(){if(!idbDB){showToast('التخزين غير متاح',1);return}if(!ACTIVE){showToast('افتح ملفًا أولًا ثم اضغط 💾',1);return}
putLocal(ACTIVE.name,ACTIVE.blob).then(function(){renderLocal();showToast('💾 تم الحفظ محليًا: '+ACTIVE.name,false,1800)})};
$('#locList').addEventListener('click',function(e){var b=e.target.closest('[data-loc]');if(b)openLocal(b.getAttribute('data-loc'))});
/* ═══ GitHub ═══ */
function refreshGit(){if(REPO.indexOf('USERNAME')===0){$('#gitList').innerHTML='<span class="tag">ضع اسم مستودعك في الكود (REPO)</span>';return}
$('#gitList').innerHTML='<span class="tag">⏳ جلب القائمة…</span>';
fetch('https://api.github.com/repos/'+REPO+'/contents/?t='+Date.now()).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(list){
GITFILES=list.filter(function(x){return /\.(xlsx|xlsm|xls)$/i.test(x.name)});
$('#gitList').innerHTML=GITFILES.map(function(f,i){return '<div class="fchip"><b>📄 '+esc(f.name)+'</b><button class="btn-mini" data-git="'+i+'">فتح</button></div>'}).join('')||'<span class="tag">لا ملفات إكسل بالمستودع</span>'})
.catch(function(){$('#gitList').innerHTML='<span class="tag">تعذّر جلب قائمة GitHub</span>'})}
function openGit(i){var f=GITFILES[i];if(!f)return;showToast('⏳ تحميل '+f.name+'…',false,1500);
fetch(f.download_url).then(function(r){if(!r.ok)throw 0;return r.arrayBuffer()}).then(function(buf){setActive(f.name,buf);showToast('✅ فُتح من GitHub — اضغط 💾 ليصبح محليًا',false,2000)}).catch(function(){showToast('فشل التحميل من GitHub',1)})}
$('#gitBtn').onclick=refreshGit;
$('#gitList').addEventListener('click',function(e){var b=e.target.closest('[data-git]');if(b)openGit(+b.getAttribute('data-git'))});
/* ═══ الدخول ═══ */
$('#eyeBtn').onclick=function(){var i=$('#lp');i.type=i.type==='password'?'text':'password'};
$('#loginForm').onsubmit=function(e){e.preventDefault();var u=$('#lu').value.trim(),p=$('#lp').value.trim(),a=null;
for(var i=0;i<USERS.length;i++){if(USERS[i].u.trim()===u&&USERS[i].p===p){a=USERS[i];break}}
if(!a){$('#loginErr').classList.add('show');var c=$('#loginCard');c.classList.remove('shake');void c.offsetWidth;c.classList.add('shake');return}
$('#loginErr').classList.remove('show');session={name:a.name,role:a.role};sessionStorage.setItem(SS_SESS,JSON.stringify(session));enterApp();showToast('مرحبًا '+a.name+' 👋',false,1800)};
$('#logoutBtn').onclick=function(){sessionStorage.removeItem(SS_SESS);location.reload()};
function enterApp(){$('#loginView').style.display='none';$('#appView').hidden=false;
$('#uName').textContent=session.name;$('#uAvatar').textContent=session.name.slice(0,1);
$('#uRole').textContent=session.role==='admin'?'مدير':'مستخدم';
$$('.admin-only').forEach(function(el){el.style.display=session.role==='admin'?'':'none'});
renderAll();
if(!(DB&&DB.records.length)){var last=localStorage.getItem(LS_LAST);if(last&&idbDB)openLocal(last)}}
/* ═══ رفع ملف ═══ */
var drop=$('#dropZone');
drop.onclick=function(){$('#fileInput').click()};
['dragover','dragenter'].forEach(function(ev){drop.addEventListener(ev,function(e){e.preventDefault();drop.classList.add('over')})});
['dragleave','drop'].forEach(function(ev){drop.addEventListener(ev,function(e){e.preventDefault();drop.classList.remove('over')})});
drop.addEventListener('drop',function(e){var f=e.dataTransfer.files[0];if(f)handleFile(f)});
$('#fileInput').onchange=function(e){var f=e.target.files[0];if(f){handleFile(f);e.target.value=''}};
function handleFile(file){if(!/\.(xlsm|xlsx|xls)$/i.test(file.name)){showToast('⚠️ اختر ملف إكسل .xlsm أو .xlsx',1);return}
if(session.role!=='admin'){showToast('رفع الملفات للمدير فقط',1);return}
var rd=new FileReader();rd.onload=function(){setActive(file.name,rd.result)};rd.readAsArrayBuffer(file)}
/* ═══ القراءة العميقة ═══ */
function setActive(name,buf){try{ACTIVE={name:name,blob:new Blob([buf])};localStorage.setItem(LS_LAST,name);
WB=XLSX.read(new Uint8Array(buf),{type:'array',cellDates:true});
var s=$('#sheetSel');s.innerHTML='';WB.SheetNames.forEach(function(n){s.add(new Option(n,n))});
parseSheet(pickSheet())}catch(e){showToast('تعذّر قراءة الملف',1)}}
function pickSheet(){var n=WB.SheetNames,i;
for(i=0;i<n.length;i++){if(n[i].indexOf('رصيد')===0)return n[i]}
for(i=0;i<n.length;i++){if(n[i].indexOf('رصيد')>=0)return n[i]}
if(n.indexOf('Sheet1')>=0)return 'Sheet1';return n[0]}
$('#sheetSel').addEventListener('change',function(e){parseSheet(e.target.value)});
function parseDate(v){if(v instanceof Date&&!isNaN(v))return dstr(v);
if(typeof v==='number'&&v>20000)return dstr(new Date(Math.round((v-25569)*86400000)));
var s=String(v==null?'':v).trim();if(!s)return null;
s=s.replace(/[٠-٩]/g,function(d){return '٠١٢٣٤٥٦٧٨٩'.indexOf(d)});
var m=s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);if(m)return m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0');
m=s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})/);if(m)return m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');
var d=new Date(s);return isNaN(d)?null:dstr(d)}
function parseAmount(v){if(typeof v==='number')return v;
var s=String(v==null?'':v).replace(/[٠-٩]/g,function(d){return '٠١٢٣٤٥٦٧٨٩'.indexOf(d)}).replace(/[^\d.\-]/g,'');
var n=parseFloat(s);return isNaN(n)?NaN:n}
function parseSheet(name){if(!WB||!WB.Sheets[name]){showToast('الورقة غير موجودة',1);return}
var RAW=XLSX.utils.sheet_to_json(WB.Sheets[name],{header:1,defval:null,raw:true})||[];
var HROW=-1,HEAD=[];
for(var r=0;r<RAW.length;r++){var row=RAW[r]||[],sc=0;
for(var c=0;c<row.length;c++){var v=String(row[c]==null?'':row[c]).trim();if(!v)continue;
if(/الوصول|الوصل/.test(v))sc++;
if(/التاريخ|^تاريخ$/i.test(v))sc++;
if(/الاسم|^اسم$/i.test(v))sc++;
if(/التفاصيل|البيان/.test(v))sc++;
if(/مبلغ\s*الصرف|الصرفيات/.test(v))sc++;
if(/مبلغ\s*(ال)?[أاإ]?يراد/.test(v))sc++}
if(sc>=3){HROW=r;break}}
var iS=-1,iR=-1,iD=-1,iN=-1,iDt=-1,iAO=-1,iAI=-1;
if(HROW>=0){HEAD=(RAW[HROW]||[]).map(function(x){return String(x==null?'':x).trim()});
var up=RAW[HROW-1]||[];
for(var i=0;i<HEAD.length;i++){var h=HEAD[i];
if(!h){var b=String(up[i]==null?'':up[i]).trim();if(b&&!/^\d[\d,.]*$/.test(b))h=b}
if(iS<0&&/^ت$|تسلسل/.test(h))iS=i;
if(iR<0&&/الوصول|الوصل|رقم.*وصل/.test(h))iR=i;
if(iD<0&&/التاريخ|^تاريخ$/i.test(h))iD=i;
if(iN<0&&/الاسم|^اسم$/i.test(h))iN=i;
if(iDt<0&&/التفاصيل|البيان|الوصف/.test(h))iDt=i;
if(iAO<0&&/مبلغ\s*الصرف|الصرفيات|صرف/.test(h))iAO=i;
if(iAI<0&&/مبلغ\s*(ال)?[أاإ]?يراد|ايرادات|إيراد/.test(h))iAI=i}}
else{iS=0;iR=1;iD=2;iN=3;iDt=4;iAO=5;iAI=6;HROW=2}
if(iD<0||iN<0||(iAO<0&&iAI<0)){showToast('لم يتم التعرف على أعمدة الورقة',1);return}
var records=[],lastDate=null;
for(var rr=HROW+1;rr<RAW.length;rr++){var rw=RAW[rr]||[];
var joined=rw.map(function(x){return String(x==null?'':x)}).join('|');
if(/التاريخ/.test(joined)&&/الاسم/.test(joined))continue;
var name=String(rw[iN]==null?'':rw[iN]).trim();
var details=iDt>=0?String(rw[iDt]==null?'':rw[iDt]).trim():'';
if(/اجمالي|إجمالي|مجموع|المجموع|total|رصيد/i.test(name)||/رصيد/i.test(details))continue;
var aO=iAO>=0?parseAmount(rw[iAO]):NaN,aI=iAI>=0?parseAmount(rw[iAI]):NaN;
if((isNaN(aO)||aO<=0)&&(isNaN(aI)||aI<=0))continue;
var date=parseDate(rw[iD]);
if(date)lastDate=date;else date=lastDate;
if(!date)continue;
if(!name)name='—';
var base={seq:iS>=0?String(rw[iS]==null?'':rw[iS]).trim():String(rr-HROW),receipt:iR>=0?String(rw[iR]==null?'':rw[iR]).trim():'',date:date,name:name,details:details};
if(!isNaN(aO)&&aO>0)records.push(Object.assign({},base,{amount:aO,type:'out'}));
if(!isNaN(aI)&&aI>0)records.push(Object.assign({},base,{amount:aI,type:'in'}))}
if(!records.length){showToast('لا بيانات صالحة في الورقة',1);return}
DB={records:records,meta:{file:ACTIVE?ACTIVE.name:'—',sheet:name,at:Date.now(),by:session?session.name:'—'}};
localStorage.setItem(LS_DATA,JSON.stringify(DB));
CUR_SHEET=name;$('#sheetSel').value=name;
var nIn=records.filter(function(x){return x.type==='in'}).length;
showToast('✓ '+records.length+' سجل من «'+name+'» ('+nIn+' إيراد / '+(records.length-nIn)+' صرف)',false,2400);
renderAll()}
/* نهاية الجزء الأول — انتظر «التالي» للجزء الثاني app2.js */
