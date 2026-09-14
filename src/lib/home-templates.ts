export type HomeThemeKey = 'default'|'diwali'|'holi'|'navratri'|'sale'|'monsoon'|'winter'|'summer'|'rakhi'|'eid'|'new-year'|'auto';

export type HomeTheme = {key:Exclude<HomeThemeKey,'auto'>;label:string;eyebrow:string;title:string;accent:string;shopHref:string;shopLabel:string;decoration:string};

export const HOME_TEMPLATES:Record<Exclude<HomeThemeKey,'auto'>,HomeTheme>={
 default:{key:'default',label:'Priyasa Classic',eyebrow:'PRIYASA / NEW SEASON',title:'Every you, beautifully styled.',accent:'classic',shopHref:'/shop?sort=newest',shopLabel:'Shop new arrivals',decoration:'none'},
 diwali:{key:'diwali',label:'Diwali Glow',eyebrow:'DIWALI EDIT / FESTIVE',title:'Light up every celebration.',accent:'diwali',shopHref:'/shop?collection=festive',shopLabel:'Shop festive edit',decoration:'diyas'},
 holi:{key:'holi',label:'Holi Colours',eyebrow:'HOLI EDIT / COLOUR FEST',title:'Colour your world beautifully.',accent:'holi',shopHref:'/shop?collection=holi',shopLabel:'Shop colour edit',decoration:'powder'},
 navratri:{key:'navratri',label:'Navratri Nights',eyebrow:'NAVRATRI EDIT / FESTIVE',title:'Nine nights. Endless style.',accent:'navratri',shopHref:'/shop?collection=navratri',shopLabel:'Shop Navratri',decoration:'garba'},
 sale:{key:'sale',label:'Big Sale',eyebrow:'PRIYASA SALE / LIMITED TIME',title:'Your favourites, now for less.',accent:'sale',shopHref:'/shop?sort=discount',shopLabel:'Shop sale',decoration:'confetti'},
 monsoon:{key:'monsoon',label:'Monsoon Muse',eyebrow:'MONSOON EDIT / FRESH DROPS',title:'Rainy days, brighter style.',accent:'monsoon',shopHref:'/shop?collection=monsoon',shopLabel:'Shop monsoon edit',decoration:'rain'},
 winter:{key:'winter',label:'Winter Luxe',eyebrow:'WINTER EDIT / NEW LAYERS',title:'Layer up in effortless style.',accent:'winter',shopHref:'/shop?collection=winter',shopLabel:'Shop winter edit',decoration:'snow'},
 summer:{key:'summer',label:'Summer Light',eyebrow:'SUMMER EDIT / EASY DAYS',title:'Light layers. Easy living.',accent:'summer',shopHref:'/shop?collection=summer',shopLabel:'Shop summer edit',decoration:'sun'},
 rakhi:{key:'rakhi',label:'Rakhi Edit',eyebrow:'RAKHI EDIT / CELEBRATE TOGETHER',title:'Made for moments with your people.',accent:'rakhi',shopHref:'/shop?collection=rakhi',shopLabel:'Shop Rakhi edit',decoration:'ribbons'},
 eid:{key:'eid',label:'Eid Edit',eyebrow:'EID EDIT / OCCASION READY',title:'Celebrate in your finest light.',accent:'eid',shopHref:'/shop?collection=eid',shopLabel:'Shop Eid edit',decoration:'stars'},
 'new-year':{key:'new-year',label:'New Year',eyebrow:'NEW YEAR / FRESH START',title:'A new year, a new favourite.',accent:'newyear',shopHref:'/shop?sort=newest',shopLabel:'Shop new arrivals',decoration:'sparkle'},
};

export const TEMPLATE_ORDER:HomeThemeKey[]=['auto','default','sale','diwali','holi','navratri','monsoon','winter','summer','rakhi','eid','new-year'];
function inRange(month:number,start:number,end:number){return start<=end?month>=start&&month<=end:month>=start||month<=end}
export function resolveHomeTheme(value?:string,now=new Date()):Exclude<HomeThemeKey,'auto'>{
 if(value&&value!=='auto'&&value in HOME_TEMPLATES)return value as Exclude<HomeThemeKey,'auto'>;
 if(value==='auto'){const month=now.getMonth()+1;if(inRange(month,10,11))return 'diwali';if(inRange(month,2,3))return 'holi';if(inRange(month,9,10))return 'navratri';if(inRange(month,6,9))return 'monsoon';if(inRange(month,11,2))return 'winter';if(month>=4&&month<=5)return 'summer'}
 return 'default';
}
export function themeFromHome(home:any):Exclude<HomeThemeKey,'auto'>{
 const explicit=String(home?.theme||home?.layout||'').toLowerCase();
 const section=Array.isArray(home?.sections)?home.sections.find((s:any)=>s?.key==='home-theme'||s?.type==='theme'):null;
 const source=section?.content||section?.payload||{};
 const configured=source?.theme||source?.key||source?.template;
 const value=String(configured||explicit||'default').toLowerCase().replace(/[^a-z0-9-]/g,'');
 return resolveHomeTheme(value);
}
