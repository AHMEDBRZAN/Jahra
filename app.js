/* ═══ إعدادات ═══ */
var USERS=[{u:'حسين',p:'1979',role:'admin',name:'حسين'},{u:'مستخدم',p:'1234',role:'user',name:'مستخدم'}];
var CUR='د.ع.';
var REPO='AHMEDBRZAN/Jahra';
var KNOWN=['حسابات شركة الجوهرة 2026.xlsm']; /* أضف هنا اسم أي ملف جديد ترفعه للمستودع */
var VERSION='v2.2';
var LS_DATA='cmpx_v20',SS_SESS='cmpx_sess_v20',LS_LAST='cmpx_last_v20';
function $(s){return document.querySelector(s)}
function $$(s){return Array.prototype.slice.call(document.querySelectorAll(s))}
var DB=JSON.parse(localStorage.getItem(LS_DATA)||'null');
var session=JSON.parse(sessionStorage.getItem(SS_SESS)||'null');
var P={start:null,end:null};
var WB=null,ACTIVE=null,CUR_SHEET='',GITFILES=[],idbDB=null;
/* ═══ أدوات ═══ */
function ym(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}
function dstr(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
var TODAY=dstr(new Date());
function fmtD(iso){if(!iso)return '—';var p=iso.split('-');return p[2]+'-'+p[1]+'-'+p[0]}
function money(n){return (Number(n)||0).toLocaleString('en-US',{maximumFractionDigits:2})}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function wdLong(ds){try{return new Intl.DateTimeFormat('ar',{weekday:'long'}).format(new Date(ds+'T00:00:00'))}catch(e){return ''}}
function showOv(el){el.classList.add('show');document.body.classList.add('locked')}
function hideOv(el){el.classList.remove('show');if(!document.querySelector('.ov.show'))document.body.classList.remove('locked')}
var toastTimer=null;
function showToast(msg,err,dur){dur=dur||2200;var t=$('#toast');$('#toastMsg').textContent=msg;t.classList.toggle('err',!!err);t.querySelector('.prog').style.animationDuration=dur+'ms';t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(function(){t.classList.remove('show')},dur)}
function tick(){var n=new Date();$('#clockNow').textContent=n.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});$('#dateNow').textContent=wdLong(dstr(n))+' '+fmtD(dstr(n))}
tick();setInterval(tick,20000);
/* ═══ إظهار الإصدار ═══ */
(function(){var b=document.querySelector('.brand small');if(b)b.innerHTML+=' · <b style="color:var(--go)">'+VERSION+'</b>';
var l=document.querySelector('.l-top p');if(l)l.textContent+=' · '+VERSION;
var c=document.querySelector('.credits');if(c)c.textContent+=' · '+VERSION;})();
/* ═══ حفظ محلي IndexedDB (الأساسي) ═══ */
function idb(){return new Promise(function(res,rej){var q=indexedDB.open('cx-save2',1);q.onupgradeneeded=function(e){e.target.result.createObjectStore('save',{keyPath:'name'})};q.onsuccess=function(e){idbDB=e.target.result;res()};q.onerror=function(){rej(q.error)}})}
function putLocal(name,blob){return new Promise(function(res,rej){if(!idbDB)return rej();var tx=idbDB.transaction('save','readwrite');tx.objectStore('save').put({name:name,blob:blob,ts:Date.now()});tx.oncomplete=res;tx.onerror=rej})}
function getLocal(name){return new Promise(function(res,rej){var tx=idbDB.transaction('save','readonly');var q=tx.objectStore('save').get(name);q.onsuccess=function(){res(q.result)};q.onerror=rej})}
function allLocal(){return new Promise(function(res,rej){var tx=idbDB.transaction('save','readonly');var q=tx.objectStore('save').getAll();q.onsuccess=function(){res(q.result||[])};q.onerror=rej})}
function delLocal(name){return new Promise(function(res,rej){var tx=idbDB.transaction('save','readwrite');tx.objectStore('save').delete(name);tx.oncomplete=res;tx.onerror=rej})}
function renderLocal(){if(!idbDB){$('#locList').innerHTML='<span class="tag">التخزين غير متاح</span>';return}
allLocal().then(function(list){list.sort(function(a,b){return (b.ts||0)-(a.ts||0)});
$('#locList').innerHTML=list.map(function(r){var d=r.ts?new Date(r.ts):null;
return '<div class="fchip local"><b>📍 '+esc(r.name)+(d?' <span class="tag">('+fmtD(dstr(d))+')</span>':'')+'</b>'+
'<span style="display:flex;gap:4px;flex-shrink:0">'+
'<button class="btn-mini" data-loc="'+esc(r.name)+'">فتح</button>'+
'<button class="btn-mini" data-ren="'+esc(r.name)+'" title="تغيير الاسم">✏️</button>'+
'<button class="btn-mini" data-del="'+esc(r.name)+'" title="حذف" style="color:var(--r6)">🗑</button>'+
'</span></div>'}).join('')||'<span class="tag">لا حفظ محلي بعد</span>'})}
function openLocal(name){getLocal(name).then(function(rec){if(!rec)return;rec.blob.arrayBuffer().then(function(buf){setActive(rec.name,buf,false)});localStorage.setItem(LS_LAST,name);$('#fs').textContent='📍 محمّل من الحفظ المحلي: '+name})}
function renLocal(oldName){var nn=prompt('الاسم الجديد للملف:',oldName);if(!nn)return;nn=nn.trim();if(!nn||nn===oldName)return;
getLocal(oldName).then(function(rec){if(!rec)return;
putLocal(nn,rec.blob).then(function(){return delLocal(oldName)}).then(function(){
if(ACTIVE&&ACTIVE.name===oldName){ACTIVE.name=nn;if(DB){DB.meta.file=nn;localStorage.setItem(LS_DATA,JSON.stringify(DB))}}
if(localStorage.getItem(LS_LAST)===oldName)localStorage.setItem(LS_LAST,nn);
renderLocal();showToast('✏️ صار الاسم: '+nn,false,1800)})})}
function delLocalConfirm(name){if(!confirm('حذف الملف المحفوظ «'+name+'» نهائيًا؟'))return;
delLocal(name).then(function(){
if(localStorage.getItem(LS_LAST)===name)localStorage.removeItem(LS_LAST);
renderLocal();showToast('🗑 تم الحذف',false,1500)})}
$('#saveBtn').onclick=function(){if(!ACTIVE){showToast('افتح ملفًا أولًا ثم اضغط 💾',1);return}
putLocal(ACTIVE.name,ACTIVE.blob).then(function(){renderLocal();showToast('💾 أصبح الملف محليًا أساسيًا',false,1800)}).catch(function(){showToast('التخزين غير متاح',1)})};
$('#locList').addEventListener('click',function(e){
var b=e.target.closest('[data-loc]');if(b){openLocal(b.getAttribute('data-loc'));return}
var r=e.target.closest('[data-ren]');if(r){renLocal(r.getAttribute('data-ren'));return}
var d=e.target.closest('[data-del]');if(d){delLocalConfirm(d.getAttribute('data-del'));return}});
/* ═══ GitHub — تحميل مباشر بدون API ═══ */
function loadByName(name,upd){var parts=REPO.split('/');showToast('⏳ تحميل '+name+'…',false,1500);
function tb(b){return fetch('https://raw.githubusercontent.com/'+parts[0]+'/'+parts[1]+'/'+b+'/'+encodeURIComponent(name)).then(function(r){if(!r.ok)throw 0;return r.arrayBuffer()})}
tb('main').catch(function(){return tb('master')}).then(function(buf){
setActive(name,buf,true);showToast(upd?'🔄 تم التحديث والحفظ محليًا ✓':'✅ فُتح وحُفظ محليًا',false,2200)})
.catch(function(){showToast('فشل التحميل المباشر — تأكد أن الملف بالمستودع',1)})}
function refreshGit(){
if(ACTIVE)loadByName(ACTIVE.name,true);
if(REPO.indexOf('USERNAME')===0){$('#gitList').innerHTML='<span class="tag">ضع مستودعك في الكود</span>';return}
$('#gitList').innerHTML='<span class="tag">⏳ جلب القائمة…</span>';
fetch('https://api.github.com/repos/'+REPO+'/contents/?t='+Date.now()).then(function(r){if(!r.ok)throw new Error(r.status);return r.json()}).then(function(list){
GITFILES=list.filter(function(x){return /\.(xlsx|xlsm|xls)$/i.test(x.name)});
localStorage.setItem('cmpx_gitlist',JSON.stringify(GITFILES.map(function(f){return f.name})));
renderGit()}).catch(function(e){
var c=JSON.parse(localStorage.getItem('cmpx_gitlist')||'[]');
if(c.length){GITFILES=c.map(function(n){return{name:n}});renderGit()}
else {GITFILES=KNOWN.map(function(n){return{name:n}});renderGit()}})}
function renderGit(){$('#gitList').innerHTML=GITFILES.map(function(f,i){return '<div class="fchip"><b>📄 '+esc(f.name)+'</b><button class="btn-mini" data-git="'+i+'">فتح</button></div>'}).join('')||'<span class="tag">لا ملفات إكسل</span>'}
function openGit(i,upd){if(GITFILES[i])loadByName(GITFILES[i].name,upd)}
$('#gitBtn').onclick=refreshGit;
$('#gitList').addEventListener('click',function(e){var b=e.target.closest('[data-git]');if(b)openGit(+b.getAttribute('data-git'),false)});
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
if(!(DB&&DB.tx&&DB.tx.length)){var last=localStorage.getItem(LS_LAST);if(last&&idbDB)openLocal(last)}}
/* ═══ قراءة ورقة Company accounts ═══ */
function setActive(name,buf,save){try{ACTIVE={name:name,blob:new Blob([buf])};localStorage.setItem(LS_LAST,name);
WB=XLSX.read(new Uint8Array(buf),{type:'array',cellDates:true});
var s=$('#sheetSel');s.innerHTML='';WB.SheetNames.forEach(function(n){s.add(new Option(n,n))});
parseSheet(pickSheet());
if(save)putLocal(name,ACTIVE.blob).then(renderLocal).catch(function(){});
}catch(e){showToast('تعذّر قراءة الملف',1)}}
function pickSheet(){var n=WB.SheetNames,i;
for(i=0;i<n.length;i++){if(/company/i.test(n[i]))return n[i]}
for(i=0;i<n.length;i++){if(n[i].indexOf('حسابات')>=0)return n[i]}
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
function groupOf(cat){cat=String(cat||'');
if(/سحب/.test(cat))return 'w';
if(/قبض|دفعات المستفيدين|تنازل|ايراد|إيراد/.test(cat))return 'in';
return 'out'}
function parseSheet(name){if(!WB||!WB.Sheets[name]){showToast('الورقة غير موجودة',1);return}
var RAW=XLSX.utils.sheet_to_json(WB.Sheets[name],{header:1,defval:null,raw:true})||[];
var HROW=-1,HEAD=[];
for(var r=0;r<Math.min(30,RAW.length);r++){var row=RAW[r]||[],sc=0;
for(var c=0;c<row.length;c++){var v=String(row[c]==null?'':row[c]).trim();if(!v)continue;
if(/رقم\s*الوصل|الوصل/.test(v))sc++;
if(/التاريخ/.test(v))sc++;
if(/الصنف/.test(v))sc++;
if(/الاسم/.test(v))sc++;
if(/المبلغ/.test(v))sc++}
if(sc>=3){HROW=r;HEAD=row.map(function(x){return String(x==null?'':x).trim()});break}}
var iQ=-1,iR=-1,iD=-1,iC=-1,iN=-1,iDt=-1,iM=-1,iNo=-1,iA=-1;
if(HROW>=0){for(var i=0;i<HEAD.length;i++){var h=HEAD[i];
if(iQ<0&&/^ت$|تسلسل/.test(h))iQ=i;
if(iR<0&&/رقم\s*الوصل|الوصل/.test(h))iR=i;
if(iD<0&&/التاريخ/.test(h))iD=i;
if(iC<0&&/الصنف/.test(h))iC=i;
if(iN<0&&/الاسم/.test(h))iN=i;
if(iDt<0&&/التفاصيل/.test(h))iDt=i;
if(iM<0&&/الشهر/.test(h))iM=i;
if(iNo<0&&/الملاحظات|ملاحظة/.test(h))iNo=i;
if(iA<0&&/المبلغ/.test(h))iA=i}}
else{iQ=0;iR=1;iD=2;iC=3;iN=4;iDt=5;iM=6;iNo=7;iA=8;HROW=1}
if(iA<0||iC<0){showToast('لم يتم التعرف على أعمدة الورقة (تحتاج: الصنف، المبلغ)',1);return}
var tx=[],lastDate=null;
for(var rr=HROW+1;rr<RAW.length;rr++){var rw=RAW[rr]||[];
var cat=String(rw[iC]==null?'':rw[iC]).trim();
var amount=parseAmount(rw[iA]);
if(isNaN(amount)||amount===0)continue;
var name=iN>=0?String(rw[iN]==null?'':rw[iN]).trim():'';
if(/اجمالي|إجمالي|مجموع|المجموع|total|رصيد/i.test(cat)||/اجمالي|إجمالي|مجموع|المجموع|total|رصيد/i.test(name))continue;
var date=iD>=0?parseDate(rw[iD]):null;
if(date)lastDate=date;else date=lastDate;
tx.push({seq:iQ>=0?String(rw[iQ]==null?'':rw[iQ]).trim():String(rr-HROW),
receipt:iR>=0?String(rw[iR]==null?'':rw[iR]).trim():'',
date:date,cat:cat,name:name,
details:iDt>=0?String(rw[iDt]==null?'':rw[iDt]).trim():'',
month:iM>=0?String(rw[iM]==null?'':rw[iM]).trim():'',
note:iNo>=0?String(rw[iNo]==null?'':rw[iNo]).trim():'',
amount:amount,group:groupOf(cat)})}
if(!tx.length){showToast('لا حركات صالحة في الورقة',1);return}
DB={tx:tx,meta:{file:ACTIVE?ACTIVE.name:'—',sheet:name,at:Date.now(),by:session?session.name:'—'}};
localStorage.setItem(LS_DATA,JSON.stringify(DB));
CUR_SHEET=name;$('#sheetSel').value=name;
showToast('✓ '+tx.length+' حركة من «'+name+'»',false,2400);
renderAll()}
/* نهاية app.js — v2.2 ✅ */
