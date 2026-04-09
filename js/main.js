// ── NAVIGATION ──
function showHome() {
  document.getElementById('home-section').style.display = 'block';
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.static-page').forEach(p => p.style.display = 'none');
  document.querySelector('footer').style.display = 'block';
  history.pushState(null, '', window.location.pathname);
  window.scrollTo(0,0);
}

function showSection(name) {
  document.getElementById('home-section').style.display = 'none';
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.static-page').forEach(p => p.style.display = 'none');
  document.getElementById(name+'-section').classList.add('active');
  document.getElementById('nav-'+name).classList.add('active');
  document.querySelector('footer').style.display = 'block';
  history.pushState(null, '', '#'+name);
  window.scrollTo(0,0);
}

function showPage(name) {
  document.getElementById('home-section').style.display = 'none';
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.static-page').forEach(p => p.style.display = 'none');
  document.querySelector('footer').style.display = 'none';
  document.getElementById(name+'-page').style.display = 'block';
  if(name==='blog') { showBlogList(); document.getElementById('nav-blog').classList.add('active'); }
  history.pushState(null, '', '#'+name);
  window.scrollTo(0,0);
}

function showPost(slug) {
  document.getElementById('blog-list').style.display = 'none';
  document.querySelectorAll('.blog-post').forEach(p => p.classList.remove('active'));
  const post = document.getElementById('post-'+slug);
  if(post) post.classList.add('active');
  history.pushState(null, '', '#blog/'+slug);
  window.scrollTo(0,0);
}

function showBlogList() {
  document.getElementById('blog-list').style.display = 'block';
  document.querySelectorAll('.blog-post').forEach(p => p.classList.remove('active'));
  history.pushState(null, '', '#blog');
  window.scrollTo(0,0);
}

