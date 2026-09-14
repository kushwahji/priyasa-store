import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import {api} from '@/lib/api';
import {HomeTheme,themeFromHome} from '@/lib/home-templates';

export type HomeSection={id?:string|number;key?:string;type?:string;sort_order?:number;is_active?:boolean;title?:string;subtitle?:string;content?:any};
export type HomeConfig={version?:string|number;page?:string;layout?:string;theme?:string;sections?:HomeSection[]};

type Product={id?:string|number;slug?:string;name:string;category?:string;price?:number;mrp?:number;image?:string};

const fallbackTheme:HomeTheme={key:'default',label:'Priyasa Classic',eyebrow:'PRIYASA / NEW SEASON',title:'Every you, beautifully styled.',accent:'classic',shopHref:'/shop?sort=newest',shopLabel:'Shop new arrivals',decoration:'none'};

async function getProducts(query:any):Promise<Product[]>{
  try{
    const qs=new URLSearchParams();
    Object.entries(query||{}).forEach(([k,v])=>{if(v!==undefined&&v!==null&&v!=='')qs.set(k,String(v))});
    const response=await api<any>(`/storefront/products?${qs.toString()}`);
    const data=response?.data ?? response?.products ?? response;
    return Array.isArray(data)?data:(Array.isArray(data?.items)?data.items:[]);
  }catch{return []}
}

function sectionContent(section:HomeSection){return section.content||{}}

export default async function DynamicHome({home,theme}:{home:HomeConfig;theme:HomeTheme}){
  const sections=(home.sections||[]).filter(s=>s.is_active!==false).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
  const hero=sections.find(s=>s.type==='hero_slider' || s.key==='home-hero');
  const heroItem=sectionContent(hero||{}).items?.[0];
  const productSections=sections.filter(s=>['product_carousel','product_grid','flash_sale','personalized_products'].includes(String(s.type)));
  const productResults=await Promise.all(productSections.map(s=>getProducts(sectionContent(s).query||{sort:'newest',limit:12,in_stock:true})));
  const productsByKey=new Map(productSections.map((s,i)=>[String(s.key||s.id||i),productResults[i]]));
  const editorial=sections.find(s=>s.type==='editorial_grid');
  const editorialItems=sectionContent(editorial||{}).items||[];
  const promises=sections.find(s=>s.type==='service_strip');
  const promiseItems=sectionContent(promises||{}).items||[];

  return <main className={`dynamicHome theme-${theme.accent} decoration-${theme.decoration}`} data-theme={theme.key}>
    <div className="seasonalDecoration" aria-hidden="true"><span>✦</span><span>✧</span><span>✦</span><span>✧</span></div>
    <section className="seasonalHero">
      <div className="seasonalHeroMedia" style={heroItem?.image_url?{backgroundImage:`url(${heroItem.image_url})`}:undefined}/>
      <div className="seasonalHeroCopy">
        <span className="eyebrow">{theme.eyebrow}</span>
        <h1>{theme.title}</h1>
        <p>{heroItem?.subtitle || 'Contemporary Indian fashion, everyday essentials and occasion-ready edits designed around real life.'}</p>
        <div className="heroActions"><Link className="button" href={theme.shopHref}>{theme.shopLabel}</Link><Link className="button secondary" href="/shop">Explore all</Link></div>
      </div>
      <div className="seasonBadge"><small>PRIYASA</small><strong>{theme.label}</strong></div>
    </section>

    {promiseItems.length>0 && <section className="trustRail dynamicTrust">{promiseItems.map((item:any,i:number)=><div key={`${item.title}-${i}`}><b>0{i+1}</b><span><strong>{item.title}</strong>{item.subtitle}</span></div>)}</section>}

    {editorialItems.length>0 && <section className="section dynamicEditorial"><div className="sectionHead"><div><span className="eyebrow">PRIYASA STORIES</span><h2>Shop the edit</h2></div><Link className="textLink" href="/shop">View all →</Link></div><div className="editorialGrid">{editorialItems.slice(0,6).map((item:any,i:number)=><Link href={item.href||'/shop'} className={`editorialCard editorial${(i%3)+1}`} key={item.id||item.title}><span>0{i+1}</span><div><small>PRIYASA EDIT</small><h3>{item.title}</h3><p>{item.subtitle}</p><b>Shop edit →</b></div></Link>)}</div></section>}

    {productSections.map((section:any)=>{const products=productsByKey.get(String(section.key||section.id))||[]; if(!products.length)return null; const content=sectionContent(section); return <section className="section dynamicProducts" key={String(section.key||section.id)}><div className="sectionHead"><div><span className="eyebrow">PRIYASA / CURATED</span><h2>{section.title||'Discover more'}</h2>{section.subtitle&&<p className="muted">{section.subtitle}</p>}</div>{content.cta?.href&&<Link className="textLink" href={content.cta.href}>{content.cta.label||'View all'} →</Link>}</div><div className="productGrid">{products.slice(0,Number(content.display?.desktop_columns||4)*2).map((p:any)=><ProductCard key={p.id||p.slug} product={p}/>)}</div></section>})}

    <section className="newsletter dynamicNewsletter"><div><span className="eyebrow">THE PRIYASA EDIT</span><h2>{theme.key==='sale'?'Sale alerts, fresh drops & exclusive offers.':'New drops, styling ideas & offers.'}</h2><p>Be the first to know when a new collection lands.</p></div><form><input type="email" placeholder="Your email address" aria-label="Email address" /><button className="button">Join</button></form></section>
  </main>;
}

export function homeThemeFromConfig(home:HomeConfig){return themeFromHome(home);}
