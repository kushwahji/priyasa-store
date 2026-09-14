import DynamicHome, {homeThemeFromConfig, HomeConfig} from '@/components/DynamicHome';
import {api} from '@/lib/api';
import {HOME_TEMPLATES} from '@/lib/home-templates';

export const dynamic = 'force-dynamic';

const fallback:HomeConfig={
  page:'home',
  layout:'myntra-fashion-v1',
  sections:[
    {key:'home-promises',type:'service_strip',sort_order:20,is_active:true,content:{items:[{title:'Curated styles',subtitle:'Fresh edits every week'},{title:'Secure checkout',subtitle:'Protected payments'},{title:'Easy returns',subtitle:'Simple eligible returns'},{title:'India-wide delivery',subtitle:'COD available'}]}},
    {key:'home-editorial',type:'editorial_grid',sort_order:40,is_active:true,content:{items:[{id:'1',title:'Everyday Edit',subtitle:'Easy silhouettes, polished details.',href:'/shop?collection=everyday'},{id:'2',title:'Festive Edit',subtitle:'Statement looks for the moments that matter.',href:'/shop?collection=festive'},{id:'3',title:'Workday Edit',subtitle:'Sharp, comfortable and ready for the day.',href:'/shop?collection=workwear'}]}},
    {key:'home-new-arrivals',type:'product_carousel',sort_order:50,is_active:true,title:'New Arrivals',subtitle:'Fresh styles just landed',content:{query:{sort:'newest',limit:12,in_stock:true},cta:{label:'View All',href:'/shop?sort=newest'}}},
  ],
};

async function getHome():Promise<HomeConfig>{
  try{
    const response=await api<any>('/storefront/home');
    return response?.data ?? response ?? fallback;
  }catch{return fallback}
}

export default async function Home(){
  const home=await getHome();
  const key=homeThemeFromConfig(home);
  const theme=HOME_TEMPLATES[key] || HOME_TEMPLATES.default;
  return <DynamicHome home={home} theme={theme}/>;
}
