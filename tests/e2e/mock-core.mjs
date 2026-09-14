import http from 'node:http';

const port = Number(process.env.MOCK_CORE_PORT || 8787);
const state = { otpRequestId: 'otp-test-1', accessToken: 'e2e-access-token', orderId: '1001', addressId: 'addr-1', paymentOrderId: 'pay-order-1' };
const json = (res, status, body) => { res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(body)); };
const readBody = (req) => new Promise(resolve => { let raw=''; req.on('data', c => raw += c); req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); } }); });
const products = [
  { id:101, slug:'e2e-kurti', name:'PRIYASA Everyday Kurti', category:'Kurtis', pricing:{mrp:1999,selling_price:999,currency:'INR'}, media:[{url:'/placeholder-product.svg'}], variants:[{id:1,sku:'E2E-001',label:'M',size:'M',color:'Pink',stock:10,price:999}] },
  { id:102, slug:'e2e-dress', name:'PRIYASA Edit Dress', category:'Dresses', pricing:{mrp:2499,selling_price:1499,currency:'INR'}, media:[{url:'/placeholder-product.svg'}], variants:[{id:2,sku:'E2E-002',label:'M',size:'M',color:'Black',stock:8,price:1499}] },
  { id:103, slug:'e2e-nightwear', name:'PRIYASA Soft Night Set', category:'Nightwear', pricing:{mrp:1799,selling_price:899,currency:'INR'}, media:[{url:'/placeholder-product.svg'}], variants:[{id:3,sku:'E2E-003',label:'M',size:'M',color:'Rose',stock:12,price:899}] },
];
const authenticated = req => (req.headers.authorization || '').includes(state.accessToken);
const server = http.createServer(async (req,res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`); const path = url.pathname.replace(/^\/api\/v1\/?/, '/'); const body = await readBody(req); const auth = authenticated(req);
  if(req.method==='POST' && path==='/auth/send-otp') return json(res,200,{success:true,data:{request_id:state.otpRequestId}});
  if(req.method==='POST' && path==='/auth/resend-otp') return json(res,200,{success:true,data:{request_id:state.otpRequestId}});
  if(req.method==='POST' && path==='/auth/verify-otp') return json(res,200,{success:true,data:{access_token:state.accessToken,token:state.accessToken}});
  if(req.method==='POST' && ['/auth/logout','/storefront/session/logout'].includes(path)) return json(res,200,{success:true});
  if(path==='/storefront/session') return auth ? json(res,200,{success:true,data:{authenticated:true}}) : json(res,401,{success:false,message:'Unauthenticated'});
  if(req.method==='GET' && path==='/storefront/home') return json(res,200,{success:true,data:{version:1,currency:'INR',locale:'en-IN',sections:[{id:1,key:'home-hero',type:'hero_slider',sort_order:10,is_active:true,content:{autoplay:false,items:[{id:'hero-1',title:'Style It Your Way',subtitle:'Trendy fashion for every version of you.',eyebrow:'NEW SEASON',image_url:'/placeholder-product.svg',mobile_image_url:'/placeholder-product.svg',cta:{label:'Shop Now',href:'/shop'}}]}},{id:2,key:'home-promises',type:'service_strip',sort_order:20,is_active:true,content:{items:[{icon:'return',title:'7 Days',subtitle:'Easy Returns'},{icon:'shield',title:'Premium',subtitle:'Quality'},{icon:'truck',title:'COD',subtitle:'Available'},{icon:'location',title:'Pan India',subtitle:'Delivery'}]}},{id:3,key:'home-new-arrivals',type:'product_carousel',sort_order:30,is_active:true,title:'New Arrivals',subtitle:'Fresh styles just landed',content:{query:{sort:'newest',limit:12,in_stock:true},cta:{label:'View All',href:'/shop?sort=newest'}}},{id:4,key:'home-offer-banner',type:'offer_banner',sort_order:60,is_active:true,content:{eyebrow:'LIMITED TIME OFFER',title:'FLAT 30% OFF',subtitle:'Upgrade your wardrobe with selected styles.',image_url:'/placeholder-product.svg',mobile_image_url:'/placeholder-product.svg',cta:{label:'Shop Sale',href:'/shop?sort=discount'}}}]}});
  if(req.method==='GET' && path==='/storefront/products') { const q=(url.searchParams.get('q')||'').toLowerCase(); const cat=(url.searchParams.get('category')||'').toLowerCase(); const result=products.filter(p=>(!q||`${p.name} ${p.category}`.toLowerCase().includes(q))&&(!cat||p.category.toLowerCase()===cat)); return json(res,200,{success:true,data:{data:result,current_page:1,last_page:1,total:result.length}}); }
  if(req.method==='GET' && path.startsWith('/storefront/products/')) { const slug=path.split('/').pop(); const product=products.find(p=>p.slug===slug)||products[0]; return json(res,200,{success:true,data:{product,variants:product.variants,reviews:{data:[],total:0}}}); }
  if(!auth && ['/storefront/cart/experience','/storefront/wishlist/items','/storefront/orders','/storefront/addresses','/storefront/notifications/inbox','/storefront/notifications/unread','/storefront/returns'].some(p=>path===p)) return json(res,401,{success:false,message:'Unauthenticated'});
  if(path==='/storefront/cart/experience') return json(res,200,{success:true,data:{cart:{items:[{id:'item-1',product:products[0],quantity:1,variant_id:1,unit_price:999}],subtotal:999,discount_total:0,shipping_total:0,total:999,currency:'INR'}}});
  if(path==='/storefront/cart/items' && req.method==='POST') return json(res,200,{success:true,data:{cart:{items:[{id:'item-1',product:products[0],quantity:Number(body.quantity||1),variant_id:body.variant_id||1}],subtotal:999,total:999}}});
  if(path.startsWith('/storefront/cart/items/') && req.method==='PATCH') return json(res,200,{success:true,data:{updated:true}});
  if(path.startsWith('/storefront/cart/items/') && req.method==='DELETE') return json(res,200,{success:true,data:{removed:true}});
  if(path==='/storefront/wishlist/items') return json(res,200,{success:true,data:{items:[]}});
  if(path==='/storefront/addresses') return req.method==='GET' ? json(res,200,{success:true,data:{addresses:[{id:state.addressId,name:'E2E Customer',phone:'9999999999',line1:'1 Test Street',city:'Delhi',state:'Delhi',postal_code:'110001',is_default:true}]}}) : json(res,200,{success:true,data:{address:{id:state.addressId,...body}}});
  if(path==='/storefront/checkout/validate' && req.method==='POST') return json(res,200,{success:true,data:{subtotal:999,discount_total:body.coupon_code ? 100 : 0,shipping_total:0,tax_total:0,grand_total:body.coupon_code ? 899 : 999,currency:'INR',payment_methods:[{code:'cod',label:'Cash on Delivery'},{code:'razorpay',label:'Online Payment'}]}});
  if(path==='/storefront/checkout/create-order' && req.method==='POST') return json(res,200,{success:true,data:{order:{id:state.orderId,status:body.payment_method==='cod'?'confirmed':'pending',grand_total:body.coupon_code?899:999,payment_method:body.payment_method}}});
  if(path===`/storefront/orders/${state.orderId}/payment` && req.method==='POST') return json(res,200,{success:true,data:{payment:{razorpay_order_id:state.paymentOrderId,provider_order_id:state.paymentOrderId,amount:99900,currency:'INR',key_id:'rzp_test_e2e',prefill:{}}}});
  if(path===`/storefront/orders/${state.orderId}/payment/capture` && req.method==='POST') return json(res,200,{success:true,data:{payment:{status:'captured',provider_payment_id:body.provider_payment_id},order:{id:state.orderId,status:'confirmed'}}});
  if(path===`/storefront/orders/${state.orderId}/payment` && req.method==='GET') return json(res,200,{success:true,data:{payment:{status:'pending'}}});
  if(path==='/storefront/orders') return json(res,200,{success:true,data:{orders:[]}});
  if(path.startsWith('/storefront/orders/')) return json(res,200,{success:true,data:{order:{id:state.orderId,status:'confirmed',items:[],grand_total:999}}});
  if(path==='/storefront/notifications/unread') return json(res,200,{success:true,data:{unread:0}});
  if(path==='/storefront/notifications/inbox') return json(res,200,{success:true,data:{notifications:[]}});
  if(path==='/device/register' && req.method==='POST') return json(res,200,{success:true,data:{registered:true}});
  if(path.startsWith('/storefront/')) return json(res,200,{success:true,data:{}});
  return json(res,404,{success:false,message:`Mock Core route not implemented: ${req.method} ${path}`});
});
server.listen(port,'127.0.0.1',()=>console.log(`Mock PriyasaCore listening on ${port}`));