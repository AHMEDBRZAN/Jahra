/* ═══ الجزء الثاني من app2.js ═══ */
/* ═══ أحداث العرض ═══ */
$('#tabIn').onclick=function(){state.cat='in';renderAll()};
$('#tabOut').onclick=function(){state.cat='out';renderAll()};
$$('.pill').forEach(function(p){p.onclick=function(){state.range=p.dataset.range;renderAll()}});
$('#monthInput').value=state.month;
$('#monthInput').onchange=function(e){state.month=e.target.value||ym(new Date());renderAll()};
$('#dayInput').value=state.day;
$('#dayInput').onchange=function(e){state.day=e.target.value||dstr(new Date());renderAll()};
$('#dayToday').onclick=function(){state.day=TODAY;$('#dayInput').value=TODAY;renderAll()};
/* ═══ البحث ═══ */
var sIn=$('#searchIn');
sIn.addEventListener('input',function(){state.q=sIn.value.trim();$('#searchClear').classList.toggle('show',state.q.length>0);clearTimeout(searchTimer);searchTimer=setTimeout(renderTable,180)});
sIn.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();sIn.blur()}if(e.key==='Escape'){sIn.value='';state.q='';sIn.blur();$('#searchClear').classList.remove('show');renderTable()}});
$('#searchClear').onclick=function(){sIn.value='';state.q='';sIn.focus();$('#searchClear').classList.remove('show');renderTable()};
document.addEventListener('click',function(e){if(!e.target.closest('.search')&&document.activeElement===sIn)sIn.blur()});
/* ═══ التفاصيل عند النقر ═══ */
$('#tbody').addEventListener('click',function(e){var tr=e.target.closest('tr[data-i]');if(!tr)return;openDetail(VIEW_ROWS[+tr.dataset.i])});
function openDetail(r){if(!r)return;
$('#detHead').style.background=r.type==='in'?'linear-gradient(135deg,#12503e,#177a54)':'linear-gradient(135deg,#7e2d1c,#b2472f)';
$('#detTitle').textContent=(r.type==='in'?'💰 إيراد':'💸 صرفية')+(r.receipt?' — وصل '+r.receipt:'');
$('#detBody').innerHTML=
 '<div class="det-item"><small>التسلسل (ت)</small><b>'+esc(r.seq)+'</b></div>'+
 '<div class="det-item"><small>رقم الوصول</small><b>'+esc(r.receipt||'—')+'</b></div>'+
 '<div class="det-item"><small>التاريخ</small><b class="dt-ltr">'+fmtD(r.date)+'</b></div>'+
 '<div class="det-item"><small>اليوم</small><b>'+wdLong(r.date)+'</b></div>'+
 '<div class="det-item full"><small>الاسم</small><b>'+esc(r.name||'—')+'</b></div>'+
 '<div class="det-item full"><small>المبلغ — '+(r.type==='in'?'إيراد':'صرف')+'</small><b class="amt-big" style="color:'+(r.type==='in'?'var(--g6)':'var(--r6)')+'">'+money(r.amount,false)+'<span class="cur">'+CUR+'</span></b></div>'+
 '<div class="det-item full"><small>التفاصيل الكاملة</small><p>'+(esc(r.details)||'لا توجد تفاصيل.')+'</p></div>';
showOv($('#detOv'))}
$('#detX').onclick=$('#detClose').onclick=function(){hideOv($('#detOv'))};
document.addEventListener('keydown',function(e){if(e.key==='Escape')hideOv($('#detOv'))});
/* ═══ فلاتر ═══ */
function inRange(d){
 if(state.range==='today')return d===TODAY;
 if(state.range==='day')return d===state.day;
 if(state.range==='week'){var ws=dstr(startOfWeek(new Date()));return d>=ws&&d<=TODAY;}
 return d.startsWith(state.month)}
function sumWhere(fn){return (DB&&DB.records?DB.records:[]).filter(fn).reduce(function(s,r){return s+r.amount},0)}
/* ═══ العرض ═══ */
function renderAll(){
 var has=DB&&DB.records&&DB.records.length;
 $('#dashArea').hidden=!has;$('#noData').hidden=!!has;
 if(!has){$('#fileInfo').hidden=true;
  $('#noDataTxt').textContent=session&&session.role==='admin'?'لا توجد بيانات — ارفع ملف الإكسل للبدء':'لا توجد بيانات — بانتظار رفع الملف';return}
 renderFileInfo();renderTabs();renderPills();renderCaption();renderTable()}
function renderFileInfo(){
 $('#fileInfo').hidden=false;
 $('#fiName').textContent=DB.meta.file;
 var nIn=DB.records.filter(function(r){return r.type==='in'}).length;
 $('#fiCount').textContent=DB.records.length;
 $('#fiIn').textContent=nIn+' إيراد';$('#fiOut').textContent=(DB.records.length-nIn)+' صرف';
 var d=new Date(DB.meta.at);
 $('#fiDate').textContent=fmtD(dstr(d))+' '+d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
 $('#fiBy').textContent='· بواسطة: '+DB.meta.by}
function renderTabs(){
 var tIn=sumWhere(function(r){return r.type==='in'&&r.date===TODAY}),tOut=sumWhere(function(r){return r.type==='out'&&r.date===TODAY});
 $('#tbIn').textContent='اليوم: '+money(tIn,false)+' '+CUR;
 $('#tbOut').textContent='اليوم: '+money(tOut,false)+' '+CUR;
 $('#tabIn').className='tab'+(state.cat==='in'?' on-in':'');
 $('#tabOut').className='tab'+(state.cat==='out'?' on-out':'');
 $('#subbar').classList.toggle('out',state.cat==='out');
 $('#thAmt').innerHTML=(state.cat==='in'?'مبلغ الإيراد':'مبلغ الصرف')+' <span style="font-size:11px;color:var(--mut);font-weight:600">('+CUR+')</span>'}
