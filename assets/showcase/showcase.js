(() => {
  'use strict';
  const canvas = document.getElementById('pattern');
  const ctx = canvas.getContext('2d');
  const palettes = [
    { name: '黛蓝描金', ground: '#142e38', thread: '#c2a66a', accent: '#91a6a0' },
    { name: '朱砂缃金', ground: '#67312e', thread: '#d7b97e', accent: '#a9795e' },
    { name: '月白墨青', ground: '#e7e5da', thread: '#315057', accent: '#b49b6b' },
  ];
  const state = { palette: 0, repeat: 'straight', scale: 100 };
  const isWeChat=/MicroMessenger/i.test(navigator.userAgent);
  const names = { straight: '平排', halfdrop: '半落' };
  function petal(radius, width) {
    ctx.beginPath(); ctx.moveTo(0, -radius * .16);
    ctx.bezierCurveTo(-width, -radius * .55, -width * .62, -radius * .96, 0, -radius);
    ctx.bezierCurveTo(width * .62, -radius * .96, width, -radius * .55, 0, -radius * .16);
    ctx.closePath(); ctx.stroke();
  }
  function flower(x, y, radius, palette) {
    ctx.save(); ctx.translate(x,y); ctx.strokeStyle = palette.thread; ctx.lineWidth = .95;
    for(let i=0;i<12;i++) { ctx.save(); ctx.rotate(i*Math.PI/6); petal(radius*.87,radius*.20);ctx.restore(); }
    ctx.strokeStyle=palette.accent;ctx.lineWidth=.65;
    for(let i=0;i<12;i++) { ctx.save(); ctx.rotate(i*Math.PI/6+Math.PI/12);petal(radius*.71,radius*.13);ctx.restore(); }
    ctx.strokeStyle=palette.thread;
    for(let i=0;i<8;i++) { ctx.save();ctx.rotate(i*Math.PI/4);petal(radius*.38,radius*.10);ctx.restore(); }
    ctx.beginPath();ctx.arc(0,0,radius*.105,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(0,0,radius*.058,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<24;i++) { const a=i*Math.PI/12;ctx.beginPath();ctx.arc(Math.cos(a)*radius*.97,Math.sin(a)*radius*.97,1.4,0,Math.PI*2);ctx.fillStyle=palette.thread;ctx.fill(); }
    ctx.restore();
  }
  function leaf(x,y,r,angle,palette) {
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.strokeStyle=palette.thread;ctx.lineWidth=.65;
    ctx.beginPath();ctx.moveTo(0,r);ctx.bezierCurveTo(-r*.55,r*.12,-r*.4,-r*.5,0,-r);ctx.bezierCurveTo(r*.4,-r*.5,r*.55,r*.12,0,r);ctx.stroke();ctx.beginPath();ctx.moveTo(0,r);ctx.lineTo(0,-r*.8);ctx.stroke();ctx.restore();
  }
  function render() {
    if(!ctx)return;
    const p=palettes[state.palette], size=canvas.width, step=250*state.scale/100;
    ctx.fillStyle=p.ground;ctx.fillRect(0,0,size,size);
    ctx.strokeStyle=p.thread;ctx.globalAlpha=.055;ctx.lineWidth=.7;
    for(let n=0;n<size;n+=5){ctx.beginPath();ctx.moveTo(n,0);ctx.lineTo(n,size);ctx.stroke();ctx.beginPath();ctx.moveTo(0,n);ctx.lineTo(size,n);ctx.stroke();}ctx.globalAlpha=1;
    for(let col=-1;col<=Math.ceil(size/step);col++) {
      const offset=state.repeat==='halfdrop' && Math.abs(col)%2 ? step/2 : 0;
      for(let row=-1;row<=Math.ceil(size/step);row++) {
        const x=col*step+step/2,y=row*step+step/2+offset;
        flower(x,y,step*.40,p);
        leaf(x+step*.5,y,step*.14,Math.PI/2,p);leaf(x,y+step*.5,step*.14,0,p);
      }
    }
    document.getElementById('pattern-number').textContent=`0${state.palette+1} / ${p.name}`;
    canvas.setAttribute('aria-label',`${p.name}配色、${names[state.repeat]}、${state.scale}%尺度的几何团花纹样预览`);
  }
  document.querySelectorAll('[data-palette]').forEach(button => button.addEventListener('click',()=>{
    state.palette=Number(button.dataset.palette);
    document.querySelectorAll('[data-palette]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    render();document.getElementById('demo-status').textContent=`已切换为${palettes[state.palette].name}配色`;
  }));
  document.querySelectorAll('[data-repeat]').forEach(button => button.addEventListener('click',()=>{
    state.repeat=button.dataset.repeat;
    document.querySelectorAll('[data-repeat]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    document.getElementById('repeat-description').textContent=state.repeat==='straight'?'单元横纵对齐，形成整齐的网格节奏。':'相邻列错开半个单元，让排列产生流动感。';
    render();document.getElementById('demo-status').textContent=`已切换为${names[state.repeat]}`;
  }));
  let paintRequested=false;
  document.getElementById('scale').addEventListener('input',event=>{
    state.scale=Number(event.target.value);document.getElementById('scale-value').textContent=`${state.scale}%`;
    if(!paintRequested){paintRequested=true;requestAnimationFrame(()=>{render();paintRequested=false;});}
  });
  const dialog=document.getElementById('image-dialog');
  const closeButton=document.getElementById('close-dialog');
  const saveButton=document.getElementById('save-pattern');
  const background=[document.querySelector('main'),document.querySelector('header')];
  function closeDialog(){dialog.hidden=true;document.body.style.overflow='';background.forEach(el=>{el.inert=false;el.removeAttribute('aria-hidden');});saveButton.focus();}
  saveButton.addEventListener('click',()=>{
    render();const image=canvas.toDataURL('image/png');
    document.getElementById('saved-image').src=image;
    const link=document.getElementById('download-image');link.href=image;link.download=`锦序-${palettes[state.palette].name}-${names[state.repeat]}.png`;
    link.hidden=isWeChat;
    dialog.hidden=false;document.body.style.overflow='hidden';closeButton.focus();background.forEach(el=>{el.inert=true;el.setAttribute('aria-hidden','true');});
  });
  closeButton.addEventListener('click',closeDialog);
  dialog.addEventListener('click',event=>{if(event.target===dialog)closeDialog();});
  dialog.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();closeDialog();}
    if(event.key==='Tab'){
      const last=isWeChat?closeButton:document.getElementById('download-image');
      if(event.shiftKey&&document.activeElement===closeButton){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();closeButton.focus();}
    }
  });
  if(isWeChat){document.getElementById('case-download-note').textContent='设计包需在系统浏览器中下载。微信内可先体验纹样，长按保存图片。';}
  if('IntersectionObserver' in window){
    document.documentElement.classList.add('js-enhanced');
    const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}});},{threshold:.08});
    document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
  }
  const progress=document.querySelector('.reading-progress');let scheduled=false;
  function updateProgress(){const total=document.documentElement.scrollHeight-window.innerHeight;progress.style.transform=`scaleX(${total>0?Math.min(1,Math.max(0,window.scrollY/total)):0})`;scheduled=false;}
  window.addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(updateProgress);}},{passive:true});
  render();updateProgress();
})();
