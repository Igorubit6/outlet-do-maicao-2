/* Som sintetizado no navegador: leve, sem downloads ou áudio de terceiros. */
(() => {
  'use strict';
  let audio, enabled = true, frame = 0, played = false;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = document.getElementById('sound-toggle');
  function arm() {
    if (!enabled) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      audio = audio || new Audio();
      if (audio.state === 'suspended') audio.resume().catch(() => {});
    } catch { /* A festa visual continua se o dispositivo bloquear áudio. */ }
  }
  function chime() {
    if (!enabled || !audio || audio.state !== 'running') return;
    try {
      const now = audio.currentTime;
      [523.25,659.25,783.99,1046.5].forEach((hz,i) => {
        const oscillator = audio.createOscillator(), gain = audio.createGain();
        oscillator.type = 'triangle'; oscillator.frequency.value = hz;
        const at = now + i * .12;
        gain.gain.setValueAtTime(.0001,at); gain.gain.exponentialRampToValueAtTime(.12,at+.025); gain.gain.exponentialRampToValueAtTime(.0001,at+.65);
        oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(at); oscillator.stop(at+.7);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      });
      [523.25,659.25,783.99].forEach(hz => {
        const oscillator = audio.createOscillator(), gain = audio.createGain();
        oscillator.type = 'sine'; oscillator.frequency.value = hz;
        gain.gain.setValueAtTime(.0001,now+.62); gain.gain.exponentialRampToValueAtTime(.05,now+.66); gain.gain.exponentialRampToValueAtTime(.0001,now+1.5);
        oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(now+.62); oscillator.stop(now+1.55);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      });
    } catch { /* Efeitos nunca bloqueiam o cupom. */ }
  }
  function confetti() {
    if (reduced.matches) return;
    const canvas = document.getElementById('confetti'), ctx = canvas.getContext('2d');
    if (!ctx) return;
    cancelAnimationFrame(frame);
    const width = window.innerWidth, height = window.innerHeight, scale = Math.min(devicePixelRatio || 1,2);
    canvas.width=width*scale; canvas.height=height*scale; ctx.setTransform(scale,0,0,scale,0,0); canvas.hidden=false;
    const colors=['#edc452','#254788','#c9222e','#3a9c77','#a08ce0'];
    const pieces=Array.from({length:width<600?65:100},()=>({x:Math.random()*width,y:-Math.random()*height*.7,vx:(Math.random()-.5)*100,vy:110+Math.random()*110,angle:Math.random()*6.28,spin:(Math.random()-.5)*9,w:5+Math.random()*5,h:4+Math.random()*6,color:colors[Math.floor(Math.random()*colors.length)]}));
    let before=performance.now(), elapsed=0;
    function tick(now){
      const dt=Math.min((now-before)/1000,.04);before=now;elapsed+=dt;
      ctx.clearRect(0,0,width,height);ctx.globalAlpha=Math.min(1,(3.4-elapsed)/.65);
      for(const p of pieces){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=50*dt;p.angle+=p.spin*dt;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle=p.color;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();}
      if(elapsed<3.4&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick);else{canvas.hidden=true;ctx.clearRect(0,0,width,height);}
    }
    frame=requestAnimationFrame(tick);
  }
  function play(replay=false){
    if(played&&!replay)return;played=true;
    try{confetti();chime();}catch{/* Sem impacto na revelação. */}
  }
  toggle.addEventListener('click',()=>{enabled=!enabled;toggle.textContent=enabled?'Som ligado':'Som desligado';toggle.setAttribute('aria-pressed',String(enabled));toggle.setAttribute('aria-label',enabled?'Som de comemoração ligado. Toque para silenciar.':'Som de comemoração desligado. Toque para ativar.');if(enabled)arm();else if(audio)audio.suspend().catch(()=>{});});
  document.getElementById('replay-celebration')?.addEventListener('click',()=>{arm();setTimeout(()=>play(true),80);});
  window.MaicaoCelebration={arm,play};
})();
