/* First Milk Venture: accessible, lazy-loaded customer product information.
   No invented ratings, dates, batch numbers or legal claims. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (value) => FMV.escape(String(value == null ? '' : value));
  let current = null;
  let loadingId = 0;
  let view = 'specifications';
  const infoFields = [
    ['brand','Brand'],['generic_name','Generic name'],
    ['manufacturer_name','Manufacturer'],['manufacturer_address','Manufacturer address'],
    ['packer_name','Packer'],['packer_address','Packer address'],
    ['country_of_origin','Country of origin'],['batch_number','Batch / lot number'],
    ['net_quantity','Net quantity'],['manufactured_on','Manufactured on'],
    ['expiry_date','Expiry date'],['best_before_date','Best before'],
    ['fssai_license','FSSAI licence number'],['customer_care','Customer care'],
    ['storage_instructions','Storage instructions'],['ingredients','Ingredients'],
    ['allergens','Allergen information']
  ];
  const dateKeys = new Set(['manufactured_on','expiry_date','best_before_date']);
  function dateValue(raw) {
    if (!raw) return '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return String(raw);
    const pieces=raw.split('-').map(Number);
    const safe = new Date(Date.UTC(pieces[0],pieces[1]-1,pieces[2],12));
    return safe.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
  }
  function row(label,value,placeholder) {
    return '<div class="fmv-pi-datum"><dt>'+esc(label)+'</dt><dd>'+esc(value || placeholder || 'Not provided')+'</dd></div>';
  }
  function listRow(item) {
    return '<li>'+esc(item)+'</li>';
  }
  function missing(message) {
    return '<p class="fmv-pi-missing">'+esc(message)+'</p>';
  }
  function tabContent(info,product) {
    const m=info.manufacturer||{};
    if (view === 'specifications') {
      const specs=Array.isArray(info.specifications)?info.specifications:[];
      let out='<dl class="fmv-pi-data-grid">';
      out+=row('Product name',product.name);
      out+=row('Pack / unit',product.unit);
      specs.forEach((s) => { if(s && s.label && s.value) out+=row(s.label,s.value); });
      return out+'</dl>';
    }
    if (view === 'description') {
      return '<div class="fmv-pi-prose">'+esc(info.description || product.description || 'A description has not been published for this product.')+'</div>';
    }
    if (view === 'manufacturer') {
      let out='<p class="fmv-pi-annotation">Dates and batch information refer to the batch described by the seller. Please check the delivered pack label for your actual batch.</p><dl class="fmv-pi-data-grid">';
      infoFields.forEach(([key,label]) => {
        const value=dateKeys.has(key)?dateValue(m[key]):m[key];
        out+=row(label,value,key==='expiry_date'?'Expiry information not yet published':'Not provided');
      });
      return out+'</dl>';
    }
    if (view === 'warranty') {
      return '<div class="fmv-pi-prose">'+esc(info.warranty || 'No warranty information has been published for this product.')+'</div>';
    }
    return '';
  }
  function render(product,information,errorText) {
    const dialog=$('fmv-product-information-dialog');
    if(!dialog)return;
    const info=information||{};
    const stock=Number(product.stock_quantity||0);
    const highlights=Array.isArray(info.highlights)?info.highlights.filter(Boolean):[];
    const faqs=Array.isArray(info.faqs)?info.faqs.filter(q=>q.question&&q.answer):[];
    const names=[
      ['specifications','Specifications'],['description','Description'],
      ['manufacturer','Manufacturer info'],['warranty','Warranty']
    ];
    const tabs=names.map(([id,title])=>'<button type="button" role="tab" class="fmv-pi-tab" data-pi-tab="'+id+'" aria-selected="'+(view===id?'true':'false')+'" tabindex="'+(view===id?'0':'-1')+'">'+title+'</button>').join('');
    const faqList=faqs.map((q)=>'<details class="fmv-pi-faq"><summary>'+esc(q.question)+'</summary><p>'+esc(q.answer)+'</p></details>').join('');
    dialog.innerHTML=
      '<div class="fmv-pi-layout">'+
        '<header class="fmv-pi-head"><div><span class="fmv-pi-eyebrow">FIRST MILK VENTURE · PRODUCT INFORMATION</span><h2 id="fmv-pi-title">'+esc(product.name)+'</h2></div><button type="button" class="fmv-pi-close" data-pi-close aria-label="Close product details">×</button></header>'+
        '<div class="fmv-pi-scroll">'+
          '<div class="fmv-pi-hero"><div class="fmv-pi-picture">'+(typeof customerProductVisual==='function'?customerProductVisual(product):'')+'</div><div class="fmv-pi-hero-copy"><p class="fmv-pi-tag">Know what is in your basket</p><h3>'+esc(product.name)+'</h3><p>'+esc(product.description||'')+'</p><strong>'+FMV.money(product.price)+'</strong><span class="fmv-pi-stock">'+(stock>0?'Available to order · '+esc(stock)+' in stock':'Currently out of stock')+'</span></div></div>'+
          '<section class="fmv-pi-section"><h3>Product highlights</h3>'+(highlights.length?'<ul class="fmv-pi-highlights">'+highlights.map(listRow).join('')+'</ul>':missing('Product highlights have not yet been published.'))+'</section>'+
          '<section class="fmv-pi-section"><h3>All details</h3><div class="fmv-pi-tabs" role="tablist" aria-label="Product details">'+tabs+'</div><div id="fmv-pi-tabpanel" class="fmv-pi-tabpanel" role="tabpanel">'+tabContent(info,product)+'</div></section>'+
          '<section class="fmv-pi-section"><h3>Ratings and reviews</h3>'+missing('Verified customer ratings and reviews are not available for this product yet.')+'</section>'+
          '<section class="fmv-pi-section"><h3>Questions and answers</h3>'+(faqList||missing('No product questions and answers have been published yet.'))+'</section>'+
          (errorText?'<p class="fmv-pi-error" role="alert">'+esc(errorText)+'</p>':'')+
        '</div>'+
        '<footer class="fmv-pi-actions"><button type="button" class="fmv-pi-subscribe" data-pi-subscribe '+(stock<=0?'disabled':'')+'>Subscribe</button><button type="button" class="fmv-pi-cart" data-pi-cart '+(stock<=0?'disabled':'')+'>Add to cart <span aria-hidden="true">+</span></button></footer>'+
      '</div>';
    const active=dialog.querySelector('.fmv-pi-tab[aria-selected="true"]');
    if(active)active.setAttribute('aria-controls','fmv-pi-tabpanel');
  }
  async function open(id) {
    const product=(Array.isArray(productsCatalog)?productsCatalog:[]).find(p=>String(p.id)===String(id));
    if(!product)return;
    current=product;
    view='specifications';
    const ticket=++loadingId;
    const dialog=$('fmv-product-information-dialog');
    render(product,{},'');
    if(!dialog.open)dialog.showModal();
    try {
      const result=await FMV.request('/products/'+encodeURIComponent(id)+'/information');
      if(ticket!==loadingId || current?.id!==product.id || !dialog.open)return;
      render(product,result.information||{},'');
    } catch (error) {
      if(ticket===loadingId && dialog.open && current?.id===product.id) {
        render(product,{},'The detailed product information could not be loaded. Please try again later.');
      }
    }
  }
  function close() {
    loadingId++;
    current=null;
    const dialog=$('fmv-product-information-dialog');
    if(dialog&&dialog.open)dialog.close();
  }
  function init() {
    if($('fmv-product-information-dialog'))return;
    const dialog=document.createElement('dialog');
    dialog.id='fmv-product-information-dialog';
    dialog.className='fmv-pi-dialog';
    dialog.setAttribute('aria-labelledby','fmv-pi-title');
    document.body.append(dialog);
    dialog.addEventListener('close',()=>{loadingId++;current=null;});
    dialog.addEventListener('click',(event)=>{
      if(event.target===dialog)close();
    });
    dialog.addEventListener('click',(event)=>{
      const target=event.target.closest('button,[role="tab"]');if(!target)return;
      if(target.hasAttribute('data-pi-close')){close();return;}
      if(target.hasAttribute('data-pi-cart')){
        const id=current?.id;
        close();
        if(id!=null && typeof addToCart==='function')addToCart(id);
        return;
      }
      if(target.hasAttribute('data-pi-subscribe')){
        const id=current?.id;
        close();
        if(id!=null && typeof subscribeProduct==='function')subscribeProduct(id);
        return;
      }
      if(target.dataset.piTab) {
        view=target.dataset.piTab;
        dialog.querySelectorAll('[data-pi-tab]').forEach((tab)=>{
          const active=tab.dataset.piTab===view;
          tab.setAttribute('aria-selected',String(active));
          tab.tabIndex=active?0:-1;
          if(active){tab.setAttribute('aria-controls','fmv-pi-tabpanel');}
        });
        const product=current;
        if(!product)return;
        // Keep retrieved data in the dialog instance for instant local tabs.
        const details=dialog._fmvProductInfo||{};
        const panel=$('fmv-pi-tabpanel');
        if(panel)panel.innerHTML=tabContent(details,product);
        target.focus();
      }
    });
    dialog.addEventListener('keydown',(event)=>{
      if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key)||!event.target.matches('[data-pi-tab]'))return;
      const buttons=Array.from(dialog.querySelectorAll('[data-pi-tab]'));
      let index=buttons.indexOf(event.target);
      if(index<0)return;
      event.preventDefault();
      if(event.key==='Home')index=0;
      else if(event.key==='End')index=buttons.length-1;
      else index=(index+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
      buttons[index].click();
    });
    document.addEventListener('click',(event)=>{
      const button=event.target.closest('[data-product-information]');
      if(button)open(button.dataset.productInformation);
    });
    document.addEventListener('fmv:locked',close);
  }
  // Retain the loaded snapshot even while switching the content tabs.
  const originalRender=render;
  render=function(product,info,error){
    const dialog=$('fmv-product-information-dialog');
    if(dialog)dialog._fmvProductInfo=info||{};
    originalRender(product,info,error);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
