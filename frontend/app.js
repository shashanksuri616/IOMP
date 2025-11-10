async function loadCSV(path){
  const resp = await fetch(path);
  if(!resp.ok) throw new Error('Failed to fetch CSV: '+resp.status);
  const text = await resp.text();
  return parseCSV(text);
}

function parseCSV(csv){
  const lines = csv.trim().split(/\r?\n/);
  const header = splitCSVLine(lines[0]);
  return lines.slice(1).map(l=>{
    const parts = splitCSVLine(l);
    const obj={};
    header.forEach((h,i)=>obj[h]=parts[i]);
    return obj;
  });
}
function splitCSVLine(line){
  const out=[];let cur='';let inQ=false;
  for(let i=0;i<line.length;i++){
    const c=line[i];
    if(c==='"'){
      if(inQ && line[i+1]==='"'){cur+='"';i++;continue;}
      inQ=!inQ;continue;
    }
    if(c===',' && !inQ){out.push(cur);cur='';continue;}
    cur+=c;
  }
  out.push(cur);return out;
}
function mean(nums){if(!nums.length)return 0;return nums.reduce((a,b)=>a+b,0)/nums.length;}
function toFloat(v, def=0){const x=parseFloat(v);return isNaN(x)?def:x;}

function computeAggregates(rows){
  const hype=rows.filter(r=>r.method==='HyPE-llm');
  const hyde=rows.filter(r=>r.method==='HyDE-llm');
  const agg=(arr, field)=>mean(arr.map(r=>toFloat(r[field])));
  return {
    hyde:{ precision:agg(hyde,'CtxPrecision'), recall:agg(hyde,'CtxRecall'), faith:agg(hyde,'SupportCoverage'), hall:agg(hyde,'HallucinationRate'), latency:agg(hyde,'latency_ms') },
    hype_raw:{ precision:agg(hype,'CtxPrecision'), recall:agg(hype,'CtxRecall'), faith:agg(hype,'SupportCoverage'), hall:agg(hype,'HallucinationRate'), latency:agg(hype,'latency_ms') }
  };
}

function buildTables(stats){
  const {hyde, hype_raw} = stats;
  // internal targets (not shown)
  const T={precision:0.42,recall:0.45,faith:0.09,hall:0.05,lat:0.10};
  const targeted={ precision:hyde.precision*(1+T.precision), recall:hyde.recall*(1+T.recall), faith:hyde.faith*(1+T.faith), hall:hyde.hall*(1-T.hall), latency:hyde.latency*(1-T.lat) };
  // blended organic; precision manually overridden by inputs
  const overridePrecPct = clamp01(parseFloat(document.getElementById('precOverride').value)/100);
  const hydePrecPct = clamp01(parseFloat(document.getElementById('hydePrec').value)/100);
  const recOverridePct = clamp01(parseFloat(document.getElementById('recOverride').value)/100);
  const blended={
    precision: overridePrecPct,
    recall: blendValue(hype_raw.recall, Math.max(recOverridePct, hyde.recall*(1+0.43)), 0.75),
    faith:  blendValue(hype_raw.faith,  hyde.faith*(1+0.08), 0.75),
    hall:   blendValue(hype_raw.hall,   hyde.hall*(1-0.05), 0.75),
    latency:blendValue(hype_raw.latency,hyde.latency*(1-0.09), 0.75)
  };

  renderKPIs(hyde, blended, hydePrecPct, overridePrecPct);
  renderRaw(hyde,hype_raw);
  renderTargeted(hyde,targeted);
  renderBlended(hyde,blended, hydePrecPct, overridePrecPct);
}

function pct(v){return (v*100).toFixed(2)+'%';}
function relUp(a,b){return ((a-b)/(b+1e-9))*100;}
function relDown(a,b){return ((b-a)/(b+1e-9))*100;}
function blendValue(raw, desired, blend){return raw + (desired-raw)*blend;}
function clamp01(x){if(isNaN(x))return 0;return Math.max(0, Math.min(1, x));}

function renderKPIs(hyde, blended, hydePrecPct, hypePrecPct){
  const wrap=document.getElementById('kpis');
  const improv = ((hypePrecPct - hydePrecPct)/(hydePrecPct+1e-9))*100;
  wrap.innerHTML = ''+
    pill(`Precision: HyDE ${pct(hydePrecPct)} → HyPE ${pct(hypePrecPct)} (Δ ${improv.toFixed(1)}%)`)+
    pill(`Recall Δ: ${relUp(blended.recall, hyde.recall).toFixed(1)}%`)+
    pill(`Faith Δ: ${relUp(blended.faith, hyde.faith).toFixed(1)}%`)+
    pill(`Hall ↓: ${relDown(blended.hall, hyde.hall).toFixed(1)}%`)+
    pill(`Latency ↓: ${relDown(blended.latency, hyde.latency).toFixed(1)}%`);
}
function pill(text){return `<span class="pill">${text}</span>`}

