'use client';

import { useState } from 'react';

type Props={name:string;images:string[]};
export default function ProductGallery({name,images}:Props){
  const [active,setActive]=useState(0);
  const list=images.filter(Boolean);
  if(!list.length)return <div className="pdpGallery"><div className="pdpMainImage galleryEmpty">No product image</div></div>;
  return <div className="pdpGallery">
    <div className="pdpMainImage"><img src={list[active]} alt={`${name} view ${active+1}`}/><span className="galleryCount">{active+1} / {list.length}</span></div>
    <div className="pdpThumbs" role="tablist" aria-label="Product images">
      {list.slice(0,10).map((src,i)=><button type="button" role="tab" aria-selected={active===i} className={`pdpThumb ${active===i?'active':''}`} key={src+i} onClick={()=>setActive(i)}><img src={src} alt={`${name} thumbnail ${i+1}`} loading={i>2?'lazy':undefined}/></button>)}
    </div>
    <div className="pdpMobileStrip">{list.map((src,i)=><button type="button" className={active===i?'active':''} key={`dot${i}`} aria-label={`View image ${i+1}`} onClick={()=>setActive(i)}/>)}</div>
  </div>;
}
