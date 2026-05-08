document.addEventListener('DOMContentLoaded', () => {
  const hero = document.getElementById('hero');
  if (!hero) return;

  // ═══════════════════════════════════════════════════════════
  //  CONFIG
  // ═══════════════════════════════════════════════════════════
  const SCENES = [
    { key: 'stanley',    color: '#F5D800', label: 'Stanley',    number: '01', pRgb: '110,95,0',   badge: 'Stanley'    },
    { key: 'perfumeria', color: '#F4C06A', label: 'Perfumería', number: '02', pRgb: '155,95,15',  badge: 'Perfumería' },
    { key: 'cotillon',   color: '#DCE8EB', label: 'Cotillón',   number: '03', pRgb: '70,125,140', badge: 'Cotillón'   },
    { key: 'blanqueria', color: '#EDE0D4', label: 'Blanquería', number: '04', pRgb: '130,95,65',  badge: 'Blanquería' },
  ];

  const HOLD   = 0.8;
  const TRANS  = 0.6;
  const SMOOTH = 0.065;

  // ═══════════════════════════════════════════════════════════
  //  DOM
  // ═══════════════════════════════════════════════════════════
  const scenes = SCENES.map(s => ({
    ...s,
    title:    document.querySelector(`.${s.key}-title`),
    subtitle: document.querySelector(`.${s.key}-subtitle`),
    eyebrow:  document.querySelector(`.${s.key}-ey`),
    cta:      document.querySelector(`.${s.key}-cta`),
    glass:    document.querySelector(`.${s.key}-glass`),
    image:    document.querySelector(`.${s.key}-img`),
  })).filter(s => s.title);

  const progressBar = document.getElementById('progressBar');
  const sceneLabel  = document.getElementById('sceneLabel');
  const sceneNumber = document.getElementById('sceneNumber');
  const scrollInd   = document.getElementById('scrollIndicator');
  const navDots     = document.querySelectorAll('.nav-dot');
  const navNum      = document.getElementById('navNum');
  const decoLine    = document.getElementById('decoLine');
  const badgeCat    = document.getElementById('badgeCat');
  const productBadge= document.getElementById('productBadge');
  const siThumb     = document.getElementById('siThumb');
  const canvas      = document.getElementById('particles-canvas');
  const ctx         = canvas.getContext('2d');
  const cursorRing  = document.getElementById('cursorRing');
  const cursorDotEl = document.getElementById('cursorDot');

  // ═══════════════════════════════════════════════════════════
  //  MATH
  // ═══════════════════════════════════════════════════════════
  const clamp = (v,a,b) => Math.min(Math.max(v,a),b);
  const lerp  = (a,b,t) => a + (b-a)*t;
  // easeInOutQuart
  const ease  = t => t<.5 ? 8*t*t*t*t : 1-Math.pow(-2*t+2,4)/2;
  // easeOutCubic — para entradas más naturales
  const easeOut = t => 1-Math.pow(1-t,3);

  const hexToRgb = h => [
    parseInt(h.slice(1,3),16),
    parseInt(h.slice(3,5),16),
    parseInt(h.slice(5,7),16)
  ];
  const lerpRgbStr = (a,b,t) => {
    const ca=a.split(',').map(Number), cb=b.split(',').map(Number);
    return ca.map((v,i)=>Math.round(lerp(v,cb[i],t))).join(',');
  };
  const rgbToHsl = (r,g,b) => {
    r/=255;g/=255;b/=255;
    const max=Math.max(r,g,b),min=Math.min(r,g,b),l=(max+min)/2;
    if(max===min) return [0,0,l];
    const d=max-min,s=l>.5?d/(2-max-min):d/(max+min);
    let h;
    if(max===r)      h=(g-b)/d+(g<b?6:0);
    else if(max===g) h=(b-r)/d+2;
    else             h=(r-g)/d+4;
    return [h*60,s,l];
  };
  const hslToRgbStr = (h,s,l) => {
    const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;
    let r=0,g=0,b=0;
    if(h<60)       {r=c;g=x;}
    else if(h<120) {r=x;g=c;}
    else if(h<180) {g=c;b=x;}
    else if(h<240) {g=x;b=c;}
    else if(h<300) {r=x;b=c;}
    else           {r=c;b=x;}
    return `rgb(${Math.round((r+m)*255)},${Math.round((g+m)*255)},${Math.round((b+m)*255)})`;
  };

  // Vibrant HSL blend con pulso de saturación en el medio
  const vibrantBg = (hexA, hexB, t) => {
    const ca=hexToRgb(hexA), cb=hexToRgb(hexB);
    const ha=rgbToHsl(...ca), hb=rgbToHsl(...cb);
    let dh=hb[0]-ha[0];
    if(dh>180) dh-=360; if(dh<-180) dh+=360;
    const eT=ease(t);
    const h=(ha[0]+dh*eT+360)%360;
    const l=lerp(ha[2],hb[2],eT);
    const bell=Math.exp(-Math.pow((t-.5)/.17,2));
    const sBase=lerp(ha[1],hb[1],eT);
    const sMid=Math.max(ha[1],hb[1]);
    const s=sBase+(sMid-sBase+0.3)*bell;
    return hslToRgbStr(h,Math.min(s,1),l);
  };

  // ═══════════════════════════════════════════════════════════
  //  CURSOR PERSONALIZADO
  // ═══════════════════════════════════════════════════════════
  let mouseX=innerWidth/2, mouseY=innerHeight/2;
  let ringX=mouseX, ringY=mouseY;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if(cursorDotEl) {
      cursorDotEl.style.left = mouseX+'px';
      cursorDotEl.style.top  = mouseY+'px';
    }
  });

  function tickCursor() {
    ringX = lerp(ringX, mouseX, 0.12);
    ringY = lerp(ringY, mouseY, 0.12);
    if(cursorRing) {
      cursorRing.style.left = ringX+'px';
      cursorRing.style.top  = ringY+'px';
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  TIMELINE
  // ═══════════════════════════════════════════════════════════
  let timeline=[], totalScreens=0;

  function buildTimeline() {
    let c=0; const p=[];
    p.push({type:'hold',idx:0,start:c,end:c+HOLD}); c+=HOLD;
    for(let i=0;i<scenes.length-1;i++){
      p.push({type:'trans',from:i,to:i+1,start:c,end:c+TRANS}); c+=TRANS;
      p.push({type:'hold',idx:i+1,start:c,end:c+HOLD});          c+=HOLD;
    }
    timeline=p; totalScreens=c;
    document.body.style.minHeight=`${(1+totalScreens)*100}vh`;
  }

  const getPhase  = s => timeline.find(p=>s<=p.end)||timeline[timeline.length-1];
  const getScroll = () => clamp(scrollY/innerHeight,0,totalScreens);

  // ═══════════════════════════════════════════════════════════
  //  PARTICLES
  // ═══════════════════════════════════════════════════════════
  let particles=[], pFrom=SCENES[0].pRgb, pTo=SCENES[0].pRgb, pT=1;

  function resizeCanvas() {
    canvas.width=hero.offsetWidth;
    canvas.height=hero.offsetHeight;
  }

  function spawnParticles() {
    const n=Math.floor(canvas.width/20);
    particles=Array.from({length:n},()=>({
      x:Math.random()*canvas.width,
      y:Math.random()*canvas.height,
      r:.5+Math.random()*2,
      vx:(Math.random()-.5)*.18,
      vy:-.08-Math.random()*.28,
      a:.03+Math.random()*.10,
      phase:Math.random()*Math.PI*2,
    }));
  }

  function tickParticles(t) {
    if(pT<1) pT=Math.min(1,pT+0.016);
    const rgb=lerpRgbStr(pFrom,pTo,ease(pT));
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy;
      p.phase+=0.008;
      if(p.y<-8){ p.y=canvas.height+4; p.x=Math.random()*canvas.width; }
      if(p.x<-8)  p.x=canvas.width+4;
      if(p.x>canvas.width+8) p.x=-4;
      // Pulso de alpha suave
      const a=p.a*(0.7+0.3*Math.sin(p.phase));
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(${rgb},${a})`;
      ctx.fill();
    });
  }

  function setParticleColor(rgb) {
    pFrom=lerpRgbStr(pFrom,pTo,pT);
    pTo=rgb; pT=0;
  }

  // ═══════════════════════════════════════════════════════════
  //  SCENE RENDER — clip-path reveal + blur entrada
  // ═══════════════════════════════════════════════════════════

  // Helper para las nuevas animaciones de texto
  function applyTextMotion(el, t, direction) {
    if (!el) return;
    const eT = ease(t);
    
    if (direction === 'in') {
      // slide-in-blurred-bottom (basado en tus keyframes)
      const ty = lerp(1000, 0, eT);
      const sy = lerp(2.5, 1, eT);
      const sx = lerp(0.2, 1, eT);
      const blur = lerp(40, 0, eT);
      const op = lerp(0, 1, eT);
      
      el.style.transform = `translateY(${ty.toFixed(1)}px) scaleY(${sy.toFixed(3)}) scaleX(${sx.toFixed(3)})`;
      el.style.transformOrigin = eT < 0.9 ? '50% 100%' : '50% 50%';
      el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(1)}px)` : 'none';
      el.style.opacity = op.toFixed(4);
      el.style.clipPath = 'none';
    } else {
      // slide-out-bck-top (basado en tus keyframes)
      const ty = lerp(0, -1000, eT);
      const tz = lerp(1, -1100, eT);
      const op = lerp(1, 0, eT);
      
      el.style.transform = `translateZ(${tz.toFixed(1)}px) translateY(${ty.toFixed(1)}px)`;
      el.style.opacity = op.toFixed(4);
      el.style.filter = 'none';
      el.style.clipPath = 'none';
    }
  }

  function applyTitle(sc, t, direction) {
    applyTextMotion(sc.title, t, direction);
  }

  function applyEyebrow(sc, t, direction) {
    applyTextMotion(sc.eyebrow, t, direction);
  }

  function applySubtitle(sc, t, direction) {
    applyTextMotion(sc.subtitle, t, direction);
  }

  function applyCta(sc, t, direction) {
    applyTextMotion(sc.cta, t, direction);
  }

  function applyImage(sc, t, direction) {
    if (!sc.image || !sc.glass) return;
    const eT = ease(t);
    
    if (direction === 'in') {
      const ty = lerp(1000, 0, eT);
      const sy = lerp(2.5, 1, eT);
      const sx = lerp(0.2, 1, eT);
      const blur = lerp(40, 0, eT);
      const op = lerp(0, 1, eT);
      
      const imgFilt = `blur(${blur.toFixed(1)}px) drop-shadow(0 28px 56px rgba(0,0,0,0.22))`;
      
      sc.image.style.transform = `translateY(${ty.toFixed(1)}px) scaleY(${sy.toFixed(3)}) scaleX(${sx.toFixed(3)}) rotate(1deg)`;
      sc.image.style.opacity   = op.toFixed(4);
      sc.image.style.filter    = blur > 0.05 ? imgFilt : 'drop-shadow(0 28px 56px rgba(0,0,0,0.22))';
      
      sc.glass.style.transform = `translateY(${ty.toFixed(1)}px) scaleY(${sy.toFixed(3)}) scaleX(${sx.toFixed(3)}) rotate(8deg)`;
      sc.glass.style.opacity   = op.toFixed(4);
      sc.glass.style.filter    = blur > 0.05 ? `blur(${blur.toFixed(1)}px)` : 'none';
      
    } else {
      const ty = lerp(0, -1000, eT);
      const tz = lerp(1, -1100, eT);
      const op = lerp(1, 0, eT);
      
      sc.image.style.transform = `translateZ(${tz.toFixed(1)}px) translateY(${ty.toFixed(1)}px) rotate(1deg)`;
      sc.image.style.opacity   = op.toFixed(4);
      sc.image.style.filter    = 'drop-shadow(0 28px 56px rgba(0,0,0,0.22))';
      
      sc.glass.style.transform = `translateZ(${tz.toFixed(1)}px) translateY(${ty.toFixed(1)}px) rotate(8deg)`;
      sc.glass.style.opacity   = op.toFixed(4);
      sc.glass.style.filter    = 'none';
    }
  }

  function hideScene(sc) {
    sc.image.classList.remove('img-floating');
    [sc.eyebrow, sc.title, sc.subtitle, sc.cta].forEach(el => {
      if(el) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(1000px) scaleY(2.5) scaleX(0.2)';
      }
    });
    applyImage(sc, 0, 'in');
  }

  function showScene(sc) {
    applyEyebrow(sc,  1, 'in');
    applyTitle(sc,    1, 'in');
    applySubtitle(sc, 1, 'in');
    applyCta(sc,      1, 'in');
    applyImage(sc,    1, 'in');
    sc.image.classList.add('img-floating');
  }

  // t: 0→1 (progreso de esta escena), direction: 'in'|'out'
  function interpScene(sc, t, direction) {
    sc.image.classList.remove('img-floating');
    const eT = ease(t);

    if (direction === 'in') {
      // Eyebrow — primero
      const tEy     = clamp(t / 0.6, 0, 1);
      applyEyebrow(sc, tEy, 'in');

      // Título
      applyTitle(sc, t, 'in');

      // Subtítulo: retraso 15%
      const tSub    = clamp((t - .15) / .85, 0, 1);
      applySubtitle(sc, tSub, 'in');

      // CTA: retraso 30%
      const tCta    = clamp((t - .30) / .70, 0, 1);
      applyCta(sc, tCta, 'in');

      // Imagen
      applyImage(sc, t, 'in');

    } else {
      // Salida
      applyEyebrow(sc,  t, 'out');
      applyTitle(sc,    t, 'out');
      applySubtitle(sc, t, 'out');
      applyCta(sc,      t, 'out');

      // Imagen
      applyImage(sc, t, 'out');
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  HUD — actualizaciones de UI
  // ═══════════════════════════════════════════════════════════
  let lastIdx=-1, decoTmr=null;

  function updateHUD(idx) {
    if(idx===lastIdx) return;
    lastIdx=idx;
    const sc=scenes[idx];

    // Label lateral
    if(sceneLabel){
      sceneLabel.style.opacity='0';
      sceneLabel.style.transform='rotate(180deg) translateY(-8px)';
      setTimeout(()=>{
        sceneLabel.textContent=sc.label;
        sceneLabel.style.opacity='1';
        sceneLabel.style.transform='rotate(180deg) translateY(0)';
      },220);
    }

    // Número de escena
    if(sceneNumber){
      sceneNumber.style.opacity='0';
      setTimeout(()=>{ sceneNumber.textContent=sc.number; sceneNumber.style.opacity='1'; },180);
    }

    // Nav counter
    if(navNum){ navNum.style.opacity='0'; setTimeout(()=>{ navNum.textContent=sc.number; navNum.style.opacity='1'; },160); }

    // Nav dots — pill activo
    navDots.forEach((d,i)=>d.classList.toggle('active',i===idx));

    // Badge
    if(badgeCat) badgeCat.textContent=sc.badge;
    if(productBadge){
      productBadge.classList.remove('visible');
      setTimeout(()=>productBadge.classList.add('visible'),400);
    }

    // Deco line — redraw
    if(decoTmr) clearTimeout(decoTmr);
    if(decoLine){
      decoLine.style.transition='none';
      decoLine.style.width='0px';
      decoTmr=setTimeout(()=>{
        decoLine.style.transition='width 1s cubic-bezier(0.16,1,0.3,1)';
        decoLine.style.width='clamp(60px,10vw,140px)';
      },60);
    }

    setParticleColor(sc.pRgb);
  }

  // ═══════════════════════════════════════════════════════════
  //  RENDER PRINCIPAL
  // ═══════════════════════════════════════════════════════════
  function render(s) {
    const pct = s/totalScreens;

    // Progress bar
    if(progressBar) progressBar.style.width=`${(pct*100).toFixed(2)}%`;

    // Scroll indicator thumb
    if(siThumb) siThumb.style.height=`${(pct*100).toFixed(1)}%`;

    // Scroll indicator opacity
    if(scrollInd) scrollInd.style.opacity=scrollY<80?'1':'0.6';

    const phase=getPhase(s);

    if(phase.type==='hold'){
      scenes.forEach((sc,i)=> i===phase.idx ? showScene(sc) : hideScene(sc));
      updateHUD(phase.idx);
      document.body.style.backgroundColor=scenes[phase.idx].color;
      return;
    }

    const raw=clamp((s-phase.start)/(phase.end-phase.start),0,1);
    scenes.forEach((sc,i)=>{
      if(i===phase.from)      interpScene(sc,raw,'out');
      else if(i===phase.to)   interpScene(sc,raw,'in');
      else                    hideScene(sc);
    });

    updateHUD(raw>.5?phase.to:phase.from);
    document.body.style.backgroundColor=vibrantBg(
      scenes[phase.from].color, scenes[phase.to].color, raw
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  LOOP
  // ═══════════════════════════════════════════════════════════
  let rendered=0, target=0;

  function loop() {
    rendered += (target-rendered)*SMOOTH;
    tickCursor();
    tickParticles();
    render(rendered);
    requestAnimationFrame(loop);
  }

  // ═══════════════════════════════════════════════════════════
  //  INIT
  // ═══════════════════════════════════════════════════════════
  resizeCanvas();
  spawnParticles();
  buildTimeline();
  target=rendered=getScroll();
  render(rendered);
  updateHUD(0);

  window.addEventListener('scroll',()=>{ target=getScroll(); },{passive:true});
  window.addEventListener('resize',()=>{
    resizeCanvas(); spawnParticles(); buildTimeline(); target=getScroll();
  });

  requestAnimationFrame(loop);
});
