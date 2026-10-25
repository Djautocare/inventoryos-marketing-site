import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('public contact fields, safe scripts, email alternative, navigation and sitemap',()=>{const html=fs.readFileSync('contact.html','utf8'),js=fs.readFileSync('assets/contact.js','utf8');
 for(const id of ['contact-name','contact-email','contact-message'])assert.match(html,new RegExp('<(?:input|textarea)[^>]*id="'+id+'"[^>]*required'));
 assert.match(html,/<input[^>]*id="contact-topic"[^>]*>/);assert.ok(!/<input[^>]*id="contact-topic"[^>]*required/.test(html));
 assert.ok(html.includes('mailto:hello@inventoryos.co.uk'));assert.ok(html.includes('Alternatively, contact us via'));assert.ok(html.includes('id="contact-form"'));assert.ok(!/<script(?![^>]*src=)[^>]*>/.test(html));assert.ok(!/\son[a-z]+\s*=/.test(html));assert.ok(js.includes("credentials:'omit'"));assert.ok(js.includes('crypto.randomUUID()'));assert.ok(js.includes('status.textContent=text'));
 assert.ok(fs.readFileSync('sitemap.xml','utf8').includes('https://inventoryos.co.uk/contact'));for(const page of ['index.html','manufacturing.html','retail.html','shop.html','features.html'])assert.ok(fs.readFileSync(page,'utf8').includes('href="/contact"'),page);
});
