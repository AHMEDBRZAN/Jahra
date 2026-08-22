/* ═══ app2.js — العرض والتفاصيل (v2.2) ═══ */
var GLBL={in:'الإيرادات',out:'الصرفيات',w:'سحب المبالغ'};
/* ═══ الفترة ═══ */
function seg(b){var p=b.parentElement;p.querySelectorAll('button').forEach(function(x){x.classList.remove('on')});b.classList.add('on')}
$('#segAll').onclick=function(){seg(this);$('#dayBox').classList.remove('show');$('#rangeBox').classList.remove('show');P={start:null,end:null};renderAll()};
$('#segDay').onclick=function(){seg(this);$('#dayBox').classList.add('show');$('#rangeBox').classList.remove('show');
if(!$('#dDay').value){var mx=maxDate();if(mx)$('#dDay').value=mx;}applyDay()};
function applyDay(){var d=$('#dDay').value;if(!d)return;P={start:d,end:d};renderAll()}
$('#dDay').onchange=applyDay;
$('#segRange').onclick=function(){seg(this);$('#rangeBox').classList.add('show');$('#dayBox').classList.remove('show');applyRange()};
function applyRange(){var a=$('#d1').value,b=$('#d2').value;if(!a||!b)return;P={start:a,end:b};renderAll()}
$('#d1').onchange=applyRange;$('#d2').onchange=applyRange;
function maxDate(){var mx=null;(DB&&DB.tx?DB.tx:[]).forEach(function(r){if(r.date&&(!mx||r.date>mx))mx=r.date});return mx}
function inP(d){if(!P.start||!P.end)return true;return d&&d>=P.start&&d<=P.end}
function periodLabel(){return P.start?(P.start===P.end?'اليوم: '+fmtD(P.start):'من '+fmtD(P.start)+' إلى '+fmtD(P.end)):'كامل الفترة'}
function filteredTx(){return (DB&&DB.tx?DB.tx:[]).filter(function(r){return inP(r.date)})}
function sumG(g){return filteredTx().filter(function(r){return r.group===g}).reduce(function(s,r){return s+r.amount},0)}
/* ═══ العرض ═══ */
function renderAll(){
var has=DB&&DB.tx&&DB.tx.length;
$('#heroCard').hidden=!has;$('#catsCard').hidden=!has;$('#noData').hidden=!!has;
if(!has){$('#fileInfo').hidden=true;$('#noDataTxt').textContent=session&&session.role==='admin'?'لا توجد بيانات — افتح الملف من GitHub أو من الحفظ المحلي':'لا توجد بيانات — بانتظار الملف';return}
renderFileInfo();renderHero();renderCats();
$('#plabel').textContent=periodLabel()}
function renderFileInfo(){$('#fileInfo').hidden=false;
$('#fiName').textContent=DB.meta.file;
$('#fiCount').textContent=DB.tx.length;
var d=new Date(DB.meta.at);$('#fiDate').textContent=fmtD(dstr(d))}
function renderHero(){var i=sumG('in'),o=sumG('out'),w=sumG('w');
$('#heroLbl').textContent='الصافي — '+periodLabel()+(ACTIVE?' · '+ACTIVE.name:'');
$('#heroNet').textContent=money(i-o-w);
$('#heroNet').style.color=(i-o-w)>=0?'var(--g6)':'var(--r6)';
$('#chipIn').textContent=money(i);$('#chipOut').textContent=money(o);$('#chipW').textContent=money(w)}
function renderCats(){var rows=filteredTx();var html='';
['in','out','w'].forEach(function(g){
var gt=rows.filter(function(r){return r.group===g});
if(!gt.length)return;
var tot=gt.reduce(function(s,r){return s+r.amount},0);
var cats={};gt.forEach(function(r){var k=r.cat||'بدون صنف';cats[k]=(cats[k]||0)+r.amount});
html+='<div class="cat-sec"><div class="cat-h '+g+'"><span>💠 '+GLBL[g]+'</span><span class="tot">'+money(tot)+' د.ع.</span></div>';
Object.keys(cats).sort(function(a,b){return cats[b]-cats[a]}).forEach(function(k){
var cnt=gt.filter(function(r){return (r.cat||'بدون صنف')===k}).length;
html+='<div class="cat-row" data-g="'+g+'" data-cat="'+esc(k)+'"><span class="n">'+esc(k)+' <span class="tag">('+cnt+' حركة)</span></span><span class="v '+g+'">'+money(cats[k])+'</span></div>'});
html+='</div>'});
$('#catsBox').innerHTML=html||'<div class="empty"><div class="ei">📭</div><p>لا حركات في هذه الفترة</p></div>'}
$('#catsBox').addEventListener('click',function(e){var r=e.target.closest('.cat-row');if(!r)return;openCat(r.getAttribute('data-g'),r.getAttribute('data-cat'))});
/* ═══ نافذة حركات الصنف ═══ */
var CURCAT=null;
function openCat(g,cat){CURCAT={g:g,cat:cat};
var rows=filteredTx().filter(function(r){return r.group===g&&(r.cat||'بدون صنف')===cat});
$('#catHead').style.background=g==='in'?'linear-gradient(135deg,#12503e,#177a54)':g==='out'?'linear-gradient(135deg,#7e2d1c,#b2472f)':'linear-gradient(135deg,#92610a,#c98f26)';
$('#catTitle').textContent=(g==='in'?'💰 ':g==='out'?'💸 ':' ')+cat+' — '+rows.length+' حركة';
$('#catBody').innerHTML=rows.map(function(r,i){return '<tr data-i="'+i+'"><td>'+esc(r.receipt||'—')+'</td><td style="direction:ltr">'+fmtD(r.date)+'</td><td>'+esc(r.name||'—')+'</td><td>'+esc(r.details||'—')+'</td><td><span class="amt">'+money(r.amount)+'</span></td></tr>'}).join('');
var tot=rows.reduce(function(s,r){return s+r.amount},0);
$('#catTotal').textContent=money(tot)+' د.ع.';
CURCAT.rows=rows;showOv($('#catOv'))}
$('#catX').onclick=function(){hideOv($('#catOv'))};
$('#catBody').addEventListener('click',function(e){var tr=e.target.closest('tr[data-i]');if(!tr||!CURCAT)return;openDetail(CURCAT.rows[+tr.getAttribute('data-i')])});
/* ═══ نافذة تفاصيل الحركة ═══ */
function openDetail(r){if(!r)return;
$('#detHead').style.background=r.group==='in'?'linear-gradient(135deg,#12503e,#177a54)':r.group==='out'?'linear-gradient(135deg,#7e2d1c,#b2472f)':'linear-gradient(135deg,#92610a,#c98f26)';
$('#detTitle').textContent=(r.group==='in'?'💰 إيراد':r.group==='out'?'💸 صرفية':'🏦 سحب')+' — '+r.cat;
$('#detBody').innerHTML=
'<div class="det-item"><small>التسلسل (ت)</small><b>'+esc(r.seq)+'</b></div>'+
'<div class="det-item"><small>رقم الوصل</small><b>'+esc(r.receipt||'—')+'</b></div>'+
'<div class="det-item"><small>التاريخ</small><b class="dt-ltr">'+fmtD(r.date)+'</b></div>'+
'<div class="det-item"><small>اليوم</small><b>'+wdLong(r.date)+'</b></div>'+
'<div class="det-item"><small>الصنف</small><b>'+esc(r.cat)+'</b></div>'+
'<div class="det-item"><small>الشهر</small><b>'+esc(r.month||'—')+'</b></div>'+
'<div class="det-item full"><small>الاسم</small><b>'+esc(r.name||'—')+'</b></div>'+
'<div class="det-item full"><small>التفاصيل</small><p>'+esc(r.details||'—')+'</p></div>'+
'<div class="det-item full"><small>الملاحظات</small><p>'+esc(r.note||'—')+'</p></div>'+
'<div class="det-item full"><small>المبلغ ('+CUR+')</small><b class="amt-big" style="color:'+(r.group==='in'?'var(--g6)':r.group==='out'?'var(--r6)':'var(--go6)')+'">'+money(r.amount)+' د.ع.</b></div>';
showOv($('#detOv'))}
$('#detX').onclick=function(){hideOv($('#detOv'))};
document.addEventListener('keydown',function(e){if(e.key==='Escape'){hideOv($('#detOv'));hideOv($('#catOv'))}});
/* ═══ تصدير CSV ═══ */
$('#csvBtn').onclick=function(){var rows=filteredTx();if(!rows.length){showToast('لا بيانات للتصدير',1);return}
var csv='\uFEFFت,الوصل,التاريخ,الصنف,الاسم,التفاصيل,الشهر,الملاحظات,المبلغ,المجموعة\n';
rows.forEach(function(r){csv+=[r.seq,r.receipt,fmtD(r.date),r.cat,r.name,r.details,r.month,r.note,r.amount,GLBL[r.group]].map(function(x){return '"'+String(x==null?'':x).replace(/"/g,'""')+'"'}).join(',')+'\n'});
var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
a.download='تقرير-'+periodLabel()+'.csv';a.click();showToast('تم التصدير ✓',false,1800)};
/* ═══ طباعة كشف كامل ═══ */
$('#printBtn').onclick=function(){var rows=filteredTx();if(!rows.length){showToast('لا بيانات للطباعة',1);return}
$('#catHead').style.background='linear-gradient(135deg,#0e3b2e,#147a54)';
$('#catTitle').textContent='🖨 كشف الحركات الكامل — '+periodLabel()+' ('+rows.length+' حركة)';
$('#catBody').innerHTML=rows.map(function(r){return '<tr><td>'+esc(r.receipt||'—')+'</td><td style="direction:ltr">'+fmtD(r.date)+'</td><td>'+esc(r.name||'—')+'</td><td>'+esc(r.cat)+' — '+esc(r.details||'')+'</td><td><span class="amt">'+money(r.amount)+'</span></td></tr>'}).join('');
$('#catTotal').textContent=money(rows.reduce(function(s,r){return s+r.amount},0))+' د.ع.';
$('#printHead').textContent='كشف حسابات المجمع — '+periodLabel()+' — المبالغ ('+CUR+')';
showOv($('#catOv'));setTimeout(function(){window.print()},350)};
/* ═══ مسح ══ */
$('#wipeBtn').onclick=function(){if(!confirm('سيتم مسح البيانات المحفوظة نهائيًا. متابعة؟'))return;
localStorage.removeItem(LS_DATA);DB=null;renderAll();showToast('تم المسح',false,1800)};
/* ═══ بدء التشغيل ═══ */
idb().then(function(){renderLocal()}).catch(function(){renderLocal()});
if(session)enterApp();
/* نهاية app2.js — v2.2 ✅ */
