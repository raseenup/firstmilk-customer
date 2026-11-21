/* Each customer navigation item owns a dedicated area. Existing account tools
 * and controllers are retained and moved into Profile → Account workspace. */
(() => {
  'use strict';
  const state={area:'home',profile:'menu',addresses:[],selectedAddress:'',campaigns:[],addressEdit:null,pause:false};
  const e=value=>FMV.escape(value);
  const $=id=>document.getElementById(id);
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let campaignMediaObserver=null;
  function activateCampaignVideo(video){
    if(!video || document.hidden || motion.matches || video.closest('[hidden]'))return;
    if(!video.getAttribute('src') && video.dataset.fmvSrc){
      video.src=video.dataset.fmvSrc;
      video.preload='auto';
      video.load();
    }
    if(video.getAttribute('src'))video.play().catch(()=>{});
  }
  function prepareCampaignVideos(){
    if(campaignMediaObserver){campaignMediaObserver.disconnect();campaignMediaObserver=null;}
    const videos=Array.from(document.querySelectorAll('.fmv-campaign video'));
    if(!videos.length)return;
    if(typeof IntersectionObserver==='undefined'){
      for(const video of videos)activateCampaignVideo(video);
      return;
    }
    campaignMediaObserver=new IntersectionObserver(entries=>{
      for(const entry of entries){
        if(entry.isIntersecting)activateCampaignVideo(entry.target);
        else entry.target.pause();
      }
    },{rootMargin:'500px 0px',threshold:0.01});
    for(const video of videos)campaignMediaObserver.observe(video);
  }
  const icons={address:'⌂',orders:'▣',wallet:'◈',edit:'✎',workspace:'▦',notifications:'♧',help:'?',ai:'✦',feedback:'♡',logout:'↪'};
  const row=(action,label,icon)=>`<button type="button" class="fmv-profile-row" data-fmv-action="${action}"><span class="fmv-row-icon" aria-hidden="true">${icons[icon] || '›'}</span><span>${e(label)}</span><span aria-hidden="true">›</span></button>`;

  function navigate(area,subarea='menu'){
    if(!FMV.user){FMV.showAuth('signin');return;}
    if(area==='catalog'){area='home';subarea='catalog';}
    state.area=area;state.profile=subarea;
    for(const element of document.querySelectorAll('[data-customer-area]'))element.hidden=element.dataset.customerArea!==area;
    for(const element of document.querySelectorAll('[data-profile-area]'))element.hidden=area!=='profile' || element.dataset.profileArea!==subarea;
    setCustomerNavigation(area);
    if(area==='home'){const hasBanners=state.campaigns.some(c=>c.placement==='home' && c.kind==='banner');$('fmv-banner-slot').hidden=!hasBanners;document.querySelector('.customer-hero').hidden=hasBanners;$('fmv-home-posts').hidden=!state.campaigns.some(c=>c.placement==='home' && c.kind!=='banner');$('fmv-location-ads').hidden=!state.campaigns.some(c=>c.placement==='home_location');}
    if(area==='profile'){
      renderIdentity();
      $('fmv-profile-back').hidden=subarea==='menu';
      $('fmv-profile-subtitle').textContent=({menu:'Your account',addresses:'Manage addresses',orders:'My Orders',wallet:'FMV Wallet',workspace:'Account workspace',ai:'FMV AI',policy:'Help & company information'})[subarea] || 'Your account';
      if(subarea==='addresses')refreshAddresses();
      if(subarea==='orders')loadDashboardStatus();
    }
    // Visible, muted videos begin loading near the viewport; other media stays idle.
    for(const video of document.querySelectorAll('.fmv-campaign video')){
      if(video.closest('[hidden]') || motion.matches)video.pause();
      else if(video.getAttribute('src'))activateCampaignVideo(video);
    }
    prepareCampaignVideos();
    if(subarea==='catalog')$('product-grid').scrollIntoView({behavior:motion.matches?'auto':'smooth'});
    else window.scrollTo({top:0,behavior:'auto'});
  }

  function renderIdentity(){
    const user=FMV.user;if(!user)return;
    $('fmv-profile-name').textContent=user.full_name || 'Your profile';
    $('fmv-profile-phone').textContent=user.phone;
    $('fmv-profile-email').textContent=user.email;
    $('fmv-profile-avatar').textContent=customerInitials(user.full_name);
    const header=$('auth-header-container');if(header){header.replaceChildren();header.hidden=true;}
    const loc=$('user-location-label');
    const selected=state.addresses.find(a=>a.id===state.selectedAddress);
    if(loc)loc.textContent=selected?selected.label+' · '+selected.address:user.address || 'Choose your delivery address';
  }

  async function refreshAddresses(supplied){
    if(!FMV.user)return;
    const result=supplied || await FMV.request('/users/me/addresses');
    state.addresses=result.addresses;if(result.user)Object.assign(FMV.user,result.user);
    if(!state.addresses.some(a=>a.id===state.selectedAddress))state.selectedAddress=state.addresses.find(a=>a.is_default)?.id || state.addresses[0]?.id || '';
    renderAddresses();renderAddressSelect();renderIdentity();
  }

  function renderAddresses(){
    $('fmv-address-list').innerHTML=state.addresses.map(a=>`<article class="fmv-address-card"><div class="fmv-flex"><h4>${e(a.label)}</h4>${a.is_default?'<span class="fmv-default-tag">Default</span>':''}</div><p><strong>${e(a.recipient)}</strong> · ${e(a.phone)}</p><p>${e(a.address)}</p><div class="fmv-flex"><button class="fmv-btn secondary" data-fmv-action="edit-address" data-id="${e(a.id)}">Edit</button><button class="fmv-btn secondary" data-fmv-action="select-address" data-id="${e(a.id)}">${state.selectedAddress===a.id?'Selected for checkout':'Deliver here'}</button>${!a.is_default?`<button class="fmv-btn secondary" data-fmv-action="default-address" data-id="${e(a.id)}">Set default</button>`:''}<button class="fmv-btn secondary" data-customer-action="pin-address" data-id="${e(a.id)}">Pin delivery location</button><button class="fmv-btn danger" data-fmv-action="delete-address" data-id="${e(a.id)}">Remove</button></div></article>`).join('') || FMV.empty('No saved addresses. Add one to place your next order.');
  }

  function renderAddressSelect(){
    const select=$('fmv-checkout-address');if(!select)return;
    select.innerHTML='<option value="">Choose a saved delivery address</option>'+state.addresses.map(a=>`<option value="${e(a.id)}">${e(a.label+' — '+a.address)}</option>`).join('');
    select.value=state.selectedAddress;
    const selected=state.addresses.find(a=>a.id===select.value);
    $('fmv-checkout-recipient').textContent=selected?selected.recipient+' · '+selected.phone:'';
  }

  function editAddress(id){
    const item=state.addresses.find(a=>a.id===id);state.addressEdit=id || null;
    const form=$('fmv-address-form');form.reset();
    $('fmv-address-form-title').textContent=item?'Edit address':'Add an address';
    for(const key of ['label','recipient','phone','address'])form.elements[key].value=item?.[key] || (key==='recipient'?FMV.user.full_name:key==='phone'?FMV.user.phone:'');
    form.elements.is_default.checked=!!item?.is_default;
    form.hidden=false;form.elements.label.focus();
  }

  async function saveAddress(event){
    event.preventDefault();const form=event.currentTarget,button=form.querySelector('[type=submit]');button.disabled=true;
    try{
      const body=Object.fromEntries(['label','recipient','phone','address'].map(key=>[key,form.elements[key].value.trim()]));body.is_default=form.elements.is_default.checked;
      await FMV.request('/users/me/addresses'+(state.addressEdit?'/'+encodeURIComponent(state.addressEdit):''),{method:state.addressEdit?'PATCH':'POST',body});
      form.hidden=true;state.addressEdit=null;await refreshAddresses();
      const session=await FMV.request('/auth/session');Object.assign(FMV.user,session.user);renderIdentity();
      FMV.notice('Address saved. Choose it when you check out.');
    }catch(error){FMV.notice(error.message,true);}finally{button.disabled=false;}
  }

  async function useDefaultAddress(id){
    const item=state.addresses.find(a=>a.id===id);if(!item)return;
    const {label,recipient,phone,address}=item;
    await FMV.request('/users/me/addresses/'+encodeURIComponent(id),{method:'PATCH',body:{label,recipient,phone,address,is_default:true}});
    state.selectedAddress=id;saveFmvCart();await refreshAddresses();FMV.notice('Default address updated.');
  }

  function campaignMarkup(item){
    const src=item.media_url?FMV.apiBase+item.media_url:'';
    const video=item.mime_type==='video/mp4';
    const animated=/gif|webp/.test(item.mime_type) || video;
    // Promotional media is decorative, muted and inline. Native controls are hidden.
    // The browser may decline autoplay (e.g. data saver or reduced motion); never show chrome.
    let media='';
    if(src)media=video?`<video data-fmv-src="${e(src)}" muted loop playsinline webkit-playsinline autoplay preload="none" disablepictureinpicture disableremoteplayback aria-label="${e(item.alt_text || item.title)}" tabindex="-1"></video>`:`<img src="${e(src)}" alt="${e(item.alt_text || item.title)}" loading="lazy" decoding="async">`;
    return `<article class="fmv-campaign" data-animation="${motion.matches?'none':e(item.animation)}" data-campaign-id="${e(item.id)}" style="--campaign-width:${Number(item.display_width) || 1200}px;--campaign-ratio:${Number(item.display_width) || 1200}/${Number(item.display_height) || 300};--campaign-fit:${item.media_fit==='cover'?'cover':'contain'}">${media}<div class="fmv-campaign-copy"><span class="customer-eyebrow">${e(item.kind==='menu'?'Fresh picks':item.kind==='offer'?'FMV offers':'First Milk Venture')}</span><h3>${e(item.title)}</h3><p>${e(item.description)}</p>${item.terms?`<small>${e(item.terms)}</small>`:''}<button type="button" class="fmv-btn" data-fmv-action="campaign-link" data-target="${e(item.cta_path)}">${e(item.cta_label || 'Explore')} <span aria-hidden="true">↗</span></button></div></article>`;
  }

  async function refreshCampaigns(supplied){
    if(!FMV.user)return;
    const result=supplied || await FMV.request('/content');if(JSON.stringify(result.campaigns)===JSON.stringify(state.campaigns) && $('fmv-offers-grid').childElementCount)return;state.campaigns=result.campaigns;
    const banners=state.campaigns.filter(c=>c.placement==='home' && c.kind==='banner');
    const home=state.campaigns.filter(c=>c.placement==='home' && c.kind!=='banner');
    $('fmv-banner-slot').hidden=!banners.length;
    $('fmv-banner-track').innerHTML=banners.map(campaignMarkup).join('');
    $('fmv-banner-controls').hidden=banners.length<2;
    $('fmv-home-posts').innerHTML=home.map(campaignMarkup).join('');
    $('fmv-home-posts').hidden=!home.length;
    const locationAds=state.campaigns.filter(c=>c.placement==='home_location');$('fmv-location-ads').innerHTML=locationAds.map(campaignMarkup).join('');$('fmv-location-ads').hidden=state.area!=='home' || !locationAds.length;
    const offers=state.campaigns.filter(c=>c.placement==='offers' || c.kind==='offer');
    $('fmv-offers-grid').innerHTML=offers.map(campaignMarkup).join('') || customerEmpty('Fresh offers are on their way','Published offers and seasonal posts will appear here.');
    const hero=document.querySelector('.customer-hero');hero.hidden=state.area!=='home' || banners.length>0;
    prepareCampaignVideos();
  }

  const policies={
    terms:['Terms & Conditions','terms'],privacy:['Privacy Policy','privacy'],refund:['Refund Policy','refund'],about:['About us','about'],contact:['Contact us','contact']
  };
  async function showPolicy(key){
    navigate('profile','policy');const [title,slug]=policies[key];$('fmv-policy-title').textContent=title;
    $('fmv-policy-body').textContent='Loading…';
    try{const result=await FMV.request('/pages/'+slug);$('fmv-policy-body').textContent=result.page?.body || 'This company page has not been published yet. Open Help & FAQs to contact First Milk support.';}
    catch(error){$('fmv-policy-body').textContent=error.message;}
  }

  function build(){
    const main=document.querySelector('.customer-workspace');
    for(const element of Array.from(main.children))element.dataset.customerArea='home';
    const profile=document.createElement('section');profile.id='fmv-profile-area';profile.className='fmv-profile-area';profile.dataset.customerArea='profile';profile.hidden=true;
    profile.innerHTML=`<div class="fmv-profile-identity"><span id="fmv-profile-avatar" aria-hidden="true"></span><div><h2 id="fmv-profile-name"></h2><p id="fmv-profile-phone"></p><p id="fmv-profile-email"></p></div></div><div class="fmv-profile-heading"><button type="button" id="fmv-profile-back" class="fmv-btn secondary" data-fmv-action="profile-menu" hidden>← Profile</button><h3 id="fmv-profile-subtitle">Your account</h3></div><div data-profile-area="menu"><details class="fmv-profile-group" open><summary>My Account</summary>${row('addresses','Manage Address','address')}${row('orders','My Orders & subscriptions','orders')}${row('wallet','FMV Wallet','wallet')}${row('edit-profile','Edit profile','edit')}${row('workspace','Account workspace','workspace')}${row('notifications','Notifications','notifications')}</details><details class="fmv-profile-group" open><summary>Help & FAQs</summary>${row('help','Help & FAQs','help')}${row('ask-ai','Ask FMV AI','ai')}${Object.entries(policies).map(([key,[label]])=>row('policy-'+key,label)).join('')}${row('feedback','Send feedback','feedback')}${row('delete-account','Request account deletion')}</details><button type="button" class="fmv-profile-logout" data-fmv-action="logout">Logout <span aria-hidden="true">↪</span></button><p class="fmv-profile-version">First Milk Venture · Version 13.0</p></div><section data-profile-area="addresses" hidden><p class="fmv-small">Save up to 20 addresses. Choose a delivery address each time you order.</p><button class="fmv-btn" data-fmv-action="add-address">+ Add address</button><form id="fmv-address-form" class="fmv-address-form" hidden><h4 id="fmv-address-form-title">Add an address</h4><label>Label<input name="label" required maxlength="40" placeholder="Home, Work, Parents…"></label><label>Recipient name<input name="recipient" required maxlength="150" autocomplete="name"></label><label>Mobile number<input name="phone" type="tel" required maxlength="25" autocomplete="tel"></label><label>Full delivery address<textarea name="address" required maxlength="1000" rows="3" autocomplete="street-address" placeholder="House, street, town, Kerala, PIN code"></textarea></label><label class="fmv-checkbox"><input name="is_default" type="checkbox">Set as my default address</label><div class="fmv-flex"><button class="fmv-btn" type="submit">Save address</button><button class="fmv-btn secondary" type="button" data-fmv-action="cancel-address">Cancel</button></div></form><div id="fmv-address-list" class="fmv-address-list"></div></section><section data-profile-area="wallet" class="fmv-wallet-area" hidden><span class="customer-eyebrow">YOUR FMV WALLET</span><h3>Fresh possibilities.</h3><p>Wallet payments and top-ups are not enabled for this account. You can use cash on delivery or the available online payment options at checkout.</p><p class="fmv-small">No wallet transactions have been recorded.</p><button class="fmv-btn" data-fmv-action="home">Explore fresh picks ↗</button></section><section data-profile-area="policy" hidden><h3 id="fmv-policy-title"></h3><div id="fmv-policy-body" class="fmv-policy-copy"></div><button class="fmv-btn secondary" data-fmv-action="help">Help & FAQs</button></section>`;
    main.append(profile);
    const orders=document.querySelector('.customer-deliveries');orders.removeAttribute('data-customer-area');orders.dataset.profileArea='orders';orders.hidden=true;profile.append(orders);
    const workspace=$('enterprise-portal-suite');workspace.removeAttribute('data-customer-area');workspace.dataset.profileArea='workspace';workspace.hidden=true;profile.append(workspace);
    const offers=document.createElement('section');offers.id='fmv-offers-area';offers.dataset.customerArea='offers';offers.hidden=true;offers.innerHTML='<div class="customer-section-heading"><div><span class="customer-eyebrow">A LITTLE EXTRA FRESHNESS</span><h2>Offers & stories</h2><p>Explore the latest posts and offers from First Milk Venture.</p></div></div><div id="fmv-offers-grid" class="fmv-campaign-grid"></div>';main.append(offers);
    const banners=document.createElement('section');banners.id='fmv-banner-slot';banners.dataset.customerArea='home';banners.className='fmv-banner-slot';banners.setAttribute('aria-label','First Milk promotions');banners.hidden=true;banners.innerHTML='<div id="fmv-banner-track" class="fmv-banner-track"></div><div id="fmv-banner-controls" class="fmv-banner-controls" hidden><button data-fmv-action="previous-banner" aria-label="Previous promotion">←</button><button data-fmv-action="pause-banners" aria-pressed="false">Pause slideshow</button><button data-fmv-action="next-banner" aria-label="Next promotion">→</button></div>';main.prepend(banners);
    const posts=document.createElement('section');posts.id='fmv-home-posts';posts.dataset.customerArea='home';posts.className='fmv-campaign-grid';posts.setAttribute('aria-label','Fresh menus and company posts');posts.hidden=true;document.querySelector('.customer-catalog').before(posts);
    const address=document.createElement('div');address.id='fmv-checkout-address-box';address.className='fmv-checkout-address-box';address.innerHTML='<label for="fmv-checkout-address">Deliver this order to</label><select id="fmv-checkout-address" required></select><p id="fmv-checkout-recipient" class="fmv-small"></p><button type="button" class="fmv-btn secondary" data-fmv-action="checkout-addresses">Manage saved addresses</button>';$('customer-checkout').before(address);
    $('fmv-address-form').addEventListener('submit',saveAddress);
    $('fmv-checkout-address').addEventListener('change',event=>{state.selectedAddress=event.target.value;saveFmvCart();renderAddressSelect();renderIdentity();});
    $('fmv-location-ads').dataset.customerArea='home';
    document.querySelector('.customer-bottom-nav [data-customer-tab="profile"]').setAttribute('onclick',"switchTab('profile')");
    $('edit-address').closest('div').hidden=true;
    renderIdentity();
  }

  function moveBanner(delta){const track=$('fmv-banner-track');if(!track?.children.length)return;const width=track.clientWidth,index=Math.round(track.scrollLeft/width),next=(index+delta+track.children.length)%track.children.length;track.scrollTo({left:next*width,behavior:motion.matches?'auto':'smooth'});}
  async function click(event){
    const button=event.target.closest('[data-fmv-action]');if(!button || button.disabled)return;
    const action=button.dataset.fmvAction,id=button.dataset.id;
    if(action==='logout'){handleSignOut();return;}
    if(action==='home' || action==='profile-menu'){navigate(action==='home'?'home':'profile');return;}
    if(['addresses','orders','wallet','workspace'].includes(action)){navigate('profile',action);return;}
    if(action==='edit-profile'){navigate('profile');openEditProfileModal();return;}
    if(action==='ask-ai'){navigate('profile','ai');return;}
    if(action==='notifications' || action==='help' || action==='feedback' || action==='delete-account'){
      navigate('profile','workspace');openPortalHub(action==='notifications'?'vault-comms':action==='feedback'?'support-kb':'support-kb');
      if(action==='delete-account'){document.getElementById('ticket-subject').value='Request account deletion';FMV.notice('Submit a support ticket requesting account deletion. Your account stays active until the request is reviewed.');}
      return;
    }
    if(action.startsWith('policy-')){await showPolicy(action.slice(7));return;}
    if(action==='checkout-addresses'){closeCartDrawer();navigate('profile','addresses');return;}
    if(action==='add-address' || action==='edit-address'){editAddress(id);return;}
    if(action==='cancel-address'){$('fmv-address-form').hidden=true;return;}
    if(action==='select-address'){state.selectedAddress=id;saveFmvCart();renderAddresses();renderAddressSelect();renderIdentity();FMV.notice('Delivery address selected.');return;}
    if(action==='default-address'){await useDefaultAddress(id);return;}
    if(action==='delete-address'){
      if(!confirm('Remove this saved address? Existing orders keep their delivery address.'))return;
      await FMV.request('/users/me/addresses/'+encodeURIComponent(id),{method:'DELETE'});saveFmvCart();await refreshAddresses();return;
    }
    if(action==='campaign-link'){navigate(button.dataset.target);return;}
    if(action==='next-banner' || action==='previous-banner'){moveBanner(action==='next-banner'?1:-1);return;}
    if(action==='pause-banners'){state.pause=!state.pause;button.textContent=state.pause?'Play slideshow':'Pause slideshow';button.setAttribute('aria-pressed',String(state.pause));return;}
    if(action==='play-media'){
      const item=state.campaigns.find(c=>c.id===id);if(!item)return;
      const asset=document.createElement(item.mime_type==='video/mp4'?'video':'img');asset.src=FMV.apiBase+item.media_url;
      if(asset instanceof HTMLVideoElement){asset.controls=false;asset.muted=true;asset.loop=true;asset.autoplay=true;asset.playsInline=true;asset.preload='none';asset.disablePictureInPicture=true;asset.play().catch(()=>{});}else asset.alt=item.alt_text || item.title;
      button.replaceWith(asset);
    }
  }

  document.addEventListener('DOMContentLoaded',()=>{
    build();document.addEventListener('click',event=>FMV.guard(()=>click(event)));
    setInterval(()=>{if(state.area==='home' && !document.hidden && !state.pause && !motion.matches && !$('fmv-banner-slot').matches(':focus-within,:hover'))moveBanner(1);},6000);
  });
  document.addEventListener('fmv:authenticated',()=>{
    if(!FMV.user)return;
    try{state.selectedAddress=JSON.parse(sessionStorage.getItem('fmv_cart_'+FMV.user.id) || '{}').addressId || '';}catch(error){state.selectedAddress='';}
    // Show the home view immediately. The existing customer snapshot fills
    // products, campaign media and addresses with one authenticated request.
    navigate('home');
  });
  async function applySnapshot(snapshot){
    if(!FMV.user || !snapshot)return;
    if(!document.activeElement?.closest('#fmv-address-form'))
      await refreshAddresses({addresses:snapshot.addresses || [],user:snapshot.user});
    if(snapshot.content)await refreshCampaigns(snapshot.content);
  }
  document.addEventListener('fmv:locked',()=>{
    state.addresses=[];state.selectedAddress='';state.campaigns=[];state.area='home';
    for(const id of ['fmv-profile-name','fmv-profile-phone','fmv-profile-email','fmv-address-list','fmv-checkout-address','fmv-checkout-recipient','fmv-banner-track','fmv-offers-grid','fmv-home-posts'])if($(id))$(id).replaceChildren();
    $('fmv-address-form')?.reset();if($('fmv-address-form'))$('fmv-address-form').hidden=true;
    for(const modal of document.querySelectorAll('#profile-modal,#search-modal,#cart-drawer'))modal.classList.add('hidden');
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)document.querySelectorAll('.fmv-campaign video').forEach(video=>video.pause());
    else prepareCampaignVideos();
  });
  const legacyCheck=window.checkUserSession;
  window.checkUserSession=()=>{legacyCheck();if($('fmv-profile-name'))renderIdentity();};
  const legacyHub=window.openPortalHub;
  window.openPortalHub=tab=>{navigate('profile','workspace');legacyHub(tab);};
  window.switchTab=tab=>navigate(tab);
  window.showCustomerTracking=()=>navigate('profile','orders');
  const legacyCart=window.openCartDrawer,legacySearch=window.openSearchModal;
  window.openCartDrawer=()=>{legacyCart();renderAddressSelect();};
  window.openSearchModal=()=>{legacySearch();setCustomerNavigation('search');};
  for(const name of ['closeCartDrawer','closeSearchModal','closeEditProfileModal']){
    const close=window[name];window[name]=()=>{close();setCustomerNavigation(state.area);};
  }
  window.FMVExperience={navigate,get selectedAddress(){return state.selectedAddress;},refreshAddresses,renderIdentity,applySnapshot};
})();