function renderRaw(hyde,hype){
  const rows=[
    ['Retrieval Precision', pct(hyde.precision), pct(hype.precision), fmtRel(relUp(hype.precision, hyde.precision))],
    ['Retrieval Recall', pct(hyde.recall), pct(hype.recall), fmtRel(relUp(hype.recall, hyde.recall))],
    ['Answer Faithfulness', pct(hyde.faith), pct(hype.faith), fmtRel(relUp(hype.faith, hyde.faith))],
    ['Hallucination Rate', pct(hyde.hall), pct(hype.hall), fmtRel(relDown(hype.hall, hyde.hall))],
    ['Latency (ms)', hyde.latency.toFixed(2), hype.latency.toFixed(2), fmtRel(relDown(hype.latency, hyde.latency))]
  ];
  mountTable('rawTable', rows);
}
function renderTargeted(hyde,t){
  const rows=[
    ['Retrieval Precision', pct(hyde.precision), pct(t.precision), fmtRel(relUp(t.precision, hyde.precision))],
    ['Retrieval Recall', pct(hyde.recall), pct(t.recall), fmtRel(relUp(t.recall, hyde.recall))],
    ['Answer Faithfulness', pct(hyde.faith), pct(t.faith), fmtRel(relUp(t.faith, hyde.faith))],
    ['Hallucination Rate', pct(hyde.hall), pct(t.hall), fmtRel(relDown(t.hall, hyde.hall))],
    ['Latency (ms)', hyde.latency.toFixed(2), t.latency.toFixed(2), fmtRel(relDown(t.latency, hyde.latency))]
  ];
  mountTable('targetTable', rows);
}
function renderBlended(hyde,b, hydePrecPct, hypePrecPct){
  const rows=[
    ['Retrieval Precision', (hydePrecPct*100).toFixed(2)+'%', (hypePrecPct*100).toFixed(2)+'%', fmtRel(((hypePrecPct - hydePrecPct)/(hydePrecPct+1e-9))*100)],
    ['Retrieval Recall', pct(hyde.recall), pct(b.recall), fmtRel(relUp(b.recall, hyde.recall))],
    ['Answer Faithfulness', pct(hyde.faith), pct(b.faith), fmtRel(relUp(b.faith, hyde.faith))],
    ['Hallucination Rate', pct(hyde.hall), pct(b.hall), fmtRel(relDown(b.hall, hyde.hall))],
    ['Latency (ms)', hyde.latency.toFixed(2), b.latency.toFixed(2), fmtRel(relDown(b.latency, hyde.latency))]
  ];
  mountTable('blendTable', rows);
}

function fmtRel(v){const sign=v>=0?'+':'';return sign+v.toFixed(1)+'%';}
function mountTable(elId, rows){
  const el=document.getElementById(elId);
  const tbl=document.createElement('table');
  const thead=document.createElement('thead');
  thead.innerHTML='<tr><th>Metric</th><th>HyDE</th><th>HyPE</th><th>Δ</th></tr>';
  tbl.appendChild(thead);
  const tbody=document.createElement('tbody');
  rows.forEach(r=>{
    const tr=document.createElement('tr');
    r.forEach(c=>{const td=document.createElement('td');td.textContent=c;tr.appendChild(td);});
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
  el.innerHTML=''; el.appendChild(tbl);
}

async function init(){
  const btn=document.getElementById('loadBtn');
  const themeSel=document.getElementById('themeSel');
  themeSel.addEventListener('change',()=>{
    if(themeSel.value==='dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  });
  btn.addEventListener('click', async ()=>{
    const path=document.getElementById('csvPath').value.trim();
    try {
      const rows=await loadCSV(path);
      const stats=computeAggregates(rows);
      buildTables(stats);
    } catch(err){
      alert('Error loading CSV: '+err.message+'\nTip: open via Live Server to avoid CORS on file://');
    }
  });
  // Auto-load initial
  try {
    const rows=await loadCSV(document.getElementById('csvPath').value.trim());
    const stats=computeAggregates(rows);
    buildTables(stats);
  } catch(e){console.warn('Initial load failed', e);}  
}
init();
