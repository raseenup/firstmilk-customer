const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const a=fs.readFileSync('app.js','utf8'),f=fs.readFileSync('customer-features.js','utf8');
test('Customer sees neutral yard inspection and refund eligibility without driver disciplinary details',()=>{
 assert.match(a,/pickup\.yard_result/);assert.match(f,/pickup\.yard_result/);
 assert.match(a,/approved_for_processing/);
 assert.match(f,/payment not yet confirmed/);
 assert.doesNotMatch(a,/case\.driver_response|case\.investigation_reference/);
});