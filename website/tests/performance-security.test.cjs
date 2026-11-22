const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const page=read('index.html');
const careers=read('careers.html');
const siteJS=read('site.js');
const cmsJS=read('cms.js');
const readStat=name=>fs.statSync(path.join(root,name)).size;

test('critical hero media is prioritized, but noncritical images are lazy',()=>{
  assert.ok(page.includes('rel="preload" as="image"'));
  assert.ok(page.includes('imagesrcset="assets/products/hero-milk-600.webp 600w, assets/products/hero-milk-900.webp 900w"'));
  assert.ok(page.includes('fetchpriority="high"'));
  for (const product of ['milk','ghee','curd','butter']) {
    const card=page.match(new RegExp('<article[^>]+data-fmv-card="'+product+'"[^>]*>[\\s\\S]*?<\\/article>'));
    assert.ok(card,'missing '+product+' product card');
    assert.ok(card[0].includes('loading="lazy"'),product+' image should be lazy');
    assert.ok(card[0].includes('srcset='),product+' should have responsive source');
  }
});

test('optimized WebP images and branded MP4s stay within static resource budgets',()=>{
  let total=0;
  for(const product of ['milk','ghee','curd','butter']){
    for(const [size,budget] of [['600',100000],['900',200000]]){
      const file='assets/products/hero-'+product+'-'+size+'.webp';
      const data=fs.readFileSync(path.join(root,file));
      assert.ok(data.byteLength<budget,file+' must remain below '+budget+' bytes');
      assert.equal(data.toString('ascii',0,4),'RIFF');
      assert.equal(data.toString('ascii',8,12),'WEBP');
      total+=data.byteLength;
    }
  }
  assert.ok(total<800000,'Product image set should remain under 800 KB');
  for(const [name,budget] of [
    ['fmv-brand-film-mobile.mp4',1500000],['fmv-brand-film-720.mp4',2200000]
  ]){
    const p=path.join(root,'assets/video',name);
    const data=fs.readFileSync(p);
    assert.ok(data.byteLength<budget,name+' must stay within size budget');
    assert.equal(data.toString('ascii',4,8),'ftyp');
    const moov=data.indexOf(Buffer.from('moov'));
    const mdat=data.indexOf(Buffer.from('mdat'));
    assert.ok(moov>0 && mdat>0 && moov<mdat,name+' should be faststart');
  }
  assert.ok(readStat('assets/video/fmv-film-poster.webp')<100000);
});

test('company film starts immediately without requiring a tap while retaining a poster fallback',()=>{
  assert.match(siteJS,/IntersectionObserver/);
  assert.match(siteJS,/brandFilm\.play\(\)/);
  assert.match(siteJS,/startFilm\(\);/);
  assert.match(siteJS,/document\.hidden/);
  assert.ok(page.includes('preload="auto"'));
  assert.ok(page.includes('muted autoplay loop playsinline'));
  assert.ok(page.includes('poster="assets/video/fmv-film-poster.webp"'));
  assert.ok(!page.includes('id="fmv-film-retry"'));
  assert.ok(!page.includes('resource2.heygen.ai'));
});

test('primary pages use local scripts, a strict CSP, and no unsafe inline event handlers',()=>{
  for(const document of [page,careers]){
    assert.match(document,/http-equiv="Content-Security-Policy"/);
    assert.match(document,/default-src 'self'/);
    assert.match(document,/script-src 'self'/);
    assert.match(document,/object-src 'none'/);
    assert.match(document,/frame-src 'none'/);
    assert.match(document,/form-action 'none'/);
    assert.match(document,/connect-src 'self' https:\/\/backend\.firstmilkventure\.com/);
    assert.doesNotMatch(document,/<script[^>]*src="https?:/i);
    assert.doesNotMatch(document,/\son(?:click|load|error|mouseover)\s*=/i);
  }
  assert.doesNotMatch(siteJS,/eval\s*\(/);
  assert.doesNotMatch(cmsJS,/eval\s*\(/);
});

test('public CMS loads after first paint without blocking the above-fold site',()=>{
  assert.match(cmsJS,/requestAnimationFrame\(refreshAfterPaint\)/);
  assert.match(cmsJS,/credentials:'omit'/);
  assert.match(cmsJS,/AbortSignal\.timeout\(8000\)/);
  assert.match(cmsJS,/priority:'low'/);
});
