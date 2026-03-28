let hourChart, platformChart, mentionChart;

function upsertChart(instance, ctx, config){
  if(instance){
    instance.data = config.data;
    instance.options = config.options;
    instance.update();
    return instance;
  }
  return new Chart(ctx, config);
}

async function run(){
  const res = await fetch('./data.json?t='+Date.now());
  const d = await res.json();
  const m = d.metrics || {};

  document.getElementById('updated').textContent = '更新時間：' + new Date(d.generated_at).toLocaleString('zh-TW',{hour12:false});
  document.getElementById('total24').textContent = m.total_24h ?? '-';
  document.getElementById('prev24').textContent = m.prev_24h ?? '-';
  document.getElementById('growth').textContent = m.growth_pct==null ? '-' : `${m.growth_pct}%`;
  document.getElementById('news24').textContent = m.news_24h ?? '-';

  const level = (m.anomaly||{}).level || '綠';
  const light = document.getElementById('light');
  light.innerHTML = `<span class="badge ${level}">${level}</span>`;

  const cmp = d.mention_compare_24h || {};
  const z = cmp['張嘉郡']||0;
  const l = cmp['劉建國']||0;
  document.getElementById('compare').textContent = `張嘉郡：${z} ｜ 劉建國：${l}`;

  const ul = document.getElementById('platforms'); ul.innerHTML='';
  (d.by_platform||[]).forEach(x=>{
    const li=document.createElement('li');
    li.textContent=`${x.platform}: ${x.count}`;
    ul.appendChild(li);
  });

  const news = document.getElementById('news'); news.innerHTML='';
  (d.top_news||[]).slice(0,12).forEach(x=>{
    const li=document.createElement('li');
    const a=document.createElement('a');
    a.href=x.url; a.target='_blank'; a.rel='noopener';
    a.textContent=(x.title || x.url) + (x.time ? `（${x.time.slice(11,16)}）` : '');
    li.appendChild(a);
    news.appendChild(li);
  });

  const platformDetail = document.getElementById('platformDetail');
  if(platformDetail){
    platformDetail.innerHTML='';
    const map = d.latest_by_platform_24h || {};
    Object.keys(map).forEach(p=>{
      const box=document.createElement('div');
      box.className='platform-box';
      const h=document.createElement('h3');
      h.textContent=`${p}（${(map[p]||[]).length} 筆）`;
      box.appendChild(h);

      const ol=document.createElement('ol');
      (map[p]||[]).forEach(x=>{
        const li=document.createElement('li');
        const a=document.createElement('a');
        a.href=x.url; a.target='_blank'; a.rel='noopener';
        a.textContent=(x.title || x.url) + (x.time ? `（${x.time.slice(5,16)}）` : '');
        li.appendChild(a);
        ol.appendChild(li);
      });
      box.appendChild(ol);
      platformDetail.appendChild(box);
    });
  }

  function renderList(elId, arr){
    const el=document.getElementById(elId);
    if(!el) return;
    el.innerHTML='';
    (arr||[]).forEach(x=>{
      const li=document.createElement('li');
      const a=document.createElement('a');
      a.href=x.url; a.target='_blank'; a.rel='noopener';
      a.textContent=(x.title || x.url) + (x.time ? `（${x.time.slice(5,16)}）` : '');
      li.appendChild(a);
      el.appendChild(li);
    });
  }

  const ps = d.person_sections || {};
  renderList('zhangFb', (ps['張嘉郡']||{}).facebook || []);
  renderList('zhangNews', (ps['張嘉郡']||{}).news || []);
  renderList('liuFb', (ps['劉建國']||{}).facebook || []);
  renderList('liuNews', (ps['劉建國']||{}).news || []);

  // 24h 聲量趨勢
  const hourLabels=(d.by_hour||[]).map(x=> (x.hour||'').slice(11,16));
  const hourCounts=(d.by_hour||[]).map(x=> x.count||0);
  hourChart = upsertChart(hourChart, document.getElementById('hourChart'), {
    type:'line',
    data:{
      labels:hourLabels,
      datasets:[{label:'mentions', data:hourCounts, borderColor:'#7fc0ff', backgroundColor:'rgba(127,192,255,0.2)', tension:0.25, fill:true}]
    },
    options:{plugins:{legend:{display:false}}, scales:{x:{ticks:{color:'#b9c3f2'}}, y:{ticks:{color:'#b9c3f2'}}}}
  });

  // 平台分布
  const pLabels=(d.by_platform||[]).map(x=>x.platform);
  const pCounts=(d.by_platform||[]).map(x=>x.count);
  platformChart = upsertChart(platformChart, document.getElementById('platformChart'), {
    type:'doughnut',
    data:{
      labels:pLabels,
      datasets:[{data:pCounts, backgroundColor:['#4f8cff','#20c997','#ffc107','#e83e8c','#fd7e14','#6f42c1','#adb5bd']}]
    },
    options:{plugins:{legend:{labels:{color:'#b9c3f2'}}}}
  });

  // 人物提及
  mentionChart = upsertChart(mentionChart, document.getElementById('mentionChart'), {
    type:'bar',
    data:{
      labels:['張嘉郡','劉建國'],
      datasets:[{data:[z,l], backgroundColor:['#20c997','#4f8cff']}]
    },
    options:{plugins:{legend:{display:false}}, scales:{x:{ticks:{color:'#b9c3f2'}}, y:{ticks:{color:'#b9c3f2'}}}}
  });

}

function initCollapsibles(){
  document.querySelectorAll('.panel-toggle').forEach(btn=>{
    if(btn.dataset.bound==='1') return;
    btn.dataset.bound='1';
    btn.addEventListener('click', ()=>{
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      const panel = btn.closest('.collapsible');
      if(panel) panel.classList.toggle('collapsed', expanded);
    });
  });
}

run();
initCollapsibles();
setInterval(run,60000);
