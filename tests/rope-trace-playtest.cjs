const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 for(const viewport of [{width:1024,height:768},{width:768,height:1024},{width:390,height:844}].filter(v=>!process.env.TEST_WIDTH||v.width===Number(process.env.TEST_WIDTH))){
  const page=await browser.newPage({viewport,hasTouch:true,reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:8135');
  await page.evaluate(()=>localStorage.setItem('hiragana-asobi-v1',JSON.stringify({sound:false,totalPoints:0})));await page.reload();await page.locator('#start').tap();await page.locator('[data-stage="1"]').tap();await page.locator('[data-trace-letters]').tap();assert.equal(await page.locator('#drawing').count(),1,'existing letter tracing remains available');
  await page.locator('.brand').tap();await page.locator('#start').tap();await page.locator('[data-stage="1"]').tap();await page.locator('[data-go="rope-trace"]').tap();
  const points=async i=>page.evaluate(i=>{const svg=document.querySelector('#rope-svg'),path=svg.querySelectorAll('.rope-guide')[i],matrix=path.getScreenCTM();return Array.from({length:201},(_,n)=>{const p=path.getPointAtLength(path.getTotalLength()*n/200),q=svg.createSVGPoint();q.x=p.x;q.y=p.y;const v=q.matrixTransform(matrix);return {x:v.x,y:v.y};});},i);
  const touch = await page.context().newCDPSession(page);
  const drag=async(list,start,end)=>{if(viewport.width===390){await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[list[start]]});for(let n=start;n<=end;n++)await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[list[n]]});await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});return;}await page.mouse.move(list[start].x,list[start].y);await page.mouse.down();for(let n=start;n<=end;n++)await page.mouse.move(list[n].x,list[n].y);await page.mouse.up();};
  for(let i=0;i<5;i++){
   const list=await points(i);await page.mouse.move(list[0].x,list[0].y);await page.mouse.down();await page.mouse.move(list[200].x,list[200].y);await page.mouse.up();assert.equal(await page.locator('#rope-next').isVisible(),false,'jumping straight to the prize must not complete');
   await drag(list,0,100);assert((await page.locator('#rope-ink').getAttribute('d')).length>50,'live tracing line is visible before completion');assert.equal(await page.locator('#rope-next').isVisible(),false);
   if(i<2){await page.locator('#rope-reset').tap();continue;}
   await drag(list,100,200);assert.equal(await page.locator('#rope-next').isVisible(),true,'resume and finish selected path');assert.equal(await page.locator('#rope-prize').isVisible(),true);assert((await page.locator('#rope-ink').getAttribute('d')).length>50,'line remains after completion');
   await page.waitForTimeout(i === 4 ? 250 : 1600);
   assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),'no vertical scroll');
   await page.screenshot({path:`/tmp/rope-${viewport.width}-stage${i-1}.png`});
   await page.locator('#rope-next').tap();
  }
  const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('hiragana-asobi-v1')));assert.equal(data.totalPoints,1);assert.equal(data.sessions.filter(s=>s.gameId==='rope-trace'&&s.completed).length,3);assert.equal(data.stageProgress['rope-trace'],1);
  await page.reload();const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('hiragana-asobi-v1')));assert.equal(restored.totalPoints,1);assert.equal(restored.sessions.filter(s=>s.gameId==='rope-trace').length,3);assert.deepEqual(errors,[]);await page.close();console.log(`PASS ${viewport.width}x${viewport.height}`);
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
