/* Official brand assets are local, safe and present across all portal entry points. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const p=require('node:path');
const root=p.resolve(__dirname,'..');
const read=name=>fs.readFileSync(p.join(root,name));
const html=name=>read(name).toString('utf8');
const files=['assets/brand/fmv-logo.webp','assets/brand/fmv-icon.webp',
 'assets/brand/fmv-logo.png','assets/brand/favicon.ico',
 'assets/brand/favicon-32.png','assets/brand/apple-touch-icon.png',
 'assets/brand/pwa-icon-192.png','assets/brand/fmv-social-preview.png'];

test('Official logo files exist, are optimized, and have authentic file signatures',()=>{
 for(const filename of files){
   const data=read(filename);
   assert.ok(data.length>100,filename+' appears empty');
   assert.ok(data.length<850_000,filename+' must not slow the site');
   if(filename.endsWith('.png'))assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a',filename);
   if(filename.endsWith('.webp'))assert.equal(data.subarray(0,4).toString(),'RIFF',filename);
 }
});
test('All portal pages show the official corporate identity without remote fonts or trackers',()=>{
 const page=html('index.html'),core=html('portal-core.js');
 assert.match(page,/fmv-icon\.webp/);
 assert.match(page,/brand\.css/);
 assert.match(page,/apple-touch-icon\.png/);
 assert.match(page,/manifest\.webmanifest/);
 assert.match(core,/fmv-logo\.webp/);
 assert.match(core,/fmv-auth-brand-img/);
 assert.doesNotMatch(core,/media\.canva\.com/);
});
test('Manifest uses local app icons and carries no customer or admin secrets',()=>{
 const mf=JSON.parse(html('manifest.webmanifest'));
 assert.match(mf.name,/First Milk Venture/);
 assert.ok(mf.icons.every(x=>x.src.startsWith('assets/brand/')));
 assert.equal(mf.display,'standalone');
});
if(fs.existsSync(p.join(root,'website','index.html'))){
 test('Company homepage and Careers use the real logo in header and footer',()=>{
   for(const path of ['website/index.html','website/careers.html']){
     const site=html(path);
     assert.equal((site.match(/fmv-site-mark/g)||[]).length,2);
     assert.match(site,/brand\.css/);
     assert.match(site,/fmv-social-preview\.png/);
     assert.match(site,/apple-touch-icon\.png/);
   }
   assert.match(html('website/chat.js'),/fmv-ai-brand-icon/);
 });
 test('Company website logo is fully self-hosted',()=>{
   assert.ok(read('website/assets/brand/fmv-icon.webp').length>100);
   assert.ok(read('website/assets/brand/fmv-social-preview.png').length>100);
 });
}

test('Customer catalog displays uncropped branded images with a full-image preview',()=>{
 const css=html('portal-theme.css'),app=html('app.js'),page=html('index.html');
 assert.match(css,/\.customer-product-card \.customer-product-visual\{height:auto!important/);
 assert.match(css,/object-fit:contain!important/);
 assert.match(css,/\.fmv-product-full-image img\{[^}]*object-fit:contain/);
 assert.match(app,/data-fmv-image-zoom/);
 assert.match(app,/dialog\.showModal\(\)/);
 assert.match(page,/portal-theme\.css\?v=20261121-catalog-v3/);
 assert.doesNotMatch(css,/\.customer-product-card:hover \.customer-product-image\{transform:scale/);
});

test('The final-loaded branded CSS keeps square product photos in normal document flow',()=>{
 const stylesheet=html('brand.css');
 const page=html('index.html');
 assert.match(stylesheet,/Catalog image hotfix v3/);
 assert.match(stylesheet,/\.customer-product-visual > img\.customer-product-image\{/);
 assert.match(stylesheet,/position:relative!important/);
 assert.match(stylesheet,/object-fit:contain!important/);
 assert.match(stylesheet,/height:auto!important/);
 assert.match(stylesheet,/\.customer-product-image\[hidden\]\{/);
 assert.match(page,/brand\.css\?v=20261121-catalog-v4/);
 assert.match(page,/<script defer src="app\.js\?v=[^"]+"><\/script>/);
});

test('Catalog v4 uses a fresh square media stage rather than legacy cropped visual',()=>{
 const script=html('app.js'),css=html('brand.css'),page=html('index.html');
 const render=script.slice(script.indexOf('function renderProducts(){'),script.indexOf('function adjustQty(id,delta){'));
 const photo=script.slice(script.indexOf('function customerProductVisual(product){'),script.indexOf('function customerPaymentLabel(value){'));
 assert.match(photo,/class="fmv-catalog-photo"/);
 assert.match(photo,/width="1000" height="1000"/);
 assert.doesNotMatch(render,/class="customer-product-visual"/);
 assert.match(render,/class="fmv-catalog-media"/);
 assert.match(render,/data-catalog-version="4"/);
 assert.match(render,/class="fmv-buy-top"/);
 assert.match(render,/class="fmv-buy-actions"/);
 assert.match(render,/onclick="adjustQty/);
 assert.match(render,/onclick="addToCart/);
 assert.match(render,/onclick="subscribeProduct/);
 assert.match(css,/#product-grid \.fmv-catalog-card-v4 img\.fmv-catalog-photo\{/);
 assert.match(css,/aspect-ratio:1 \/ 1!important;object-fit:contain!important/);
 assert.match(page,/brand\.css\?v=20261121-catalog-v4/);
 assert.match(page,/<script defer src="app\.js\?v=[^"]+"><\/script>/);
});
