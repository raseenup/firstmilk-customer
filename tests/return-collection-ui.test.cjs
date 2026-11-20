/* Customer pickup PIN renders only from authenticated owner-scoped API. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const app=fs.readFileSync('app.js','utf8');
const customer=fs.readFileSync('customer-features.js','utf8');
test('Private return code is sourced from customer collection endpoint',()=>{
 assert.match(customer,/\/customer\/return-collections/);
 assert.match(customer,/pickup\.pickup_pin/);
 assert.match(customer,/esc\(pickup\.pickup_pin\)/);
 assert.match(app,/window\.FMVReturns\?\.pickupFor/);
 assert.match(app,/e\(pickup\.pickup_pin\)/);
});
test('Customer order renderer uses cached data after pickup refresh',()=>{
 assert.match(customer,/window\.FMVOrders\?\.redraw\(\)/);
 assert.match(customer,/lastPickupRefresh/);
 assert.match(customer,/fmv:locked/);
});