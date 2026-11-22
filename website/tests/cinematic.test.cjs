const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const page=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'cinematic.js'),'utf8');
const css=fs.readFileSync(path.join(root,'cinematic.css'),'utf8');
function environment(t){
  const dom=new JSDOM(page,{url:'https://www.firstmilkventure.com/',runScripts:'outside-only'});
  t.after(()=>dom.window.close());
  const w=dom.window;
  w.matchMedia=()=>({matches:false,addEventListener(){}});
  w.requestAnimationFrame=(fn)=>{fn();return 1};
  w.cancelAnimationFrame=()=>{};
  w.eval(js);
  return w;
}
test('3D hero has four labeled, accessible product choices',t=>{
  const w=environment(t);
  const choices=[...w.document.querySelectorAll('#fmv-cinema [data-fmv-product]')];
  assert.deepEqual(choices.map(x=>x.dataset.fmvProduct),['milk','ghee','curd','butter']);
  assert.equal(choices[0].getAttribute('aria-pressed'),'true');
  assert.ok(w.document.getElementById('fmv-3d-scene'));
  assert.ok(w.document.getElementById('fmv-package-title'));
});
test('product switching updates visuals, package, and accessible state',t=>{
  const w=environment(t);
  const ghee=w.document.querySelector('[data-fmv-product="ghee"]');
  ghee.click();
  assert.equal(w.document.getElementById('fmv-cinema').dataset.product,'ghee');
  assert.equal(w.document.getElementById('fmv-package-title').textContent,'PURE COW GHEE');
  assert.equal(w.document.getElementById('fmv-cinema-product-title').textContent,'Pure Cow Ghee');
  assert.equal(ghee.getAttribute('aria-pressed'),'true');
  assert.equal(w.document.querySelector('[data-fmv-product="milk"]').getAttribute('aria-pressed'),'false');
  ghee.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));
  assert.equal(w.document.getElementById('fmv-cinema').dataset.product,'curd');
});
test('existing security policy, customer links, forms, and branding survive',()=>{
  assert.match(page,/http-equiv="Content-Security-Policy"/);
  assert.match(page,/script-src 'self'/);
  assert.match(page,/connect-src 'self' https:\/\/backend\.firstmilkventure\.com/);
  assert.match(page,/href="https:\/\/customer\.firstmilkventure\.com\/\?auth=signin"/);
  assert.match(page,/href="https:\/\/customer\.firstmilkventure\.com\/\?auth=signup"/);
  assert.match(page,/href="careers.html"/);
  assert.match(page,/id="contact-form"/);
  assert.match(page,/assets\/brand\/fmv-icon\.webp/);
});
test('3D presentation has small dependency-free self-hosted assets and safety fallbacks',()=>{
  assert.match(page,/href="cinematic\.css\?v=/);
  assert.match(page,/src="cinematic\.js\?v=/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/@media\(max-width:650px\)/);
  assert.match(js,/textContent = data\./);
  assert.match(js,/document\.hidden/);
  assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|https?:\/\//);
  assert.equal((page.match(/class="fmv-3d-card"/g)||[]).length,0); // cards include other classes
  assert.equal((page.match(/fmv-3d-card" data-fmv-card=/g)||[]).length,4);
});

test('all four optimized, self-hosted product photos are referenced, with originals available as fallbacks',()=>{
  for (const key of ['milk','ghee','curd','butter']) {
    assert.match(page,new RegExp('assets/products/hero-'+key+'-900\\.webp'));
    assert.match(page,new RegExp('assets/products/hero-'+key+'-600\\.webp'));
    assert.match(js,new RegExp('hero-'+key+'-900\\.webp'));
  }
  assert.match(js,/const published = sceneVisual/);
  assert.match(js,/const path = published \|\| builtIn\[key\]/);
});

test('existing cinematic company film remains present, with local fast-start media and poster',()=>{
  assert.ok(page.includes('id="fmv-film-video"'));
  assert.ok(page.includes('<source src="assets/video/fmv-brand-film-720.mp4"'));
  assert.ok(page.includes('<source src="assets/video/fmv-brand-film-mobile.mp4"'));
  assert.ok(page.includes('poster="assets/video/fmv-film-poster.webp"'));
  assert.ok(!page.includes('id="fmv-film-retry"'));
  assert.ok(page.includes('preload="auto"'));
  assert.ok(!page.includes('<video controls'));
  assert.ok(page.includes('muted autoplay loop playsinline'));
  for(const product of ['ghee','curd','butter']){
    assert.ok(page.includes('assets/products/hero-'+product+'-900.webp'));
  }
});