function showCalc(section, id, el) {
  document.querySelectorAll('#'+section+'-section .calc-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(section+'-'+id).classList.add('active');
  document.querySelectorAll('#'+section+'-section .sub-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  history.pushState(null, '', '#'+section+'/'+id);
}

// ── HANDLE BACK/FORWARD + PAGE LOAD ──
function routeFromHash() {
  const hash = window.location.hash.replace('#','');
  if(!hash) return;
  const parts = hash.split('/');
  const page = parts[0], sub = parts[1];
  const sections = ['solar','wind','salary','legal'];
  const pages = ['blog','about','privacy','disclaimer','terms','contact'];
  if(sections.includes(page)) {
    showSection(page);
    if(sub) {
      const tab = document.querySelector('#'+page+'-section .sub-tab');
      if(tab) {
        const btn = document.querySelector(`[onclick="showCalc('${page}','${sub}',this)"]`);
        if(btn) showCalc(page, sub, btn);
      }
    }
  } else if(page==='blog') {
    showPage('blog');
    if(sub) showPost(sub);
  } else if(pages.includes(page)) {
    showPage(page);
  }
}
window.addEventListener('popstate', routeFromHash);
window.addEventListener('load', routeFromHash);

// ── HELPERS ──
function fmt(n, dec=2) { return isNaN(n)||!isFinite(n) ? '—' : Number(n).toLocaleString('en-US',{maximumFractionDigits:dec, minimumFractionDigits:dec}); }
function fmtInt(n) { return isNaN(n)||!isFinite(n) ? '—' : Math.round(n).toLocaleString('en-US'); }

function buildResult(items, highlight='', hlClass='solar-hl') {
  let html = items.map(i => `<div class="result-item"><span class="result-label">${i.label}</span><span class="result-value" style="color:${i.color||'var(--text)'}">${i.value}</span></div>`).join('');
  if(highlight) html += `<div class="result-highlight ${hlClass}" style="margin-top:12px;font-size:0.85rem">${highlight}</div>`;
  return html;
}

function setResult(id, html) { document.getElementById(id).innerHTML = '<h3>Results</h3>' + html; }
function getVal(id) { return parseFloat(document.getElementById(id).value) || 0; }
function getStr(id) { return document.getElementById(id).value.trim(); }
function getSel(id) { return document.getElementById(id).value; }

// ── SOLAR CALCULATORS (Updated 2026 — Research Verified) ──
// Panel efficiency: modern monocrystalline 20-25% (avg 22%), high-end up to 25% — Source: PVEducation, Palmetto 2026
// PSH data: NREL NSRDB + 8MSolar 2026 guide + Global Solar Atlas
// System losses: inverter 95-98%, wiring 2-5%, soiling 2-5%, temp losses — total derate factor ~0.75-0.80

function calcS1() {
  const kwh = getVal('s1-kwh'), psh = parseFloat(getSel('s1-loc')), watt = getVal('s1-watt'), eff = getVal('s1-eff');
  if(!kwh||!watt||!eff) { setResult('res-s1','<div class="result-empty">Please fill all fields</div>'); return; }
  // Real-world derate: inverter(0.96) × wiring(0.98) × soiling(0.97) × temp(0.95) = ~0.87
  // Combined with panel efficiency
  const derateFactor = (eff/100) * 0.87;
  const dailyKwh = kwh/30;
  const panelOutput = (watt/1000) * psh * derateFactor;
  const panels = Math.ceil(dailyKwh/panelOutput);
  const totalKw = (panels*watt)/1000;
  // Standard panel size: 400W panel ≈ 1.76m² (1.722m × 1.025m)
  const panelArea = watt <= 300 ? 1.44 : watt <= 400 ? 1.76 : 2.0;
  const totalArea = panels * panelArea;
  setResult('res-s1', buildResult([
    {label:'Daily usage', value: fmt(dailyKwh,2)+' kWh'},
    {label:'Peak sun hours (PSH)', value: psh+' hrs/day'},
    {label:'Real-world derate factor', value: fmt(derateFactor*100,1)+'%'},
    {label:'Per panel output', value: fmt(panelOutput,3)+' kWh/day'},
    {label:'Panels needed', value: panels+' panels', color:'var(--solar2)'},
    {label:'Total system size', value: fmt(totalKw,2)+' kW', color:'var(--solar2)'},
    {label:'Total panel area', value: fmt(totalArea,1)+' m²'},
    {label:'Annual production est.', value: fmt(dailyKwh*365)+' kWh/yr'},
  ], `💡 ${panels} panels × ${watt}W = ${fmt(totalKw,2)} kW system. Real-world derate (inverter, wiring, soiling, temperature) applied.`, 'solar-hl'));
}

function calcS2() {
  const panels = getVal('s2-panels'), watt = getVal('s2-watt'), psh = parseFloat(getSel('s2-psh')), eff = getVal('s2-eff');
  if(!panels||!watt) { setResult('res-s2','<div class="result-empty">Please fill all fields</div>'); return; }
  // Real-world system efficiency includes panel eff + all losses
  const systemEff = (eff/100) * 0.87;
  const daily = (panels*watt/1000)*psh*systemEff;
  const monthly = daily*30.44, annual = daily*365.25;
  // Panel degradation: ~0.5%/yr (LID first year ~2%, then 0.5%/yr) — Source: NREL
  const yr10 = annual * Math.pow(0.995, 10);
  const yr25 = annual * Math.pow(0.995, 25);
  setResult('res-s2', buildResult([
    {label:'System capacity', value: fmt(panels*watt/1000,2)+' kW'},
    {label:'System efficiency (with losses)', value: fmt(systemEff*100,1)+'%'},
    {label:'Daily production', value: fmt(daily,2)+' kWh', color:'var(--solar2)'},
    {label:'Monthly production', value: fmt(monthly,1)+' kWh', color:'var(--solar2)'},
    {label:'Annual production (Year 1)', value: fmt(annual,0)+' kWh', color:'var(--solar2)'},
    {label:'Year 10 production', value: fmt(yr10,0)+' kWh (after ~5% degradation)'},
    {label:'Year 25 production', value: fmt(yr25,0)+' kWh (after ~12% degradation)'},
  ], `☀️ ${panels} panels produce ~${fmt(annual,0)} kWh in Year 1. Panel degradation ~0.5%/yr applied (NREL standard).`, 'solar-hl'));
}

function calcS3() {
  const cost = getVal('s3-cost'), kwh = getVal('s3-kwh'), rate = getVal('s3-rate'), maint = getVal('s3-maint');
  if(!cost||!kwh||!rate) { setResult('res-s3','<div class="result-empty">Please fill all fields</div>'); return; }
  // Electricity rate inflation ~2-3%/yr — use 2.5% as conservative estimate
  const rateInflation = 0.025;
  let totalSavings = 0;
  for(let y=1; y<=25; y++) {
    const degradedKwh = kwh * Math.pow(0.995, y);
    const inflatedRate = rate * Math.pow(1+rateInflation, y);
    totalSavings += degradedKwh*inflatedRate - maint;
  }
  const annualSavings = kwh*rate - maint;
  const simplePayback = cost/annualSavings;
  const netProfit25 = totalSavings - cost;
  const roi25 = (netProfit25/cost)*100;
  setResult('res-s3', buildResult([
    {label:'Annual savings (Year 1)', value: '$'+fmt(annualSavings,0), color:'var(--solar2)'},
    {label:'Simple payback period', value: fmt(simplePayback,1)+' years', color:'var(--solar2)'},
    {label:'25-yr savings (with 2.5% rate inflation)', value: '$'+fmt(totalSavings,0), color:'var(--solar2)'},
    {label:'25-yr net profit', value: '$'+fmt(netProfit25,0), color:'var(--solar2)'},
    {label:'25-yr ROI', value: fmt(roi25,1)+'%'},
    {label:'Monthly savings', value: '$'+fmt(annualSavings/12,0)},
    {label:'Break-even year', value: 'Year '+Math.ceil(simplePayback)},
  ], `📈 Payback in ${fmt(simplePayback,1)} yrs. Includes 2.5%/yr electricity price inflation + 0.5%/yr panel degradation.`, 'solar-hl'));
}

function calcS4() {
  const kwh = getVal('s4-kwh'), days = getVal('s4-days'), volt = parseFloat(getSel('s4-volt')), dod = getVal('s4-dod');
  if(!kwh||!days) { setResult('res-s4','<div class="result-empty">Please fill all fields</div>'); return; }
  const wh = kwh*1000*days;
  // DoD: LiFePO4 can handle 80-90% DoD, Lead-acid 50% recommended
  const ah = wh/(volt*(dod/100));
  // Add 20% buffer for efficiency losses in charge/discharge cycles
  const ahWithBuffer = ah * 1.20;
  const kwTotal = (ahWithBuffer * volt)/1000;
  setResult('res-s4', buildResult([
    {label:'Total energy needed', value: fmtInt(wh)+' Wh'},
    {label:'Battery capacity (exact)', value: fmtInt(ah)+' Ah @ '+volt+'V'},
    {label:'Recommended (with 20% buffer)', value: fmtInt(ahWithBuffer)+' Ah @ '+volt+'V', color:'var(--solar2)'},
    {label:'Total kWh capacity', value: fmt(kwTotal,2)+' kWh', color:'var(--solar2)'},
    {label:'Backup duration', value: days+' day(s) at '+kwh+' kWh/day'},
    {label:'Battery type note', value: dod>=80 ? 'LiFePO4 recommended (supports high DoD)' : 'Lead-acid or LiFePO4 suitable'},
  ], `🔋 Recommended: ${fmtInt(ahWithBuffer)} Ah @ ${volt}V (${fmt(kwTotal,2)} kWh). Buffer includes charge/discharge losses.`, 'solar-hl'));
}

function calcS5() {
  const len = getVal('s5-len'), wid = getVal('s5-wid'), use = getVal('s5-use'), panelSize = parseFloat(getSel('s5-panel'));
  if(!len||!wid) { setResult('res-s5','<div class="result-empty">Please fill all fields</div>'); return; }
  const total = len*wid, usable = total*(use/100);
  // Account for panel spacing/gaps: typically 5-10% of area is gaps
  const netInstallable = usable * 0.92;
  const panels = Math.floor(netInstallable/panelSize);
  const maxKw400 = panels*0.40, maxKw450 = panels*0.45;
  setResult('res-s5', buildResult([
    {label:'Total roof area', value: fmt(total,1)+' m²'},
    {label:'Usable area', value: fmt(usable,1)+' m²'},
    {label:'Net installable (after gaps)', value: fmt(netInstallable,1)+' m²'},
    {label:'Max panels', value: panels+' panels', color:'var(--solar2)'},
    {label:'Max system (400W panels)', value: fmt(maxKw400,2)+' kW', color:'var(--solar2)'},
    {label:'Max system (450W panels)', value: fmt(maxKw450,2)+' kW'},
    {label:'Est. annual production', value: fmt(panels*0.4*4.5*0.8*365,0)+' kWh/yr (avg location)'},
  ], `🏠 ${panels} panels can fit on your roof — up to ${fmt(maxKw400,1)} kW system (400W panels).`, 'solar-hl'));
}

// PSH Data 2026 — Sources: NREL NSRDB, 8MSolar 2026, Global Solar Atlas, Palmetto Solar
function showPSH() {
  const val = getSel('s6-region'), parts = val.split('|');
  const region = parts[0], psh = parseFloat(parts[1]);
  // Seasonal variation: summer can be 20-30% above avg, winter 20-30% below
  const summer = +(psh*1.25).toFixed(1), winter = +(psh*0.75).toFixed(1);
  const monthly = psh*30.44;
  const solarCategory = psh>=6 ? '🌟 Outstanding' : psh>=5 ? '✅ Excellent' : psh>=4 ? '✅ Good' : psh>=3 ? '⚠️ Moderate' : '❌ Low';
  const viability = psh>=4 ? 'Solar is highly cost-effective here' : psh>=3 ? 'Solar is viable — may need larger system' : 'Solar is marginal — battery storage essential';
  document.getElementById('psh-result').innerHTML = '<h3>Results</h3>' +
    buildResult([
      {label:'Region', value: region},
      {label:'Annual avg PSH', value: psh+' hrs/day', color:'var(--solar2)'},
      {label:'Summer peak estimate', value: '~'+summer+' hrs/day'},
      {label:'Winter low estimate', value: '~'+winter+' hrs/day'},
      {label:'Monthly total', value: fmt(monthly,0)+' kWh/m²/month'},
      {label:'Solar category', value: solarCategory, color:'var(--solar2)'},
      {label:'Viability', value: viability},
    ], psh>=4 ? `☀️ ${region} gets ${psh} PSH/day — excellent for solar investment.` : `⚠️ ${region} gets ${psh} PSH/day — solar is viable but size system generously.`, 'solar-hl');
}

function calcS7() {
  const selVal = getSel('s7-country').split('|');
  const factor = parseFloat(selVal[0]);
  const countryName = selVal[1] || '';
  const kwh = getVal('s7-kwh');
  if(!kwh) { setResult('res-s7','<div class="result-empty">Please fill all fields</div>'); return; }
  // CO2 emission factors 2024/2025 — Source: IEA, EPA, UK DESNZ, Germany UBA
  const co2 = kwh*factor;
  // 1 tree absorbs ~21.77 kg CO2/yr (US Forest Service) — mature tree
  const trees = co2/21.77;
  // Average car emits ~4,600 kg CO2/yr (EPA 2024)
  const cars = co2/4600;
  // Coal plant comparison: ~820g CO2/kWh
  const coalKwh = kwh;
  const co225yr = co2*25;
  setResult('res-s7', buildResult([
    {label:'Annual CO₂ avoided', value: fmt(co2,0)+' kg', color:'var(--solar2)'},
    {label:'= Planting trees', value: fmtInt(trees)+' mature trees/year', color:'var(--solar2)'},
    {label:'= Removing cars', value: fmt(cars,2)+' cars off road for 1 year', color:'var(--solar2)'},
    {label:'25-year CO₂ avoided', value: fmt(co225yr/1000,1)+' tonnes CO₂'},
    {label:'vs coal equivalent', value: fmt(coalKwh*0.82/1000,2)+' tonnes/yr (coal grid)'},
  ], `🌿 ${fmt(co2,0)} kg CO₂ avoided/yr — equivalent to planting ${fmtInt(trees)} trees. (Grid emission factor: ${factor} kg/kWh)`, 'solar-hl'));
}

function calcS8() {
  const watt = getVal('s8-watt'), sf = parseFloat(getSel('s8-sf'));
  if(!watt) { setResult('res-s8','<div class="result-empty">Please fill all fields</div>'); return; }
  const kw = (watt*sf)/1000;
  // IEC 62109 standard: inverter should be 1.1–1.3x the DC array size
  // String inverter typically 95-97% efficiency
  const recommended = Math.ceil(kw*10)/10; // round to 0.1 kW
  const type = kw<=5 ? 'String inverter (residential)' : kw<=20 ? 'String/multi-string inverter' : 'Central inverter (commercial)';
  setResult('res-s8', buildResult([
    {label:'Panel array (DC)', value: fmtInt(watt)+' W ('+fmt(watt/1000,2)+' kW)'},
    {label:'Safety/oversizing factor', value: sf+'x (IEC 62109 standard)'},
    {label:'Minimum inverter size', value: fmt(kw,2)+' kW AC', color:'var(--solar2)'},
    {label:'Recommended size', value: recommended+' kW (rounded up)', color:'var(--solar2)'},
    {label:'Inverter type suggestion', value: type},
    {label:'Expected efficiency', value: '95–97% (modern string inverter)'},
  ], `⚡ Choose a ${recommended} kW ${recommended<=5?'string':recommended<=20?'multi-string':'central'} inverter. IEC 62109 oversizing applied.`, 'solar-hl'));
}

function calcS9() {
  const lat = getVal('s9-lat'), hemi = getSel('s9-hemi');
  if(lat===0 && document.getElementById('s9-lat').value==='') { setResult('res-s9','<div class="result-empty">Please enter latitude</div>'); return; }
  const absLat = Math.abs(lat);
  // Rule of thumb + NREL optimization data
  // Year-round: tilt ≈ latitude × 0.87 + 3.1° (NREL PVWatts data)
  const optimal = absLat*0.87 + 3.1;
  // Summer: latitude − 15° (sun is higher)
  const summer = Math.max(5, absLat - 15);
  // Winter: latitude + 15° (sun is lower)
  const winter = Math.min(75, absLat + 15);
  // Spring/Fall: close to latitude
  const spring = absLat;
  const direction = hemi==='N' ? 'True South' : 'True North';
  setResult('res-s9', buildResult([
    {label:'Your latitude', value: absLat+'°'+' ('+hemi+'emisphere)'},
    {label:'Year-round optimal tilt', value: fmt(optimal,1)+'°', color:'var(--solar2)'},
    {label:'Summer tilt (max production)', value: fmt(summer,1)+'°'},
    {label:'Winter tilt (max production)', value: fmt(winter,1)+'°'},
    {label:'Spring/Fall tilt', value: fmt(spring,1)+'°'},
    {label:'Panel direction', value: direction, color:'var(--solar2)'},
    {label:'Azimuth', value: hemi==='N' ? '180° (due south)' : '0° (due north)'},
  ], `📐 Optimal: ${fmt(optimal,1)}° facing ${direction}. Adjusting seasonally can increase output by 5–10% (NREL).`, 'solar-hl'));
}

// ── WIND CALCULATORS (Updated 2026 — Research Verified) ──
// Cp range: modern utility turbines 0.45–0.47 (75-80% of Betz), small turbines 0.25–0.35 — Source: ScienceDirect, Betz limit research 2026
// Capacity factors: onshore 25-35%, offshore 40-50% — Source: IEA 2025
// Air density sea level: 1.225 kg/m³ @ 15°C (ISA standard)

function calcW1() {
  const v = getVal('w1-speed'), r = getVal('w1-blade'), cp = getVal('w1-cp'), rho = getVal('w1-rho');
  if(!v||!r) { setResult('res-w1','<div class="result-empty">Please fill all fields</div>'); return; }
  const A = Math.PI*r*r;
  const P = 0.5*rho*A*Math.pow(v,3)*cp;
  // Real-world: also consider generator efficiency ~94-97%
  const genEff = 0.95;
  const Pelec = P*genEff;
  const betzMax = 0.5*rho*A*Math.pow(v,3)*(16/27);
  const cpPct = (cp/(16/27))*100;
  // Cut-in speed typically 3-4 m/s, rated 12-14 m/s, cut-out 25 m/s
  const operational = v>=3 && v<=25;
  setResult('res-w1', buildResult([
    {label:'Wind speed', value: v+' m/s ('+fmt(v*3.6,1)+' km/h)'},
    {label:'Rotor swept area', value: fmt(A,1)+' m²'},
    {label:'Mechanical power (P=½ρAv³Cp)', value: fmt(P/1000,3)+' kW', color:'var(--wind2)'},
    {label:'Electrical output (~95% gen. eff.)', value: fmt(Pelec/1000,3)+' kW', color:'var(--wind2)'},
    {label:'Cp / Betz efficiency', value: fmt(cp,2)+' ('+fmt(cpPct,0)+'% of Betz limit)'},
    {label:'Betz theoretical max', value: fmt(betzMax/1000,3)+' kW'},
    {label:'Operational?', value: operational ? '✅ Yes (within 3–25 m/s range)' : '❌ Below cut-in or above cut-out'},
  ], `💨 Electrical output: ${fmt(Pelec/1000,2)} kW at ${v} m/s. Cp=${cp} = ${fmt(cpPct,0)}% of Betz limit (${fmt(16/27*100,1)}%).`, 'wind-hl'));
}

function calcW2() {
  const kw = getVal('w2-kw'), cf = getVal('w2-cf');
  if(!kw) { setResult('res-w2','<div class="result-empty">Please fill all fields</div>'); return; }
  const annual = kw*8760*(cf/100);
  // Degradation ~1.6%/yr for wind turbines (NREL) — less than solar
  const yr10 = annual * Math.pow(0.984, 10);
  const yr20 = annual * Math.pow(0.984, 20);
  // Cost context: onshore wind turbine cost ~$850-950/kW (2025) — Source: Blackridge Research
  const turbineCost = kw * 900;
  const cfCategory = cf>=40 ? '🌟 Excellent (offshore-grade)' : cf>=30 ? '✅ Good (onshore)' : cf>=20 ? '⚠️ Average' : '❌ Below average';
  setResult('res-w2', buildResult([
    {label:'Rated power', value: kw+' kW'},
    {label:'Capacity factor', value: cf+'% — '+cfCategory},
    {label:'Annual production (Year 1)', value: fmtInt(annual)+' kWh', color:'var(--wind2)'},
    {label:'Monthly average', value: fmtInt(annual/12)+' kWh'},
    {label:'Year 10 production', value: fmtInt(yr10)+' kWh (after 1.6%/yr degradation)'},
    {label:'Year 20 production', value: fmtInt(yr20)+' kWh'},
    {label:'Typical install cost est.', value: '$'+fmtInt(turbineCost)+' (~$900/kW, 2025 rate)'},
  ], `⚡ ${kw} kW turbine at ${cf}% CF = ${fmtInt(annual)} kWh/yr. Typical onshore CF: 25–35% (IEA 2025).`, 'wind-hl'));
}

function calcW3() {
  const r = getVal('w3-r');
  if(!r) { setResult('res-w3','<div class="result-empty">Please enter blade length</div>'); return; }
  const A = Math.PI*r*r, diam = r*2;
  // Power at different wind speeds for context
  const p8 = 0.5*1.225*A*Math.pow(8,3)*0.40/1000; // 8 m/s, Cp=0.40
  const p10 = 0.5*1.225*A*Math.pow(10,3)*0.40/1000; // 10 m/s
  const p12 = 0.5*1.225*A*Math.pow(12,3)*0.40/1000; // 12 m/s
  // Tip speed ratio (TSR): optimal 6-8 for 3-blade turbine
  setResult('res-w3', buildResult([
    {label:'Blade length (radius)', value: r+' m'},
    {label:'Rotor diameter', value: fmt(diam,1)+' m'},
    {label:'Swept area', value: fmt(A,2)+' m²', color:'var(--wind2)'},
    {label:'Power @ 8 m/s (Cp=0.40)', value: fmt(p8,1)+' kW'},
    {label:'Power @ 10 m/s (Cp=0.40)', value: fmt(p10,1)+' kW', color:'var(--wind2)'},
    {label:'Power @ 12 m/s (Cp=0.40)', value: fmt(p12,1)+' kW'},
    {label:'Optimal tip speed ratio', value: '6–8 (3-blade turbine standard)'},
  ], `🌀 Swept area: ${fmt(A,1)} m². Power scales with v³ — doubling wind speed = 8× more power!`, 'wind-hl'));
}

function calcW4() {
  const cost = getVal('w4-cost'), kwh = getVal('w4-kwh'), rate = getVal('w4-rate'), maint = getVal('w4-maint');
  if(!cost||!kwh||!rate) { setResult('res-w4','<div class="result-empty">Please fill all fields</div>'); return; }
  // Wind turbine degradation ~1.6%/yr (NREL), electricity inflation 2.5%/yr
  let totalSavings = 0;
  for(let y=1; y<=20; y++) {
    const degradedKwh = kwh * Math.pow(0.984, y);
    const inflatedRate = rate * Math.pow(1.025, y);
    totalSavings += degradedKwh*inflatedRate - maint;
  }
  const annualSavings = kwh*rate - maint;
  const payback = cost/annualSavings;
  const roi20 = ((totalSavings-cost)/cost)*100;
  setResult('res-w4', buildResult([
    {label:'Annual savings (Year 1)', value: '$'+fmt(annualSavings,0), color:'var(--wind2)'},
    {label:'Simple payback period', value: fmt(payback,1)+' years', color:'var(--wind2)'},
    {label:'20-yr savings (2.5% rate inflation)', value: '$'+fmt(totalSavings,0), color:'var(--wind2)'},
    {label:'20-yr net profit', value: '$'+fmt(totalSavings-cost,0)},
    {label:'20-yr ROI', value: fmt(roi20,1)+'%'},
    {label:'O&M cost context', value: 'Onshore avg ~$40/kW/yr (2025, NREL)'},
  ], `📈 Break-even in ${fmt(payback,1)} yrs. Includes 1.6%/yr degradation + 2.5%/yr electricity inflation.`, 'wind-hl'));
}

function calcW5() {
  const v = getVal('w5-speed'), r = getVal('w5-r'), rho = getVal('w5-rho');
  if(!v||!r) { setResult('res-w5','<div class="result-empty">Please fill all fields</div>'); return; }
  const A = Math.PI*r*r;
  const totalPower = 0.5*rho*A*Math.pow(v,3);
  const betzLimit = totalPower*(16/27); // 59.26%
  // Modern utility turbines achieve 75-80% of Betz = Cp 0.45-0.47 (ScienceDirect 2024)
  const modernCp = 0.46;
  const modernOutput = totalPower*modernCp;
  // Small turbines (home): Cp ~0.25-0.35
  const smallTurbineOutput = totalPower*0.30;
  setResult('res-w5', buildResult([
    {label:'Total power in wind', value: fmt(totalPower/1000,2)+' kW'},
    {label:'Betz limit (59.26% = 16/27)', value: fmt(betzLimit/1000,2)+' kW', color:'var(--wind2)'},
    {label:'Modern utility turbine (Cp=0.46)', value: fmt(modernOutput/1000,2)+' kW (75-80% of Betz)', color:'var(--wind2)'},
    {label:'Small home turbine (Cp~0.30)', value: fmt(smallTurbineOutput/1000,2)+' kW'},
    {label:'Betz efficiency', value: '59.26% (absolute theoretical max)'},
    {label:'Real-world best (2025)', value: 'Cp=0.45–0.47 (utility scale)'},
  ], `⚡ Betz max: ${fmt(betzLimit/1000,2)} kW. Modern turbines reach ~${fmt(modernOutput/betzLimit*100,0)}% of Betz. No turbine can exceed 59.26%.`, 'wind-hl'));
}

function calcW6() {
  const kwh = getVal('w6-kwh'), hrs = getVal('w6-hrs'), speed = getVal('w6-speed');
  if(!kwh) { setResult('res-w6','<div class="result-empty">Please fill all fields</div>'); return; }
  // Use wind speed if provided to refine CF estimate
  let cf;
  if(speed >= 8) cf = 0.40;
  else if(speed >= 6) cf = 0.30;
  else if(speed >= 4) cf = 0.22;
  else cf = 0.35; // default if no speed given
  const needed = kwh/(hrs*cf);
  // Typical home turbines: 1kW, 2.5kW, 5kW, 10kW — Source: manufacturers
  const sizes = [1, 2.5, 5, 10, 15, 20];
  const recommended = sizes.find(s => s >= needed) || Math.ceil(needed);
  setResult('res-w6', buildResult([
    {label:'Daily usage', value: kwh+' kWh'},
    {label:'Estimated capacity factor', value: fmt(cf*100,0)+'% (based on wind speed)'},
    {label:'Minimum turbine size needed', value: fmt(needed,1)+' kW', color:'var(--wind2)'},
    {label:'Recommended standard size', value: recommended+' kW', color:'var(--wind2)'},
    {label:'Typical cost at '+recommended+' kW', value: '$'+fmtInt(recommended*2500)+' – $'+fmtInt(recommended*4000)+' installed'},
    {label:'Min wind speed required', value: speed>0 ? (speed>=3?'✅ Above cut-in (3 m/s)':'⚠️ Below cut-in speed') : '3 m/s cut-in (typical)'},
  ], `🏠 Recommended: ${recommended} kW turbine. Cost context: ~$2,500–$4,000/kW installed (2025).`, 'wind-hl'));
}

function calcW7() {
  const alt = getVal('w7-alt'), temp = getVal('w7-temp');
  const T = temp + 273.15;
  // ISA standard atmosphere barometric formula
  // P = P0 × (1 - L×h/T0)^(g×M/(R×L))
  // Simplified: P = 101325 × (1 - 0.0000225577 × alt)^5.25588
  const P = 101325*Math.pow(1 - 0.0000225577*alt, 5.25588);
  const rho = P/(287.058*T);
  const rhoSL = 1.225; // sea level standard
  const powerFactor = rho/rhoSL; // wind power scales linearly with density
  setResult('res-w7', buildResult([
    {label:'Altitude', value: fmtInt(alt)+' m ASL'},
    {label:'Temperature', value: temp+'°C ('+fmt(T,1)+'K)'},
    {label:'Atmospheric pressure', value: fmt(P/1000,3)+' kPa ('+fmt(P,0)+' Pa)'},
    {label:'Air density', value: fmt(rho,4)+' kg/m³', color:'var(--wind2)'},
    {label:'vs sea level (1.225 kg/m³)', value: fmt(powerFactor*100,1)+'% of sea level density'},
    {label:'Wind power impact', value: fmt(powerFactor*100,1)+'% of sea-level power output'},
    {label:'Note', value: 'ISA (International Standard Atmosphere) formula used'},
  ], `💨 At ${fmtInt(alt)}m: ρ=${fmt(rho,4)} kg/m³ = ${fmt(powerFactor*100,1)}% of sea level. Wind power is proportional to air density.`, 'wind-hl'));
}

function calcW8() {
  const actual = getVal('w8-actual'), rated = getVal('w8-rated');
  if(!actual||!rated) { setResult('res-w8','<div class="result-empty">Please fill all fields</div>'); return; }
  const cf = (actual/(rated*8760))*100;
  // IEA 2025 benchmarks: onshore 25-35%, offshore 40-50%
  const quality = cf>=45 ? '🌟 Excellent — offshore-grade site' : cf>=35 ? '✅ Good — above avg onshore' : cf>=25 ? '✅ Average — typical onshore' : cf>=15 ? '⚠️ Below average' : '❌ Poor — consider site reassessment';
  const comparison = cf>=40 ? 'Top-tier offshore site' : cf>=30 ? 'Good onshore (EU/US average)' : cf>=20 ? 'Below EU/US average' : 'Poor resource';
  setResult('res-w8', buildResult([
    {label:'Actual annual output', value: fmtInt(actual)+' kWh'},
    {label:'Rated capacity', value: rated+' kW'},
    {label:'Max theoretical output', value: fmtInt(rated*8760)+' kWh'},
    {label:'Capacity factor', value: fmt(cf,2)+'%', color:'var(--wind2)'},
    {label:'Site assessment', value: quality, color: cf>=30?'var(--wind2)':'var(--solar2)'},
    {label:'vs IEA 2025 benchmark', value: comparison},
    {label:'Onshore avg (IEA 2025)', value: '28–32% global average'},
  ], `📊 ${fmt(cf,1)}% capacity factor — ${quality}. IEA 2025 global onshore average: 28–32%.`, 'wind-hl'));
}

// ── SALARY CALCULATORS ──
// ── REAL 2026 TAX DATA (Research-verified) ──
const taxData = {
  // USA 2026: IRS Rev Proc 2025-32 + OBBBA — Single filer
  USA: {
    currency: '$', name: 'Federal Income Tax 2026',
    standardDeduction: { single: 16100, married: 32200 },
    brackets: {
      single:  [[12400,0.10],[50400,0.12],[105700,0.22],[200800,0.24],[254900,0.32],[640600,0.35],[Infinity,0.37]],
      married: [[24800,0.10],[100800,0.12],[211400,0.22],[401600,0.24],[509800,0.32],[768600,0.35],[Infinity,0.37]]
    },
    // Social Security 6.2% up to $176,100, Medicare 1.45%
    fica: { ss: 0.062, ssCap: 176100, medicare: 0.0145 }
  },
  // UK 2025/26: HMRC frozen thresholds + NIC 8% employee
  UK: {
    currency: '£', name: 'Income Tax + NI 2025/26',
    personalAllowance: 12570,
    brackets: [[12570,0],[50270,0.20],[125140,0.40],[Infinity,0.45]],
    // NI: 8% on £12,570–£50,270, 2% above
    ni: { lower: 12570, upper: 50270, mainRate: 0.08, upperRate: 0.02 }
  },
  // Canada 2026: CRA — 14% lowest bracket, BPA $16,129
  Canada: {
    currency: 'CA$', name: 'Federal Tax 2026 (excl. provincial)',
    bpa: 16129, // Basic Personal Amount
    brackets: [[57375,0.14],[114750,0.205],[177882,0.26],[253414,0.29],[Infinity,0.33]],
    // CPP: 5.95% on $3,500–$74,600 max; EI: 1.64% up to $68,900
    cpp: { rate: 0.0595, exempt: 3500, ceiling: 74600 },
    ei: { rate: 0.0164, ceiling: 68900 }
  },
  // Germany 2026: Grundfreibetrag €12,348, approx progressive
  Germany: {
    currency: '€', name: 'Einkommensteuer + Sozialversicherung 2026',
    grundfreibetrag: 12348,
    // Simplified progressive: 0%, ~14-24% zone1, ~24-42% zone2, 42%, 45%
    brackets: [[12348,0],[17799,0.14],[69878,0.24],[277826,0.42],[Infinity,0.45]],
    // Social security: ~20% employee share (pension 9.3%, health ~7.8%, unemp 1.3%, care 1.8%)
    sozial: 0.197
  },
  // India FY 2025-26 New Regime (default): updated slabs + ₹75k std deduction
  India: {
    currency: '₹', name: 'Income Tax FY 2025-26 (New Regime)',
    standardDeduction: 75000,
    brackets: [[400000,0],[800000,0.05],[1200000,0.10],[1600000,0.15],[2000000,0.20],[2400000,0.25],[Infinity,0.30]],
    rebate87A: { limit: 1200000, maxRebate: 60000 },
    cess: 0.04, // Health & Education cess 4%
    // PF: 12% of basic (assume basic = 50% of gross) up to ₹21,000/month basic
    pf: { rate: 0.12, basicRatio: 0.5, cap: 252000 }
  },
  // Russia 2026: flat 13% below 5M, 15% above 5M RUB
  Russia: {
    currency: '₽', name: 'НДФЛ 2026',
    brackets: [[5000000, 0.13],[Infinity, 0.15]],
    // Pension: 22% employer only (employee pays 0 on income)
    // But show social info
    note: 'Social contributions paid by employer only'
  }
};

// ── COUNTRY-SPECIFIC TAX CALCULATION ──
function calcCountryTax(gross, country, filingStatus) {
  const d = taxData[country];
  let result = { incomeTax: 0, deductions: [], netAnnual: gross };

  if (country === 'USA') {
    const status = filingStatus === 'married' ? 'married' : 'single';
    const stdDed = d.standardDeduction[status];
    const brackets = d.brackets[status];
    let taxable = Math.max(0, gross - stdDed);
    let tax = 0, prev = 0;
    for (let b of brackets) {
      const band = Math.min(taxable, b[0]) - prev;
      if (band <= 0) break;
      tax += band * b[1];
      prev = b[0];
      if (taxable <= b[0]) break;
    }
    // FICA
    const ssWage = Math.min(gross, d.fica.ssCap);
    const ss = ssWage * d.fica.ss;
    const medicare = gross * d.fica.medicare;
    result.incomeTax = tax;
    result.deductions = [
      { label: 'Standard deduction', value: '-$'+fmtInt(stdDed) },
      { label: 'Federal income tax', value: '-$'+fmtInt(tax), color:'#ef4444' },
      { label: 'Social Security (6.2%)', value: '-$'+fmtInt(ss), color:'#f97316' },
      { label: 'Medicare (1.45%)', value: '-$'+fmtInt(medicare), color:'#f97316' }
    ];
    result.totalDeductions = tax + ss + medicare;
    result.netAnnual = gross - result.totalDeductions;
    result.currency = d.currency;
    result.name = d.name;

  } else if (country === 'UK') {
    // Income tax
    let taxable = Math.max(0, gross - d.personalAllowance);
    // Taper personal allowance above £100k
    if (gross > 100000) {
      const reduction = Math.min(d.personalAllowance, (gross - 100000) / 2);
      taxable = gross - (d.personalAllowance - reduction);
    }
    let tax = 0, prev = d.personalAllowance;
    for (let b of d.brackets.slice(1)) {
      const band = Math.min(gross, b[0]) - prev;
      if (band <= 0) break;
      tax += band * b[1];
      prev = b[0];
      if (gross <= b[0]) break;
    }
    // NI
    let ni = 0;
    if (gross > d.ni.lower) {
      const mainBand = Math.min(gross, d.ni.upper) - d.ni.lower;
      ni += Math.max(0, mainBand) * d.ni.mainRate;
      if (gross > d.ni.upper) ni += (gross - d.ni.upper) * d.ni.upperRate;
    }
    result.incomeTax = tax;
    result.deductions = [
      { label: 'Personal allowance', value: '-£'+fmtInt(d.personalAllowance) },
      { label: 'Income tax (PAYE)', value: '-£'+fmtInt(tax), color:'#ef4444' },
      { label: 'National Insurance (8%)', value: '-£'+fmtInt(ni), color:'#f97316' }
    ];
    result.totalDeductions = tax + ni;
    result.netAnnual = gross - result.totalDeductions;
    result.currency = d.currency;
    result.name = d.name;

  } else if (country === 'Canada') {
    // Federal tax with BPA credit
    let taxable = Math.max(0, gross - d.bpa);
    let tax = 0, prev = 0;
    for (let b of d.brackets) {
      const band = Math.min(taxable, b[0]) - prev;
      if (band <= 0) break;
      tax += band * b[1];
      prev = b[0];
      if (taxable <= b[0]) break;
    }
    // BPA non-refundable credit at 14%
    const bpaCredit = d.bpa * 0.14;
    tax = Math.max(0, tax - bpaCredit);
    // CPP
    const cppBase = Math.max(0, Math.min(gross, d.cpp.ceiling) - d.cpp.exempt);
    const cpp = cppBase * d.cpp.rate;
    // EI
    const ei = Math.min(gross, d.ei.ceiling) * d.ei.rate;
    result.incomeTax = tax;
    result.deductions = [
      { label: 'Basic Personal Amount', value: 'CA$'+fmtInt(d.bpa)+' (BPA credit)' },
      { label: 'Federal income tax', value: '-CA$'+fmtInt(tax), color:'#ef4444' },
      { label: 'CPP (5.95%)', value: '-CA$'+fmtInt(cpp), color:'#f97316' },
      { label: 'EI premiums (1.64%)', value: '-CA$'+fmtInt(ei), color:'#f97316' },
      { label: '+ Provincial tax (est.)', value: '~15–20% extra (varies by province)' }
    ];
    result.totalDeductions = tax + cpp + ei;
    result.netAnnual = gross - result.totalDeductions;
    result.currency = d.currency;
    result.name = d.name;

  } else if (country === 'Germany') {
    // Simplified progressive (exact uses §32a polynomial formula)
    let taxable = Math.max(0, gross - d.grundfreibetrag);
    let tax = 0, prev = 0;
    const brackets = d.brackets.slice(1); // skip the 0% zone
    for (let b of brackets) {
      const band = Math.min(taxable, b[0] - d.grundfreibetrag) - prev;
      if (band <= 0) break;
      tax += band * b[1];
      prev = b[0] - d.grundfreibetrag;
      if (taxable <= b[0] - d.grundfreibetrag) break;
    }
    // Social security ~19.7% up to income ceiling €96,600
    const sozialBase = Math.min(gross, 96600);
    const sozial = sozialBase * d.sozial;
    // Soli: only if income tax > ~€20,350 (few taxpayers)
    const soli = tax > 20350 ? tax * 0.055 : 0;
    result.incomeTax = tax;
    result.deductions = [
      { label: 'Grundfreibetrag (tax-free)', value: '€'+fmtInt(d.grundfreibetrag) },
      { label: 'Einkommensteuer', value: '-€'+fmtInt(tax), color:'#ef4444' },
      { label: 'Sozialversicherung (~19.7%)', value: '-€'+fmtInt(sozial), color:'#f97316' },
      { label: 'Solidaritätszuschlag', value: soli > 0 ? '-€'+fmtInt(soli) : 'Exempt (most taxpayers)' }
    ];
    result.totalDeductions = tax + sozial + soli;
    result.netAnnual = gross - result.totalDeductions;
    result.currency = d.currency;
    result.name = d.name;

  } else if (country === 'India') {
    // New Regime FY 2025-26
    const stdDed = d.standardDeduction;
    let taxable = Math.max(0, gross - stdDed);
    let tax = 0, prev = 0;
    for (let b of d.brackets) {
      const band = Math.min(taxable, b[0]) - prev;
      if (band <= 0) break;
      tax += band * b[1];
      prev = b[0];
      if (taxable <= b[0]) break;
    }
    // Section 87A rebate: if taxable ≤ ₹12L, rebate up to ₹60k
    let rebate = 0;
    if (taxable <= d.rebate87A.limit) rebate = Math.min(tax, d.rebate87A.maxRebate);
    tax = Math.max(0, tax - rebate);
    // Health & Education Cess 4%
    const cess = tax * d.cess;
    const totalTax = tax + cess;
    // PF: 12% of basic (basic ≈ 50% of CTC), capped
    const basicSalary = gross * d.pf.basicRatio;
    const pf = Math.min(basicSalary * d.pf.rate, d.pf.cap);
    result.incomeTax = totalTax;
    result.deductions = [
      { label: 'Standard deduction', value: '-₹'+fmtInt(stdDed) },
      { label: 'Income tax (slab)', value: '-₹'+fmtInt(tax), color:'#ef4444' },
      rebate > 0 ? { label: 'Rebate u/s 87A', value: '+₹'+fmtInt(rebate), color:'var(--salary2)' } : null,
      { label: 'Health & Ed. Cess (4%)', value: '-₹'+fmtInt(cess), color:'#ef4444' },
      { label: 'PF contribution (12%)', value: '-₹'+fmtInt(pf), color:'#f97316' }
    ].filter(Boolean);
    result.totalDeductions = totalTax + pf;
    result.netAnnual = gross - result.totalDeductions;
    result.currency = d.currency;
    result.name = d.name;

  } else if (country === 'Russia') {
    // 13% up to 5M RUB, 15% above
    let tax = 0;
    if (gross <= 5000000) {
      tax = gross * 0.13;
    } else {
      tax = 5000000 * 0.13 + (gross - 5000000) * 0.15;
    }
    result.incomeTax = tax;
    result.deductions = [
      { label: 'НДФЛ (up to 5M: 13%)', value: '-₽'+fmtInt(tax), color:'#ef4444' },
      { label: 'Social contributions', value: 'Paid by employer only' }
    ];
    result.totalDeductions = tax;
    result.netAnnual = gross - result.totalDeductions;
    result.currency = taxData.Russia.currency;
    result.name = taxData.Russia.name;
  }
  return result;
}

// Keep old calcBracketTax for calcT2 (simple bracket calc)
function calcBracketTax(income, country) {
  const d = taxData[country];
  if (country === 'Russia') {
    return income <= 5000000 ? income*0.13 : 5000000*0.13+(income-5000000)*0.15;
  }
  if (country === 'USA') {
    let taxable = Math.max(0, income - d.standardDeduction.single);
    let tax = 0, prev = 0;
    for (let b of d.brackets.single) {
      const band = Math.min(taxable, b[0]) - prev;
      if (band <= 0) break;
      tax += band*b[1]; prev = b[0];
      if (taxable <= b[0]) break;
    }
    return tax;
  }
  if (country === 'Canada') {
    let taxable = Math.max(0, income - d.bpa);
    let tax = 0, prev = 0;
    for (let b of d.brackets) {
      const band = Math.min(taxable, b[0]) - prev;
      if (band <= 0) break;
      tax += band*b[1]; prev = b[0];
      if (taxable <= b[0]) break;
    }
    return Math.max(0, tax - d.bpa*0.14);
  }
  if (country === 'India') {
    let taxable = Math.max(0, income - d.standardDeduction);
    let tax = 0, prev = 0;
    for (let b of d.brackets) {
      const band = Math.min(taxable, b[0]) - prev;
      if (band <= 0) break;
      tax += band*b[1]; prev = b[0];
      if (taxable <= b[0]) break;
    }
    let rebate = taxable <= d.rebate87A.limit ? Math.min(tax, d.rebate87A.maxRebate) : 0;
    return Math.max(0, tax - rebate) * (1 + d.cess);
  }
  // UK, Germany — use brackets array directly
  const brackets = d.brackets || [];
  let taxable = Math.max(0, income - (d.grundfreibetrag || d.personalAllowance || 0));
  let tax = 0, prev = 0;
  for (let b of brackets.slice(1)) {
    const threshold = d.grundfreibetrag ? b[0] - d.grundfreibetrag : b[0];
    const band = Math.min(taxable, threshold) - prev;
    if (band <= 0) break;
    tax += band*b[1]; prev = threshold;
    if (taxable <= threshold) break;
  }
  return tax;
}

function calcT1() {
  const country = getSel('t1-country'), salary = getVal('t1-salary');
  const filingStatus = getSel('t1-extra');
  if(!salary) { setResult('res-t1','<div class="result-empty">Please enter your salary</div>'); return; }
  const res = calcCountryTax(salary, country, filingStatus);
  const items = [
    { label:'Gross annual salary', value: res.currency+fmtInt(salary) },
    ...res.deductions,
    { label:'─────────────────', value: '' },
    { label:'Take-home (annual)', value: res.currency+fmtInt(res.netAnnual), color:'var(--salary2)' },
    { label:'Take-home (monthly)', value: res.currency+fmtInt(res.netAnnual/12), color:'var(--salary2)' },
    { label:'Take-home (weekly)', value: res.currency+fmtInt(res.netAnnual/52) },
    { label:'Total deductions', value: '-'+res.currency+fmtInt(res.totalDeductions), color:'#ef4444' },
    { label:'Effective total rate', value: fmt(res.totalDeductions/salary*100,1)+'%' }
  ].filter(i => i.label !== '─────────────────' || true);
  setResult('res-t1', buildResult(items,
    `💰 Take-home: ${res.currency}${fmtInt(res.netAnnual/12)}/month | Effective rate: ${fmt(res.totalDeductions/salary*100,1)}%`, 'salary-hl'));
}

function calcT2() {
  const country = getSel('t2-country'), income = getVal('t2-income');
  if(!income) { setResult('res-t2','<div class="result-empty">Please enter income</div>'); return; }
  const res = calcCountryTax(income, country, 'single');
  const tax = res.incomeTax;
  const effective = tax/income*100;
  const totalEff = res.totalDeductions/income*100;
  const currencies = {USA:'$',UK:'£',Canada:'CA$',Germany:'€',India:'₹',Russia:'₽'};
  const cur = currencies[country];
  const countryNotes = {
    USA: 'Federal only — state income tax (0–13%) additional',
    UK: 'Includes National Insurance contributions',
    Canada: 'Federal only — provincial tax (5–21%) additional',
    Germany: 'Includes Sozialversicherung (~19.7%)',
    India: 'New Regime FY 2025-26 incl. cess. Effective tax-free: ₹12.75L for salaried',
    Russia: '13% flat (15% above ₽5M). Social contributions paid by employer.'
  };
  setResult('res-t2', buildResult([
    {label:'Annual income', value: cur+fmtInt(income)},
    {label:'Income tax only', value: '-'+cur+fmtInt(tax), color:'#ef4444'},
    {label:'Total deductions', value: '-'+cur+fmtInt(res.totalDeductions), color:'#ef4444'},
    {label:'Effective income tax rate', value: fmt(effective,1)+'%', color:'var(--salary2)'},
    {label:'Total effective rate', value: fmt(totalEff,1)+'%', color:'var(--salary2)'},
    {label:'Monthly tax', value: cur+fmtInt(tax/12)},
    {label:'After-tax income', value: cur+fmtInt(income - res.totalDeductions)},
  ], `📊 ${countryNotes[country]}`, 'salary-hl'));
}

function calcT3() {
  const salary = getVal('t3-salary');
  if(!salary) { setResult('res-t3','<div class="result-empty">Please enter salary</div>'); return; }
  const c1 = getSel('t3-c1').split('|'), c2 = getSel('t3-c2').split('|');
  const s1 = salary*parseFloat(c1[1]), s2 = salary*parseFloat(c2[1]);
  const t1 = calcBracketTax(s1, c1[0]), t2 = calcBracketTax(s2, c2[0]);
  setResult('res-t3', buildResult([
    {label:c1[0]+' salary', value: c1[2]+fmtInt(s1)},
    {label:c1[0]+' after tax', value: c1[2]+fmtInt(s1-t1), color:'var(--salary2)'},
    {label:c2[0]+' salary', value: c2[2]+fmtInt(s2)},
    {label:c2[0]+' after tax', value: c2[2]+fmtInt(s2-t2), color:'var(--salary2)'},
    {label:'Better take-home', value: (s1-t1) > (s2-t2) ? c1[0]+' ✓' : c2[0]+' ✓', color:'var(--salary2)'},
  ], `🌍 Comparison based on USD ${fmtInt(salary)} converted at current approximate rates.`, 'salary-hl'));
}

function calcT4() {
  const h = getVal('t4-hourly'), hrs = getVal('t4-hrs'), weeks = getVal('t4-weeks');
  if(!h) { setResult('res-t4','<div class="result-empty">Please enter hourly rate</div>'); return; }
  const annual = h*hrs*weeks, monthly = annual/12, daily = annual/365;
  setResult('res-t4', buildResult([
    {label:'Hourly rate', value: '$'+fmt(h,2)},
    {label:'Daily (8hrs)', value: '$'+fmt(h*8,2)},
    {label:'Weekly', value: '$'+fmt(h*hrs,2)},
    {label:'Monthly', value: '$'+fmtInt(monthly), color:'var(--salary2)'},
    {label:'Annual', value: '$'+fmtInt(annual), color:'var(--salary2)'},
  ], `💼 At $${fmt(h,2)}/hr working ${hrs} hrs/week = $${fmtInt(annual)}/year.`, 'salary-hl'));
}

function calcT5() {
  const salary = getVal('t5-salary'), from = parseFloat(getSel('t5-from')), to = parseFloat(getSel('t5-to'));
  if(!salary) { setResult('res-t5','<div class="result-empty">Please enter salary</div>'); return; }
  const equiv = salary*(to/from);
  setResult('res-t5', buildResult([
    {label:'Your salary', value: '$'+fmtInt(salary)},
    {label:'From index', value: from},
    {label:'To index', value: to},
    {label:'Equivalent salary needed', value: '$'+fmtInt(equiv), color:'var(--salary2)'},
    {label:'Difference', value: (equiv>salary?'+':'')+' $'+fmtInt(equiv-salary)},
  ], `🏙️ You need $${fmtInt(equiv)} in the new city to maintain the same standard of living.`, 'salary-hl'));
}

function calcT6() {
  const P = getVal('t6-loan'), annualR = getVal('t6-rate'), n = getVal('t6-months');
  if(!P||!annualR||!n) { setResult('res-t6','<div class="result-empty">Please fill all fields</div>'); return; }
  const r = annualR/12/100;
  const emi = P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);
  const total = emi*n, interest = total-P;
  setResult('res-t6', buildResult([
    {label:'Monthly EMI', value: fmtInt(emi), color:'var(--salary2)'},
    {label:'Total payment', value: fmtInt(total)},
    {label:'Principal', value: fmtInt(P)},
    {label:'Total interest', value: fmtInt(interest), color:'#ef4444'},
    {label:'Interest to principal ratio', value: fmt(interest/P*100,1)+'%'},
  ], `💳 Your monthly EMI is ${fmtInt(emi)}. Total interest paid: ${fmtInt(interest)}.`, 'salary-hl'));
}

function updateSalaryFields() {
  const country = getSel('t1-country');
  const labels = {
    USA:'Filing status (affects standard deduction)',
    UK:'Employment type',
    Canada:'Province (affects provincial tax)',
    Germany:'Steuerklasse (Tax class)',
    India:'Tax regime',
    Russia:'Residency status'
  };
  const options = {
    USA: ['<option value="single">Single</option><option value="married">Married filing jointly</option>'],
    UK: ['<option value="single">Employed (PAYE)</option><option value="married">Self-employed</option>'],
    Canada: ['<option value="single">Ontario</option><option value="married">British Columbia</option>'],
    Germany: ['<option value="single">Class I (Single)</option><option value="married">Class III (Married)</option>'],
    India: ['<option value="single">New Regime (default)</option><option value="married">Old Regime</option>'],
    Russia: ['<option value="single">Resident (13%/15%)</option><option value="married">Non-resident (30%)</option>']
  };
  document.getElementById('t1-extra-label').textContent = labels[country]||'Option';
  document.getElementById('t1-extra').innerHTML = (options[country]||['<option>N/A</option>']).join('');
}

// ── LEGAL DOCUMENT GENERATORS ──
function formatDate(d) {
  if(!d) return new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  const dt = new Date(d); return dt.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
}

const docGenerators = {
  nda: () => {
    const p1=getStr('l1-p1')||'[Party 1]', p2=getStr('l1-p2')||'[Party 2]';
    const purpose=getStr('l1-purpose')||'[purpose]', dur=getVal('l1-dur')||2;
    const law=getStr('l1-law')||'[Jurisdiction]', date=formatDate(getStr('l1-date'));
    return `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into as of ${date}, by and between:

DISCLOSING PARTY: ${p1} ("Disclosing Party")
RECEIVING PARTY: ${p2} ("Receiving Party")

RECITALS

The parties wish to explore a potential business relationship in connection with ${purpose} (the "Purpose"), and in connection with the Purpose, Disclosing Party may disclose certain confidential and proprietary information to Receiving Party.

1. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" means any information or data disclosed by the Disclosing Party to the Receiving Party, either directly or indirectly, in writing, orally, or by inspection of tangible objects, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and circumstances of disclosure.

2. OBLIGATIONS OF RECEIVING PARTY
The Receiving Party agrees to:
(a) Hold the Confidential Information in strict confidence;
(b) Not disclose the Confidential Information to any third parties without prior written consent;
(c) Use the Confidential Information solely for the Purpose;
(d) Protect the Confidential Information with at least the same degree of care used to protect its own confidential information.

3. TERM
This Agreement shall remain in effect for a period of ${dur} year(s) from the date of this Agreement.

4. EXCLUSIONS
Confidential Information does not include information that: (a) is or becomes publicly known through no breach by the Receiving Party; (b) was rightfully known before receipt; (c) is required to be disclosed by law or court order.

5. RETURN OF INFORMATION
Upon request, the Receiving Party shall promptly return or destroy all Confidential Information.

6. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of ${law}.

7. ENTIRE AGREEMENT
This Agreement constitutes the entire agreement between the parties concerning the subject matter hereof.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

DISCLOSING PARTY: ${p1}

Signature: _______________________
Name: ___________________________
Title: ____________________________
Date: ____________________________

RECEIVING PARTY: ${p2}

Signature: _______________________
Name: ___________________________
Title: ____________________________
Date: ____________________________`;
  },

  rent: () => {
    const ll=getStr('l2-landlord')||'[Landlord]', t=getStr('l2-tenant')||'[Tenant]';
    const addr=getStr('l2-addr')||'[Address]', rent=getVal('l2-rent')||0;
    const cur=getSel('l2-currency'), dep=getVal('l2-deposit')||0;
    const start=formatDate(getStr('l2-start')), dur=getVal('l2-dur')||12;
    return `RESIDENTIAL LEASE AGREEMENT

This Residential Lease Agreement ("Agreement") is made on ${start}.

LANDLORD: ${ll} ("Landlord")
TENANT: ${t} ("Tenant")

PROPERTY: ${addr}

TERMS AND CONDITIONS

1. LEASE TERM
This lease shall commence on ${start} and continue for a period of ${dur} month(s).

2. RENT
The Tenant agrees to pay ${cur}${fmtInt(rent)} per month, due on the 1st day of each month. Rent shall be paid by [payment method to be agreed].

3. SECURITY DEPOSIT
The Tenant shall pay a security deposit of ${cur}${fmtInt(dep)} prior to move-in. This deposit shall be returned within 30 days of lease end, less any deductions for damages beyond normal wear and tear.

4. UTILITIES
Unless otherwise agreed in writing, the Tenant is responsible for all utility payments including electricity, gas, water, and internet.

5. MAINTENANCE & REPAIRS
The Tenant agrees to maintain the property in a clean and sanitary condition and promptly notify the Landlord of any needed repairs.

6. ALTERATIONS
The Tenant shall not make any alterations, additions, or improvements to the property without the prior written consent of the Landlord.

7. SUBLETTING
The Tenant shall not sublet the property or any part thereof without the prior written consent of the Landlord.

8. TERMINATION
Either party may terminate this Agreement with 30 days written notice prior to the end of the lease term.

9. GOVERNING LAW
This Agreement shall be governed by applicable local tenancy laws.

LANDLORD SIGNATURE

Signature: _______________________
Name: ${ll}
Date: ____________________________

TENANT SIGNATURE

Signature: _______________________
Name: ${t}
Date: ____________________________`;
  },

  freelance: () => {
    const fl=getStr('l3-freelancer')||'[Freelancer]', cl=getStr('l3-client')||'[Client]';
    const svc=getStr('l3-service')||'[Services]', fee=getVal('l3-fee')||0;
    const cur=getSel('l3-currency'), terms=getSel('l3-terms');
    const deadline=formatDate(getStr('l3-deadline')), law=getStr('l3-law')||'[Jurisdiction]';
    return `FREELANCE SERVICE AGREEMENT

This Freelance Service Agreement ("Agreement") is entered into between:

FREELANCER: ${fl}
CLIENT: ${cl}

1. SERVICES
The Freelancer agrees to provide the following services:
${svc}

2. COMPENSATION
The Client agrees to pay the Freelancer a total fee of ${cur}${fmtInt(fee)} for the services described above.

Payment terms: ${terms}

3. TIMELINE
The Freelancer shall complete the services by ${deadline}, subject to timely receipt of required materials and feedback from the Client.

4. REVISIONS
The fee includes up to [number] rounds of revisions. Additional revisions will be billed at an agreed hourly rate.

5. INTELLECTUAL PROPERTY
Upon receipt of full payment, all work product created under this Agreement shall be the exclusive property of the Client.

6. CONFIDENTIALITY
The Freelancer agrees to keep all Client information confidential and not to disclose it to any third parties.

7. INDEPENDENT CONTRACTOR
The Freelancer is an independent contractor and not an employee of the Client. The Freelancer is responsible for all applicable taxes.

8. TERMINATION
Either party may terminate this Agreement with 7 days written notice. Client shall pay for all work completed to the date of termination.

9. LIMITATION OF LIABILITY
Freelancer's liability shall be limited to the total amount of fees paid under this Agreement.

10. GOVERNING LAW
This Agreement shall be governed by the laws of ${law}.

FREELANCER SIGNATURE

Signature: _______________________
Name: ${fl}
Date: ____________________________

CLIENT SIGNATURE

Signature: _______________________
Name: ${cl}
Date: ____________________________`;
  },

  invoice: () => {
    const from=getStr('l4-from')||'[Your Name]', to=getStr('l4-to')||'[Client]';
    const num=getStr('l4-num')||'INV-001', desc=getStr('l4-desc')||'[Services]';
    const amt=getVal('l4-amount')||0, cur=getSel('l4-currency');
    const tax=getVal('l4-tax')||0, due=formatDate(getStr('l4-due'));
    const taxAmt=amt*(tax/100), total=amt+taxAmt;
    return `INVOICE

FROM:
${from}

TO:
${to}

Invoice Number: ${num}
Invoice Date: ${formatDate('')}
Due Date: ${due}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DESCRIPTION                          AMOUNT
${desc.padEnd(40,' ')}${cur}${fmt(amt)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Subtotal:                            ${cur}${fmt(amt)}
Tax (${tax}%):                       ${cur}${fmt(taxAmt)}
                                     ─────────────
TOTAL DUE:                           ${cur}${fmt(total)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Payment Terms: Due by ${due}

Please make payment to: ${from}

Thank you for your business!`;
  },

  privacy: () => {
    const co=getStr('l5-company')||'[Company]', url=getStr('l5-url')||'[URL]';
    const email=getStr('l5-email')||'[email]', country=getSel('l5-country');
    const cookies=getSel('l5-cookies'), emailCollect=getSel('l5-email-collect');
    return `PRIVACY POLICY

Last updated: ${formatDate('')}

${co} ("we", "us", or "our") operates ${url} (the "Service").

This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service.

1. INFORMATION WE COLLECT
We collect several types of information for various purposes:
${emailCollect==='yes'?'- Email addresses when you subscribe or contact us\n':''}
- Usage Data (browser type, pages visited, time spent)
- Device information (IP address, browser, operating system)

2. HOW WE USE YOUR INFORMATION
We use the collected data to:
- Provide and maintain our Service
- Improve and personalize your experience
- Communicate with you (if you have opted in)
- Comply with legal obligations

3. COOKIES
${cookies==='yes'?'We use cookies and similar tracking technologies to track activity on our Service. You can instruct your browser to refuse all cookies.':'We do not use cookies on our website.'}

4. DATA SHARING
We do not sell, trade, or rent your personal information to third parties. We may share anonymized data with analytics partners.

5. DATA SECURITY
We implement industry-standard security measures to protect your data. However, no method of internet transmission is 100% secure.

6. YOUR RIGHTS (${country})
${country==='EU'||country==='UK'?'Under GDPR/UK GDPR, you have rights to: access, rectify, erase, restrict, and port your data.':country==='USA'?'Under CCPA, California residents have rights to know, delete, and opt-out of data sale.':'You have the right to access, correct, or delete your personal information.'}

7. CONTACT US
If you have questions about this Privacy Policy, contact us at:
Email: ${email}
Website: ${url}

This Privacy Policy is effective as of ${formatDate('')}.`;
  },

  employment: () => {
    const co=getStr('l6-company')||'[Company]', emp=getStr('l6-employee')||'[Employee]';
    const title=getStr('l6-title')||'[Title]', salary=getVal('l6-salary')||0;
    const cur=getSel('l6-currency'), start=formatDate(getStr('l6-start'));
    const type=getSel('l6-type');
    return `EMPLOYMENT OFFER LETTER

${formatDate('')}

Dear ${emp},

We are pleased to offer you the position of ${title} at ${co}, subject to the terms outlined in this letter.

POSITION DETAILS:

Job Title: ${title}
Employment Type: ${type}
Start Date: ${start}
Location: [Office location / Remote]

COMPENSATION:

Annual Salary: ${cur}${fmtInt(salary)}
Payment Frequency: Monthly
Payment Method: Bank transfer

BENEFITS:

- [Annual leave entitlement] days paid vacation
- [Health insurance details]
- [Other benefits]

TERMS & CONDITIONS:

- This offer is contingent upon successful completion of reference checks
- A probationary period of [90 days] will apply
- You will be required to sign a confidentiality agreement

Please confirm your acceptance by signing and returning this letter by [date].

We look forward to welcoming you to our team!

Sincerely,

_______________________
Authorized Signatory
${co}


ACCEPTED BY:

Signature: _______________________
Name: ${emp}
Date: ____________________________`;
  },

  poa: () => {
    const principal=getStr('l7-principal')||'[Principal]', agent=getStr('l7-agent')||'[Agent]';
    const powers=getStr('l7-powers')||'[Powers]', dur=getSel('l7-dur');
    const law=getStr('l7-law')||'[Jurisdiction]', date=formatDate(getStr('l7-date'));
    return `POWER OF ATTORNEY

KNOW ALL BY THESE PRESENTS that I, ${principal} ("Principal"), residing at [Address], hereby appoint ${agent} ("Agent"), residing at [Address], as my true and lawful attorney-in-fact.

GRANT OF AUTHORITY:
My Agent shall have full power and authority to act on my behalf in the following matters:
${powers}

DURATION:
This Power of Attorney shall be effective from ${date} and shall remain in force ${dur}.

THIRD-PARTY RELIANCE:
Third parties may rely upon the representations of my Agent as to all matters relating to any power granted to my Agent, and no person dealing with my Agent shall be responsible to inquire whether a Power of Attorney remains in force.

REVOCATION:
This Power of Attorney may be revoked by me at any time by providing written notice to my Agent and any relevant third parties.

GOVERNING LAW:
This instrument is executed and intended to be performed in ${law}.

PRINCIPAL SIGNATURE:

Signature: _______________________
Name: ${principal}
Date: ____________________________

NOTARIZATION:
State/Country of ________________
County/District of _______________

On this day personally appeared ${principal}, known to me to be the person described in the foregoing instrument.

Notary Public: ___________________
Commission expires: ______________`;
  },

  tos: () => {
    const name=getStr('l8-name')||'[Website]', url=getStr('l8-url')||'[URL]';
    const co=getStr('l8-company')||'[Company]', email=getStr('l8-email')||'[email]';
    const country=getSel('l8-country');
    return `TERMS OF SERVICE

Last updated: ${formatDate('')}

Please read these Terms of Service carefully before using ${url} operated by ${co}.

1. ACCEPTANCE OF TERMS
By accessing and using ${name}, you accept and agree to be bound by these Terms. If you do not agree, please do not use our Service.

2. USE OF SERVICE
You agree to use ${name} only for lawful purposes and in a manner that does not infringe the rights of others. You must not:
- Use the Service for any illegal purpose
- Attempt to gain unauthorized access to any part of the Service
- Transmit any harmful or disruptive content

3. INTELLECTUAL PROPERTY
All content on ${name}, including text, graphics, and software, is the property of ${co} and protected by intellectual property laws.

4. DISCLAIMER OF WARRANTIES
The Service is provided "AS IS" without warranties of any kind. We do not guarantee that the Service will be error-free or uninterrupted.

5. LIMITATION OF LIABILITY
To the maximum extent permitted by law, ${co} shall not be liable for any indirect, incidental, or consequential damages.

6. CALCULATOR ACCURACY
Our calculators provide estimates for informational purposes only. Always verify results with qualified professionals for important decisions.

7. PRIVACY
Your use of the Service is also governed by our Privacy Policy.

8. CHANGES TO TERMS
We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance.

9. GOVERNING LAW
These Terms shall be governed by the laws of ${country}.

10. CONTACT
For questions about these Terms, contact us at:
Email: ${email}
Website: ${url}`;
  }
};

function generateDoc(type) {
  const panelMap = {nda:'l1',rent:'l2',freelance:'l3',invoice:'l4',privacy:'l5',employment:'l6',poa:'l7',tos:'l8'};
  const id = panelMap[type];
  const content = docGenerators[type]();
  document.getElementById('doc-preview-'+id).textContent = content;
  document.getElementById('dl-'+id).style.display = 'flex';
}

function downloadDoc(id) {
  const content = document.getElementById('doc-preview-'+id).textContent;
  if(!content || content.includes('Fill in the form')) return;
  const names = {l1:'NDA',l2:'Rent_Agreement',l3:'Freelance_Contract',l4:'Invoice',l5:'Privacy_Policy',l6:'Employment_Letter',l7:'Power_of_Attorney',l8:'Terms_of_Service'};
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${names[id]}</title><style>body{font-family:'Times New Roman',serif;font-size:12pt;line-height:1.8;margin:2.5cm;color:#000;white-space:pre-wrap;word-wrap:break-word;}@page{margin:2.5cm;}@media print{body{margin:0;}}</style></head><body>${content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</body></html>`;
  const blob = new Blob([html],{type:'text/html'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = names[id]+'_ToolCalcHub.html';
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── SET TODAY DATE ──
document.querySelectorAll('input[type="date"]').forEach(el => {
  if(!el.value) el.value = new Date().toISOString().split('T')[0];
});

// ── ENTER KEY SUPPORT ──
// Map: panel id → calculator function
const enterKeyMap = {
  'solar-s1': calcS1, 'solar-s2': calcS2, 'solar-s3': calcS3,
  'solar-s4': calcS4, 'solar-s5': calcS5, 'solar-s7': calcS7,
  'solar-s8': calcS8, 'solar-s9': calcS9,
  'wind-w1': calcW1,  'wind-w2': calcW2,  'wind-w3': calcW3,
  'wind-w4': calcW4,  'wind-w5': calcW5,  'wind-w6': calcW6,
  'wind-w7': calcW7,  'wind-w8': calcW8,
  'salary-t1': calcT1,'salary-t2': calcT2,'salary-t3': calcT3,
  'salary-t4': calcT4,'salary-t5': calcT5,'salary-t6': calcT6,
};

// Attach keydown listener to every input & select inside calc panels
document.querySelectorAll('.calc-panel input, .calc-panel select').forEach(el => {
  el.addEventListener('keydown', function(e) {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    // Find which calc-panel this input belongs to
    const panel = el.closest('.calc-panel');
    if (!panel) return;

    const fn = enterKeyMap[panel.id];
    if (fn) {
      fn();
    } else if (panel.id && panel.id.startsWith('legal-')) {
      // Legal panels — find the generate button and click it
      const btn = panel.querySelector('.calc-btn');
      if (btn) btn.click();
    }
  });
});

// Also handle textarea in legal panels with Ctrl+Enter
document.querySelectorAll('.calc-panel textarea').forEach(el => {
  el.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const panel = el.closest('.calc-panel');
      if (!panel) return;
      const btn = panel.querySelector('.calc-btn');
      if (btn) btn.click();
    }
  });
});