function inRangeW(d){var ws=dstr(startOfWeek(new Date()));return d>=ws&&d<=TODAY}
function renderPills(){
 var c=state.cat;
 setNum('#pToday',sumWhere(function(r){return r.type===c&&r.date===TODAY}));
 setNum('#pDay',sumWhere(function(r){return r.type===c&&r.date===state.day}));
 setNum('#pWeek',sumWhere(function(r){return r.type===c&&inRangeW(r.date)}));
 setNum('#pMonth',sumWhere(function(r){return r.type===c&&r.date.startsWith(state.month)}));
 $$('.pill').forEach(function(p){p.classList.toggle('on',p.dataset.range===state.range)});
 $('#monthPick').classList.toggle('show',state.range==='month');
 $('#dayPick').classList.toggle('show',state.range==='day')}
function renderCaption(){
 var per='',c=state.cat==='in'?'الإيرادات':'الصرفيات';
 if(state.range==='today')per=wdLong(TODAY)+' <span class="dt">'+fmtD(TODAY)+'</span>';
 else if(state.range==='day')per=wdLong(state.day)+' <span class="dt">'+fmtD(state.day)+'</span>'+(state.day===TODAY?' <span style="color:var(--g6);font-size:11px">(اليوم)</span>':'');
 else if(state.range==='week'){var ws=dstr(startOfWeek(new Date()));per='من <span class="dt">'+fmtD(ws)+'</span> إلى <span class="dt">'+fmtD(TODAY)+'</span>';}
 else per='الشهر <span class="dt">'+state.month.split('-')[1]+'-'+state.month.split('-')[0]+'</span>';
 $('#capTitle').innerHTML='<b>'+c+'</b> — '+per}
function renderTable(){
 if(!(DB&&DB.records))return;
 var nq=norm(state.q);
 VIEW_ROWS=DB.records.filter(function(r){
  if(r.type!==state.cat||!inRange(r.date))return false;
  if(!nq)return true;
  return norm(r.name).indexOf(nq)>=0||norm(r.details).indexOf(nq)>=0||
         norm(r.receipt).indexOf(nq)>=0||norm(r.seq).indexOf(nq)>=0||
         norm(String(Math.round(r.amount))).indexOf(nq)>=0});
 var tb=$('#tbody');
 if(!VIEW_ROWS.length){tb.innerHTML='<tr style="cursor:default"><td colspan="3"><div class="empty"><div class="ei">📭</div><p>لا توجد سجلات في هذه الفترة</p><small>'+(state.q?'جرّب كلمة بحث أخرى':'غيّر الفترة')+'</small></div></td></tr>';}
 else tb.innerHTML=VIEW_ROWS.map(function(r,i){
  return '<tr class="'+(r.type==='in'?'in-row':'out-row')+'" data-i="'+i+'" style="animation-delay:'+Math.min(i*22,400)+'ms">'+
   '<td><span class="rcpt">'+hi(r.receipt||'—',state.q)+'</span></td>'+
   '<td class="nm" title="'+esc(r.name)+'">'+hi(r.name,state.q)+'</td>'+
   '<td><span class="amt">'+money(r.amount,true)+'</span></td></tr>'}).join('');
 var total=VIEW_ROWS.reduce(function(s,r){return s+r.amount},0);
 $('#ftCount').textContent=VIEW_ROWS.length;
 setNum('#ftTotal',total);
 $('#capCount').textContent='عدد الوصلات: '+VIEW_ROWS.length+(state.q?' (بحث)':'')}
/* ═══ تصدير CSV ═══ */
$('#csvBtn').onclick=function(){
 if(!VIEW_ROWS.length){showToast('لا توجد بيانات للتصدير',1);return}
 var csv='\uFEFFت,الوصول,التاريخ,الاسم,التفاصيل,المبلغ ('+CUR+'),النوع,الورقة\n';
 VIEW_ROWS.forEach(function(r){csv+=[r.seq,r.receipt,fmtD(r.date),r.name,r.details,r.amount,r.type==='in'?'إيراد':'صرف',DB.meta.sheet||''].map(function(x){return '"'+String(x==null?'':x).replace(/"/g,'""')+'"'}).join(',')+'\n'});
 var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
 a.download=(state.cat==='in'?'ايرادات':'صرفيات')+'-'+state.range+'.csv';a.click();showToast('تم التصدير ✓',false,1800)};
/* ═══ طباعة ═══ */
$('#printBtn').onclick=function(){
 if(!VIEW_ROWS.length){showToast('لا توجد بيانات للطباعة',1);return}
 $('#printHead').textContent='كشف '+(state.cat==='in'?'الإيرادات':'الصرفيات')+' — '+$('#capTitle').textContent.replace(/<[^>]+>/g,'')+' — الورقة: '+(DB.meta.sheet||'')+'  ('+CUR+')';
 window.print()};
/* ═══ مسح البيانات ═══ */
$('#wipeBtn').onclick=function(){
 if(!confirm('سيتم مسح جميع البيانات المحفوظة. هل أنت متأكد؟'))return;
 localStorage.removeItem(LS_DATA);DB=null;renderAll();showToast('تم مسح البيانات',false,1800)};
/* ═══ بدء التشغيل ═══ */
idb().then(function(){renderLocal()}).catch(function(){renderLocal()});
if(session)enterApp();
