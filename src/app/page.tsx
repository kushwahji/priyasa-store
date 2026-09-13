import Link from 'next/link';

const categories = [
  ['New In', 'NEW', 'Discover the latest drops'],
  ['Kurtis', '01', 'Easy everyday dressing'],
  ['Ethnic Wear', '02', 'Occasion-ready edits'],
  ['Dresses', '03', 'Modern silhouettes'],
  ['Nightwear', '04', 'Comfort, elevated'],
  ['Activewear', '05', 'Move in confidence'],
  ['Lingerie', '06', 'Everyday essentials'],
  ['Sale', 'SALE', 'Best value edits'],
];

const editorial = [
  ['Everyday Edit', 'Easy silhouettes, polished details.', '/shop?category=everyday'],
  ['Festive Edit', 'Statement looks for the moments that matter.', '/shop?category=festive'],
  ['Workday Edit', 'Sharp, comfortable and ready for the day.', '/shop?category=workwear'],
];

export default function Home() {
  return <>
    <section className="hero">
      <div className="heroMedia" />
      <div className="heroCopy">
        <span className="eyebrow">PRIYASA / NEW SEASON</span>
        <h1>Every you,<br /><em>beautifully styled.</em></h1>
        <p>Contemporary Indian fashion, everyday essentials and occasion-ready edits designed around real life.</p>
        <div className="heroActions"><Link className="button" href="/shop?sort=newest">Shop new arrivals</Link><Link className="button secondary" href="/shop">Explore all</Link></div>
      </div>
    </section>

    <section className="trustRail"><div><b>01</b><span><strong>Curated styles</strong>Fresh edits every week</span></div><div><b>02</b><span><strong>Secure checkout</strong>Protected payments</span></div><div><b>03</b><span><strong>Easy returns</strong>Simple eligible returns</span></div><div><b>04</b><span><strong>India-wide delivery</strong>COD available</span></div></section>

    <section className="section"><div className="sectionHead"><div><span className="eyebrow">SHOP THE EDIT</span><h2>Find your next favourite</h2></div><Link className="textLink" href="/shop">View all →</Link></div><div className="categoryGrid">{categories.map(([name, number, copy]) => <Link className="categoryCard" key={name} href={name === 'New In' ? '/shop?sort=newest' : `/search?q=${encodeURIComponent(name)}`}><div className="categoryArt"><span>{number}</span></div><div><strong>{name}</strong><small>{copy}</small></div></Link>)}</div></section>

    <section className="section editorialSection"><div className="sectionHead"><div><span className="eyebrow">PRIYASA STORIES</span><h2>Dress for your day</h2></div></div><div className="editorialGrid">{editorial.map(([title, copy, href], i) => <Link href={href} className={`editorialCard editorial${i + 1}`} key={title}><span>0{i + 1}</span><div><small>PRIYASA EDIT</small><h3>{title}</h3><p>{copy}</p><b>Shop edit →</b></div></Link>)}</div></section>

    <section className="newsletter"><div><span className="eyebrow">THE PRIYASA EDIT</span><h2>New drops, styling ideas & offers.</h2><p>Be the first to know when a new collection lands.</p></div><form><input type="email" placeholder="Your email address" aria-label="Email address" /><button className="button">Join</button></form></section>
  </>;
}
