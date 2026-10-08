const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8133';
const artifacts = process.env.TEST_ARTIFACT_DIR || '/tmp/link-color-levels';
fs.mkdirSync(artifacts, { recursive: true });
const key = 'hiragana-asobi-v1';

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  for (const viewport of [{width:1024,height:768}, {width:768,height:1024}, {width:390,height:844}]) {
    const page = await browser.newPage({ viewport, hasTouch: true, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base);
    await page.evaluate(key => localStorage.setItem(key, JSON.stringify({sound:false, totalPoints:0})), key);
    await page.reload();
    const restored = await page.evaluate(async () => {
      const { readExperiment } = await import('./experiment.js');
      const progress = {'number-link':2, coloring:3, 'number-link:2':3, 'number-link:3':2, 'coloring:2':2};
      const old = {gameId:'coloring', stageId:'coloring-S1', startedAt:new Date().toISOString(), durationSec:3, completed:true};
      const data = readExperiment({stageProgress:progress, sessions:[old]});
      return {progress:data.stageProgress, sessions:data.sessions.length};
    });
    assert.deepEqual(restored.progress, {'number-link':2, coloring:3, 'number-link:2':3, 'number-link:3':2, 'coloring:2':2});
    assert.equal(restored.sessions, 1, 'existing coloring logs must survive reload');
    const homeSelect = async () => {
      if (!(await page.locator('#start').count())) await page.locator('.brand').tap();
      await page.locator('#start').tap();
    };
    const screenshot = label => page.screenshot({path:`${artifacts}/${viewport.width}-${label}.png`, fullPage:true});
    for (const level of [1,2,3]) {
      await homeSelect();
      await page.locator('[data-stage="2"]').tap();
      await page.locator('[data-go="number-link-levels"]').tap();
      assert.equal(await page.locator('[data-level-game="number-link"]').count(),3);
      if(viewport.width>600) assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight),viewport.height,'tablet level menu must fit');
      await page.locator(`[data-level-game="number-link"][data-level="${level}"]`).tap();
      for (const stage of [1,2,3]) {
        const pairs = [[1,2,3],[2,3,4],[4,5,6]][level-1][stage-1];
        assert.match(await page.locator('.number-link-heading p').innerText(),new RegExp(`レベル ${level}.*ステージ ${stage}`));
        const nodes = page.locator('.number-sticker');
        assert.equal(await nodes.count(),pairs*2);
        const bounds = await nodes.evaluateAll(elements => elements.map(e => {const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}}));
        for (let i=0;i<bounds.length;i++) for (let j=i+1;j<bounds.length;j++) {
          const a=bounds[i],b=bounds[j];
          assert.ok(a.x+a.w<=b.x || b.x+b.w<=a.x || a.y+a.h<=b.y || b.y+b.h<=a.y,'number stickers must not overlap');
        }
        if (viewport.width>600) assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight),viewport.height,'tablet play screen must fit');
        if (level===3 && stage===3) await screenshot('scattered-before');
        if(level===2 && stage===1){
          const a=await page.locator('[data-value="1"]').first().boundingBox(),wrong=await page.locator('[data-value="2"]').first().boundingBox();
          await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(wrong.x+wrong.width/2,wrong.y+wrong.height/2,{steps:3});await page.mouse.up();
          assert.equal(await page.locator('#finished-lines path').count(),0,'different numbers must not connect');
          await page.waitForTimeout(350);
        }
        for (let number=1;number<=pairs;number++) {
          const matches = page.locator(`[data-value="${number}"]`);
          const a=await matches.nth(0).boundingBox(), b=await matches.nth(1).boundingBox();
          await page.mouse.move(a.x+a.width/2,a.y+a.height/2); await page.mouse.down();
          assert.deepEqual(await matches.nth(0).boundingBox(),a,'press must keep the number in place');
          await page.mouse.move((a.x+a.width/2+b.x+b.width/2)/2,(a.y+a.height/2+b.y+b.height/2)/2,{steps:3});
          assert.notEqual(await page.locator('#preview-line').evaluate(e=>getComputedStyle(e).display),'none');
          await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:3}); await page.mouse.up();
          assert.equal(await page.locator('#finished-lines path').count(),number,'the drawn lines stay on the paper');
        }
        assert.ok(await page.locator('#number-link-next').isVisible());
        if (level===3 && stage===3) await screenshot('scattered-complete');
        await page.locator('#number-link-next').tap();
      }
      console.log(`PASS ${viewport.width}: number links level ${level}, all 3 stages`);
    }
    assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).totalPoints,key),3);
    await homeSelect();
    await page.locator('[data-category-page="1"]').tap();
    await page.locator('[data-go="coloring-levels"]').tap();
    assert.equal(await page.locator('[data-level-game="coloring"]').count(),2);
    await page.locator('[data-level-game="coloring"][data-level="2"]').tap();
    for (const stage of [1,2,3]) {
      assert.equal(await page.locator('.color-swatch').count(),stage);
      const canvas=page.locator('#freepaint-canvas');
      const r=await canvas.boundingBox();
      assert.ok(r.width>=200 && r.height>=200,'painting canvas should be large enough');
      if (viewport.width>600) assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight),viewport.height);
      const at=(x,y)=>({x:r.x+x*r.width/400,y:r.y+y*r.height/400});
      const tap=at(200,200);
      const cdp=await page.context().newCDPSession(page);
      if(viewport.width>600){
        await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',x:tap.x,y:tap.y,button:'left',clickCount:1,pointerType:'pen'});
        await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:tap.x,y:tap.y,button:'left',clickCount:1,pointerType:'pen'});
      }else{
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[tap]});
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      }
      assert.ok(await page.locator('#freepaint-progress').evaluate(e=>e.value)>0,'pen/touch input should leave paint');
      await cdp.detach();
      assert.ok(!(await page.locator('#coloring-next').isVisible()),'one tap must not fill the entire shape');
      if(stage===2) await page.locator('[data-color="blue"]').tap();
      if(stage===1) await screenshot('freepaint-partial');
      for(let y=65;y<=345 && !(await page.locator('#coloring-next').isVisible());y+=28){
        const from=at(40,y),to=at(360,y);
        await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:12});await page.mouse.up();
      }
      assert.ok(await page.locator('#coloring-next').isVisible(),'broad strokes should complete the shape');
      assert.equal(await canvas.evaluate(e=>e.getContext('2d').getImageData(0,0,1,1).data[3]),0,'paint must be clipped to the shape');
      if(stage===3) await screenshot('freepaint-complete');
      await page.locator('#coloring-next').tap();
      if(stage===1){
        await page.reload();await homeSelect();await page.locator('[data-category-page="1"]').tap();await page.locator('[data-go="coloring-levels"]').tap();await page.locator('[data-level-game="coloring"][data-level="2"]').tap();
        assert.match(await page.locator('.stage-label').innerText(),/2\/3/,'level 2 stage progress should survive reload');
      }
    }
    const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
    assert.equal(saved.totalPoints,4,'each completed three-stage level earns one point');
    assert.equal(saved.stageProgress['coloring:2'],1);
    assert.ok(saved.sessions.some(s=>s.gameId==='coloring' && s.level===2 && s.completed));
    assert.deepEqual(errors,[]);
    console.log(`PASS ${viewport.width}: free painting, clipping, reload, points and logs`);
    await homeSelect();await page.locator('[data-category-page="1"]').tap();await page.locator('[data-go="coloring-levels"]').tap();await page.locator('[data-level-game="coloring"][data-level="1"]').tap();
    for(const stage of [1,2,3]){
      for(let i=0;i<stage;i++){await page.locator('.color-swatch').nth(i).tap();await page.locator('.paint-shape').nth(i).tap();}
      assert.ok(await page.locator('#coloring-next').isVisible());await page.locator('#coloring-next').tap();
    }
    const legacy=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
    assert.equal(legacy.totalPoints,5);assert.equal(legacy.coinBalance,1);
    assert.equal(legacy.stageProgress.coloring,1);assert.equal(legacy.stageProgress['coloring:2'],1);
    console.log(`PASS ${viewport.width}: original tap coloring and fifth-point coin`);
    await page.close();
  }
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
