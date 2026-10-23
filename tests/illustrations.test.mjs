import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {illustrations,productImage,variantAnnotation} from '../assets/shop-product-illustrations.js';
test('all 26 supplied images are assigned to the 27 packaging families',()=>{
 assert.equal(Object.keys(illustrations).length,27);
 assert.equal(new Set(Object.values(illustrations)).size,26);
 for(const file of Object.values(illustrations)){
  const b=fs.readFileSync('assets/shop-illustrations/'+file);
  assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');
 }
 assert.equal(illustrations['ps-small-bubble-wrap'],illustrations['ps-jiffy-mono-bubbles-small-bubble-wrap-10mm']);
 assert.match(illustrations['ps-grey-mailing-bags-pack-of-100'],/grey_mailing_bags/);
 assert.match(illustrations['ps-colour-mailing-bags'],/coloured_mailing_bags/);
 assert.match(illustrations['ps-double-wall-boxes'],/double_wall/);
 assert.match(illustrations['ps-thermal-labels-on-rolls'],/thermal_label_rolls/);
 assert.equal(illustrations['jadens-668bt'],undefined);
});
test('illustrations are fallback images and existing product and colour photos take priority',()=>{
 const p={id:'ps-colour-mailing-bags',image_url:''};assert.equal(productImage(p).illustration,true);
 assert.match(productImage(p).src,/26_coloured_mailing_bags.webp$/);
 assert.deepEqual(productImage({...p,image_url:'https://example.com/real.jpg'}),{src:'https://example.com/real.jpg',illustration:false});
 assert.deepEqual(productImage(p,{image:'/pink.webp'}),{src:'/pink.webp',illustration:false});
 assert.deepEqual(productImage({id:'new-product'}),{src:'',illustration:false});
 assert.equal(variantAnnotation({name:'Pink · 230 x 300mm · 100 bags'}),'Pink · 230 x 300mm · 100 bags');
 assert.equal(variantAnnotation({name:'CL-A (100 x 100 x 70mm) · 1 boxes'}),'CL-A (100 x 100 x 70mm) · 1 box');
});
