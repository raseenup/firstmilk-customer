/* First Milk Venture customer help, return status and UPI receipt tracker. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>FMV.escape(s);
  const api=(path,options)=>FMV.request(path,options);
  let lastRefresh=0,lastWalletRefresh=0,refreshing=null,walletRefreshing=null;
  let returns=[],orders=[],transfers=[],pickups=[],pickupRefreshing=null,lastPickupRefresh=0,settings={enabled:false},pendingIntent=null;
  function makeHelp(){
    const profile=$('fmv-profile-area');if(!profile)return;
    // The assistant is a dedicated Profile screen, never a floating button.
    const root=document.createElement('section');
    root.id='fmv-customer-assistant';root.dataset.profileArea='ai';
    root.className='fmv-inline-assistant fmv-panel';root.hidden=true;
    root.innerHTML=`<header><span class="customer-eyebrow">HELP & COMPANY INFORMATION</span>
        <h3>FMV AI</h3><p class="fmv-small">Ask about products, deliveries, returns and approved company policies. For account-specific help, contact support.</p></header>
        <div class="fmv-inline-chat-feed" id="fmv-customer-chat-feed" role="log" aria-label="FMV AI conversation" aria-live="polite"><p>Welcome to FMV AI. How can I help you?</p></div>
        <form class="fmv-floating-form" id="fmv-customer-chat">
          <label for="fmv-customer-chat-text">Ask FMV AI</label>
          <textarea id="fmv-customer-chat-text" maxlength="1200" required rows="3" placeholder="What is your return policy?"></textarea>
          <button type="submit">Send question</button>
        </form>
        <button type="button" class="fmv-feature-button" id="fmv-customer-human">Contact customer support</button>`;
    profile.append(root);
    $('fmv-customer-chat').addEventListener('submit',async ev=>{
      ev.preventDefault();if(!FMV.user)return;
      const input=$('fmv-customer-chat-text'),question=input.value.trim();if(!question)return;
      input.value='';
      const feed=$('fmv-customer-chat-feed'),say=text=>{
        const p=document.createElement('p');p.textContent=text;feed.append(p);feed.scrollTop=feed.scrollHeight;};
      say('You: '+question);
      const button=ev.currentTarget.querySelector('button');button.disabled=true;
      try{
        const r=await api('/assistant/chat',{method:'POST',body:{message:question}});
        say('FMV AI: '+r.reply+(r.sources?.length?'\\nSources: '+r.sources.map(s=>s.title).join(', '):''));
      }catch(error){say('FMV AI could not check the current guidance. '+error.message);}
      finally{button.disabled=false;}
    });
    $('fmv-customer-human').addEventListener('click',()=>{
      if(typeof openPortalHub==='function')openPortalHub('support-kb');
    });
  }
  function makeReturns(){
    const parent=document.querySelector('.customer-deliveries');if(!parent)return;
    const section=document.createElement('section');section.id='fmv-returns-panel';section.className='fmv-returns-panel';
    section.innerHTML=`<h4>Orders, returns & refunds</h4><p>View separate order statuses and request a return after delivery.</p>
      <div class="fmv-studio-grid">
      <div><h4>Delivered</h4><div id="fmv-delivered-orders" class="fmv-returns-cards"></div></div>
      <div><h4>Cancelled</h4><div id="fmv-cancelled-orders" class="fmv-returns-cards"></div></div>
      <div><h4>Returned or refunded</h4><div id="fmv-returned-orders" class="fmv-returns-cards"></div></div>
      </div>
      <form id="fmv-new-return" class="fmv-studio-form">
        <h4>Request product return or refund</h4>
        <label>Delivered order<select name="order_id" required><option value="">Select a delivered order</option></select></label>
        <label>Request<select name="request_type"><option value="return">Return product</option><option value="refund">Refund request</option></select></label>
        <label>Reason<textarea rows="3" name="reason" minlength="8" maxlength="1500" required placeholder="Tell us what happened with your product."></textarea></label>
        <button type="submit" class="fmv-feature-button">Submit for review</button>
        <p class="fmv-small">Submission does not automatically approve a refund. The published policy and finance review apply.</p>
      </form>`;
    parent.append(section);
    $('fmv-new-return').addEventListener('submit',async ev=>{
      ev.preventDefault();if(!FMV.user)return;
      const f=ev.currentTarget,button=f.querySelector('button');button.disabled=true;
      try{await api('/customer/returns',{method:'POST',body:{order_id:f.elements.order_id.value,
        request_type:f.elements.request_type.value,reason:f.elements.reason.value}});
        f.reset();
        // Refresh after the committed mutation; preserve successful return history
        // even if a previous background read was already in progress.
        if(refreshing)await refreshing;
        lastRefresh=0;
        await refresh(true);
        document.querySelector('[data-order-section="returned"]')?.click();
        FMV.notice('Return/refund request submitted for review. It is not automatically approved.');}
      catch(error){FMV.notice(error.message,true);}finally{button.disabled=false;}
    });
  }
  // Open the pre-existing, server-validated return request form directly
  // from a delivered order. Never create claims without an explicit submission.
  async function openReturnForm(orderId){
    if(!FMV.user)throw new Error('Sign in before requesting a return.');
    if(!orders.some(order=>order.id===orderId)){
      const rows=await api('/orders');
      orders=Array.isArray(rows)?rows:[];
    }
    const order=orders.find(item=>item.id===orderId);
    if(!order || order.status!=='Delivered')throw new Error('Returns can be requested only for your delivered orders.');
    const active=returns.find(item=>item.order_id===orderId && !['rejected','cancelled'].includes(item.status));
    if(active){
      document.querySelector('[data-order-section="returned"]')?.click();
      document.getElementById('dashboard-orders-list')?.scrollIntoView({block:'start',behavior:'smooth'});
      FMV.notice('A return or refund request is already being processed for this order.');
      return;
    }
    window.FMVExperience?.navigate('profile','orders');
    const panel=$('fmv-returns-panel'),form=$('fmv-new-return');
    if(!panel || !form)throw new Error('Return form is unavailable. Refresh the page and retry.');
    // Use a freshly fetched order list when necessary; the backend enforces ownership,
    // delivery status and duplicate claim validation again on submission.
    const select=form.elements.order_id;
    if(![...select.options].some(option=>option.value===orderId)){
      const option=document.createElement('option');option.value=orderId;
      option.textContent=order.order_number || orderId;select.append(option);
    }
    select.value=orderId;
    form.elements.request_type.value='return';
    panel.scrollIntoView({block:'start',behavior:'smooth'});
    form.elements.reason.focus({preventScroll:true});
  }
  function makeUPI(){
    const wallet=document.querySelector('[data-profile-area="wallet"]');if(!wallet)return;
    const section=document.createElement('section');section.id='fmv-upi-payment-panel';section.className='fmv-payment-panel';
    section.innerHTML=`<h3>Pay using UPI</h3><p id="fmv-upi-receiver" class="fmv-small">Checking availability…</p>
      <form id="fmv-upi-create" class="fmv-studio-form">
        <label>Payment amount (₹)<input name="amount" inputmode="decimal" type="text" required placeholder="Enter any positive amount"></label>
        <label>Payment purpose<input name="note" maxlength="120" value="First Milk Venture customer payment"></label>
        <button type="submit" class="fmv-feature-button">Generate UPI payment</button>
      </form>
      <div id="fmv-upi-open"></div><h4>UPI payment history</h4><div id="fmv-upi-history" class="fmv-returns-cards"></div>
      <p class="fmv-small">This is an unallocated merchant payment, not an automatic wallet top-up or order settlement. Payment is only confirmed after bank reconciliation. UPI app/bank transaction limits still apply.</p>`;
    wallet.append(section);
    $('fmv-upi-create').addEventListener('submit',async ev=>{
      ev.preventDefault();if(!FMV.user)return;
      const form=ev.currentTarget,button=form.querySelector('button');button.disabled=true;
      try{const amount=form.elements.amount.value.trim();
        if(!/^\d+(?:\.\d{1,2})?$/.test(amount) || !Number.isFinite(Number(amount)) || Number(amount)<=0)
          throw Error('Enter a positive amount with no more than two decimal places.');
        const r=await api('/customer/payment/upi',{method:'POST',body:{amount,note:form.elements.note.value}});
        pendingIntent=r.transfer;
        const anchor=document.createElement('a');anchor.href=r.upi_url;anchor.textContent='Open payment in UPI app';
        anchor.className='fmv-feature-button';anchor.rel='noopener';
        const box=$('fmv-upi-open');box.replaceChildren(anchor);
        const note=document.createElement('p');note.textContent='Transfer reference: '+r.transfer.id+' · Report your bank transaction reference after paying.';box.append(note);
        FMV.notice('UPI payment intent created. Bank verification is required.');await refresh(true);
      }catch(error){FMV.notice(error.message,true);}finally{button.disabled=false;}
    });
    $('fmv-upi-history').addEventListener('click',async ev=>{
      const button=ev.target.closest('[data-upi-report]');if(!button)return;
      const transaction_reference=prompt('Enter the UPI transaction reference from your payment app:');
      if(!transaction_reference)return;button.disabled=true;
      try{await api('/customer/payment/upi/'+encodeURIComponent(button.dataset.upiReport)+'/reported',
        {method:'POST',body:{transaction_reference}});
        FMV.notice('Reference submitted. Your payment is NOT yet confirmed.');await refresh(true);}
      catch(error){FMV.notice(error.message,true);}finally{button.disabled=false;}
    });
  }
  function statusCard(o){return `<div class="fmv-returns-card"><strong>${esc(o.id)}</strong>
    <small>${esc(o.status)} · ${esc(o.payment_status || '')} · ₹${Number(o.total_amount || 0).toFixed(2)}</small></div>`;}
  function render(){
    const user=FMV.user;if(!user)return;
    const claimsByOrder=new Map(returns.map(x=>[x.order_id,x]));
    const delivered=orders.filter(o=>o.status==='Delivered');
    const cancelled=orders.filter(o=>o.status==='Cancelled');
    const returned=returns.filter(x=>x.status!=='rejected');
    $('fmv-delivered-orders').innerHTML=delivered.map(statusCard).join('') || '<p>No completed deliveries yet.</p>';
    $('fmv-cancelled-orders').innerHTML=cancelled.map(statusCard).join('') || '<p>No cancelled orders.</p>';
    $('fmv-returned-orders').innerHTML=returned.map(x=>{
      const pickup=pickups.find(p=>p.id===x.id);
      return `<article class="fmv-returns-card">
        <strong>${esc(x.id)} · ${esc(x.status.replaceAll('_',' '))}</strong>
        <small>Order ${esc(x.order_id)} · ${esc(x.reason || '')}</small>
        ${x.refund_reference?`<small>Refund reference: ${esc(x.refund_reference)}</small>`:''}
        ${pickup?`<div class="fmv-pickup-info">
          <strong>Item pickup: ${esc(pickup.status)}</strong>
          <small>Scheduled: ${esc(pickup.scheduled_date || 'To be arranged')} · Driver: ${esc(pickup.driver_name || 'Pending')}</small>
          ${pickup.pickup_pin?`<p class="fmv-pickup-secret"><span>One-time collection PIN</span><strong>${esc(pickup.pickup_pin)}</strong></p><small>Give this code only when the assigned driver is physically collecting the item. Do not share login or delivery PINs.</small>`:''}
          <small>${esc(pickup.instructions || '')}</small>
        </div>`:''}
      </article>`;
    }).join('') || '<p>No return/refund requests yet.</p>';
    const select=$('fmv-new-return').elements.order_id,selected=select.value;
    select.innerHTML='<option value="">Select a delivered order</option>'+delivered.filter(o=>!claimsByOrder.has(o.id) ||
      claimsByOrder.get(o.id).status==='rejected').map(o=>`<option value="${esc(o.id)}">${esc(o.id)}</option>`).join('');
    if([...select.options].some(o=>o.value===selected))select.value=selected;
    renderWallet();
  }
  function renderWallet(){
    if(!$('fmv-upi-receiver') || !$('fmv-upi-create') || !$('fmv-upi-history'))return;
    $('fmv-upi-receiver').textContent=settings.enabled?
      'Receiving account: '+settings.payee_name+' · '+settings.upi_id:
      'UPI is not enabled by the company. Choose an available checkout method.';
    $('fmv-upi-create').querySelector('button').disabled=!settings.enabled;
    $('fmv-upi-history').innerHTML=transfers.slice().reverse().map(p=>`<article class="fmv-returns-card">
      <strong>₹${esc(p.amount)} · ${esc(p.status.replaceAll('_',' '))}</strong><small>${esc(p.id)}</small>
      ${p.status==='initiated'?`<button class="fmv-feature-button" type="button" data-upi-report="${esc(p.id)}">I paid — report UPI reference</button>`:''}
      ${p.customer_reference?`<small>Reported: ${esc(p.customer_reference)}</small>`:''}
      </article>`).join('') || '<p>No UPI transfers yet.</p>';
  }
  function refreshPickups(force=false){
    if(!FMV.user)return Promise.resolve();
    if(pickupRefreshing)return pickupRefreshing;
    if(!force && Date.now()-lastPickupRefresh<15000)return Promise.resolve();
    const owner=FMV.user.id;
    pickupRefreshing=(async()=>{
      try{
        const response=await api('/customer/return-collections');
        if(FMV.user?.id!==owner)return;
        pickups=Array.isArray(response.pickups)?response.pickups:[];
        lastPickupRefresh=Date.now();
        render();
        if(window.FMVOrders?.section==='returned')window.FMVOrders?.redraw();
      }catch(error){
        if(force && FMV.user?.id===owner)FMV.notice('Return pickup information could not be refreshed.',true);
      }
    })().finally(()=>{pickupRefreshing=null;});
    return pickupRefreshing;
  }
  function refreshWallet(force=false){
    if(!FMV.user)return Promise.resolve();
    if(walletRefreshing)return walletRefreshing;
    if(!force && Date.now()-lastWalletRefresh<60000)return Promise.resolve();
    const owner=FMV.user.id;
    walletRefreshing=(async()=>{
      try{
        const result=await api('/customer/payment/upi');
        if(FMV.user?.id!==owner)return;
        settings=result.settings || {enabled:false};
        transfers=Array.isArray(result.transfers)?result.transfers:[];
        lastWalletRefresh=Date.now();
        renderWallet();
      }catch(error){
        // UPI balance/merchant availability is nonessential for order history.
        // Keep its existing disabled UI instead of delaying returns or orders.
        if(force && FMV.user?.id===owner)FMV.notice('UPI details are temporarily unavailable.',true);
      }
    })().finally(()=>{walletRefreshing=null;});
    return walletRefreshing;
  }
  function refresh(force=false){
    if(!FMV.user)return Promise.resolve();
    if(refreshing)return refreshing;
    if(!force && Date.now()-lastRefresh<20000)return Promise.resolve();
    const owner=FMV.user.id;
    // Use two essential concurrent reads so a slow payment service never
    // blocks order/return processing. FMV.request deduplicates concurrent GETs.
    refreshing=(async()=>{
      try{
        const [claimsResult,orderRows]=await Promise.all([
          api('/customer/returns'),api('/orders')
        ]);
        if(FMV.user?.id!==owner)return;
        returns=Array.isArray(claimsResult.claims)?claimsResult.claims:[];
        orders=Array.isArray(orderRows)?orderRows:[];
        lastRefresh=Date.now();
        render();
        window.FMVOrders?.updateReturns(returns);
      }catch(error){
        if(force && FMV.user?.id===owner)FMV.notice(error.message,true);
      }
    })().finally(()=>{refreshing=null;});
    void refreshWallet();
    // Pickup PINs are sensitive: load only while the customer explicitly
    // views Returned history, not in the background on every home page.
    if(window.FMVOrders?.section==='returned')void refreshPickups();
    return refreshing;
  }
  window.FMVReturns={open:openReturnForm,refresh:()=>refresh(true),pickupFor:claimId=>pickups.find(p=>p.id===claimId)||null};
  document.addEventListener('DOMContentLoaded',()=>{
    makeHelp();makeReturns();makeUPI();
    // Fetch receiving UPI details on demand if wallet is opened.
    document.addEventListener('click',event=>{
      if(event.target.closest('[data-fmv-action="wallet"]'))void refreshWallet(true);
      if(event.target.closest('[data-order-section="returned"]'))void refreshPickups(true);
      if(event.target.closest('[data-order-section]') &&
         !event.target.closest('[data-order-section="returned"]')){
        pickups=[];lastPickupRefresh=0;
      }
    });
  });
  document.addEventListener('fmv:authenticated',()=>{FMV.guard(()=>refresh(true));});
  document.addEventListener('fmv:sync',()=>FMV.guard(()=>refresh()));
  document.addEventListener('fmv:locked',()=>{if($('fmv-customer-assistant'))$('fmv-customer-assistant').hidden=true;
    if($('fmv-customer-chat-feed'))$('fmv-customer-chat-feed').replaceChildren();
    lastRefresh=0;lastWalletRefresh=0;lastPickupRefresh=0;returns=[];orders=[];transfers=[];pickups=[];settings={enabled:false};
    // Clear customer-visible data immediately, even if old requests resolve later.
    window.FMVOrders?.updateReturns([]);
    if($('fmv-upi-history'))$('fmv-upi-history').replaceChildren();
    if($('fmv-returned-orders'))$('fmv-returned-orders').replaceChildren();
  });
})();