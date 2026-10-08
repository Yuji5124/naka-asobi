import { prizeArt } from './extras.js';
const colors = ['#42aee0','#ef737f','#e7b62f','#56ad79','#a98bd4'];
const names = ['まっすぐ','くねくね','なみなみ','ジグザグ','かくかく'];
const paths = [
 'M0 65 L0 445',
 'M0 65 C-52 155 52 180 0 250 S-52 360 0 445',
 'M0 65 C65 125 -65 170 0 215 S65 305 0 350 S-45 410 0 445',
 'M0 65 L40 135 L-40 215 L40 295 L-40 375 L0 445',
 'M0 65 L0 145 L40 145 L40 225 L-35 225 L-35 305 L30 305 L30 385 L0 385 L0 445'
];
const prizes = ['rocket','bear','train','frog','balloon','robot','whale','cake','cat'];
export function ropeMenuView() {
 return `<main class="stage-menu"><div class="stage-top"><button class="back" data-go="select" aria-label="あそびをえらぶ">‹</button><span class="stage-label">なぞる</span></div><h1 class="screen-title">どれで あそぶ？</h1><div class="stage-choice-grid"><button class="stage-card" data-trace-letters><span class="rope-menu-icon">し ✏️</span><span><strong>もじを なぞる</strong><small>ゆびで すーっと</small></span></button><button class="stage-card" data-go="rope-trace"><span class="rope-menu-icon">〰️ 🎁</span><span><strong>なぞって くじびき</strong><small>すきな ひもを えらぼう</small></span></button></div></main>`;
}
export function ropeView(stage) {
 return `<main class="rope-screen"><div class="stage-top"><button class="back" data-go="trace-menu" aria-label="なぞるをえらぶ">‹</button><span class="stage-label">なぞって くじびき</span><span>ステージ ${stage} / 3</span></div><h1>どの ひもに する？</h1><p id="rope-message" role="status">まるを さわって、したまで なぞろう！</p><div class="rope-board"><svg id="rope-svg" viewBox="0 0 700 520" aria-label="好きなひもを指でなぞる"><rect width="700" height="520" rx="30" fill="#fffdf2"/>${paths.map((d,i)=>`<g transform="translate(${80+i*135} 0)" data-rope="${i}"><path class="rope-guide" d="${d}" stroke="${colors[i]}"/><circle class="rope-start" cx="0" cy="65" r="44" fill="${colors[i]}"/><text y="72" text-anchor="middle" fill="white" font-size="23">${i+1}</text><rect x="-38" y="459" width="76" height="48" rx="14" fill="${colors[i]}"/><text y="492" text-anchor="middle" font-size="29">🎁</text></g>`).join('')}<path id="rope-ink"/></svg><div id="rope-prize" hidden></div></div><div class="rope-footer"><span id="rope-progress">すきな ひもを えらんでね</span><button id="rope-reset">えらびなおす</button><button id="rope-next" hidden class="primary">つぎへ ›</button></div></main>`;
}
export function bindRope({stage,activate,tone,onSuccess,onNext}) {
 const svg=document.querySelector('#rope-svg'), ink=document.querySelector('#rope-ink'), message=document.querySelector('#rope-message'), progress=document.querySelector('#rope-progress');
 let choice=null,index=0,pointer=null,done=false,draw=[];
 const samples=Array.from(svg.querySelectorAll('.rope-guide'),(path,i)=>Array.from({length:101},(_,n)=>{const p=path.getPointAtLength(path.getTotalLength()*n/100);return {x:p.x+80+i*135,y:p.y};}));
 function point(e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse());}
 function move(e){if(pointer!==e.pointerId||done)return;e.preventDefault();const p=point(e), list=samples[choice];let best=index, distance=Infinity;for(let n=index;n<=Math.min(100,index+8);n++){const d=Math.hypot(p.x-list[n].x,p.y-list[n].y);if(d<distance){best=n;distance=d;}}if(distance>38)return;index=best;draw.push(p);ink.setAttribute('d',draw.map((v,n)=>`${n?'L':'M'}${v.x} ${v.y}`).join(' '));progress.textContent=`${Math.round(index)}%　そのまま すーっと！`;if(index>=97){done=true;pointer=null;tone(true);document.querySelector('.rope-screen h1').textContent='なにが でてきたかな？';message.textContent='でてきた！';progress.textContent='じぶんで えらんだ たからもの！';const prize=document.querySelector('#rope-prize');prize.hidden=false;prize.innerHTML=prizeArt(prizes[(choice+stage*2)%prizes.length]);document.querySelector('#rope-reset').hidden=true;document.querySelector('#rope-next').hidden=false;onSuccess();}}
 function down(e){if(done||pointer!==null)return;const p=point(e);if(choice===null){choice=samples.findIndex(list=>Math.hypot(p.x-list[0].x,p.y-list[0].y)<60);if(choice<0){choice=null;return;}svg.querySelectorAll('[data-rope]').forEach((g,i)=>g.classList.toggle('rope-muted',i!==choice));message.textContent=`${names[choice]}を なぞろう！`;ink.style.stroke=colors[choice];tone();}else if(Math.hypot(p.x-samples[choice][index].x,p.y-samples[choice][index].y)>45)return;pointer=e.pointerId;svg.setPointerCapture(pointer);move(e);}
 function up(e){if(pointer===e.pointerId)pointer=null;}
 function reset(){pointer=null;choice=null;index=0;draw=[];ink.setAttribute('d','');svg.querySelectorAll('[data-rope]').forEach(g=>g.classList.remove('rope-muted'));message.textContent='まるを さわって、したまで なぞろう！';progress.textContent='すきな ひもを えらんでね';}
 svg.addEventListener('pointerdown',down);svg.addEventListener('pointermove',move);svg.addEventListener('pointerup',up);svg.addEventListener('pointercancel',up);activate(document.querySelector('#rope-reset'),reset);activate(document.querySelector('#rope-next'),()=>onNext(stage));
 return ()=>{svg.removeEventListener('pointerdown',down);svg.removeEventListener('pointermove',move);svg.removeEventListener('pointerup',up);svg.removeEventListener('pointercancel',up);};
}
