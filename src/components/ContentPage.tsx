'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Block = { title?: string; body?: string; items?: string[] };
type CmsPayload = { data?: { title?: string; description?: string; blocks?: Block[] }; title?: string; description?: string; blocks?: Block[] };

const defaults: Record<string, { title: string; intro: string; blocks: Block[] }> = {
  about: { title: 'About PRIYASA', intro: 'PRIYASA is a modern shopping destination for fashion, beauty, lifestyle and everyday essentials.', blocks: [
    { title: 'Our approach', body: 'We bring discovery, useful product information and a dependable checkout experience together in one simple storefront.' },
    { title: 'What you can expect', items: ['Curated collections and new arrivals', 'Transparent pricing and offers', 'Secure account and checkout flows', 'Order tracking and customer support'] },
    { title: 'Our promise', body: 'We aim to make every visit useful, every purchase clear and every customer interaction respectful.' },
  ] },
  terms: { title: 'Terms & Conditions', intro: 'These terms govern your use of the PRIYASA website, services and purchases.', blocks: [
    { title: 'Using PRIYASA', body: 'You must provide accurate information, keep account credentials secure and use the service only for lawful purposes.' },
    { title: 'Products and pricing', body: 'Product availability, descriptions, prices, promotions and delivery estimates may change. The checkout page shows the applicable order total before confirmation.' },
    { title: 'Orders and payments', body: 'An order is subject to availability, payment authorization and applicable fraud or risk checks. We may contact you when clarification is required.' },
    { title: 'Intellectual property', body: 'PRIYASA content, branding, designs and software are protected by applicable intellectual-property laws.' },
    { title: 'Updates', body: 'We may update these terms when our services, legal obligations or operating practices change.' },
  ] },
  privacy: { title: 'Privacy Policy', intro: 'This policy explains how PRIYASA handles information needed to operate the shopping service.', blocks: [
    { title: 'Information we use', body: 'We may process account, contact, delivery, order, payment-status, device and service-interaction information required to provide the service.' },
    { title: 'Why we use it', items: ['Create and secure your account', 'Process orders, payments, delivery and returns', 'Provide customer support and service messages', 'Improve reliability, security and shopping experience'] },
    { title: 'Notifications and marketing', body: 'Optional browser or app notifications are requested through permission controls. Marketing preferences can be changed where supported.' },
    { title: 'Security', body: 'Authentication credentials and payment-sensitive data are handled through controlled service boundaries. Never share OTPs or passwords with anyone.' },
    { title: 'Your choices', body: 'You can request account assistance, notification changes or privacy-related support through the Contact page.' },
  ] },
  returns: { title: 'Return & Refund Policy', intro: 'Our return process is designed to make eligible returns clear and traceable.', blocks: [
    { title: 'Return window', body: 'Eligibility and the applicable return window are shown against the order or product where available. Items must satisfy the condition requirements communicated at purchase.' },
    { title: 'Eligibility', items: ['Item must match the order', 'Product should be unused unless the product category permits otherwise', 'Original tags, packaging or accessories may be required', 'Certain hygiene or final-sale categories may be excluded'] },
    { title: 'Refunds', body: 'Approved refunds are processed through the applicable payment or refund workflow. Timing can vary by payment method and financial institution.' },
    { title: 'Damaged or incorrect items', body: 'Report damaged, missing or incorrect items promptly through the order support flow so the case can be investigated.' },
  ] },
  shipping: { title: 'Shipping & Delivery', intro: 'Delivery availability and charges are calculated using the destination, cart and applicable shipping rules.', blocks: [
    { title: 'Delivery estimates', body: 'Estimated delivery dates are provided where available and can change because of inventory, carrier, weather or service-area conditions.' },
    { title: 'Charges', body: 'Applicable shipping charges and free-shipping thresholds are shown during shopping or checkout before the order is placed.' },
    { title: 'Address accuracy', body: 'Please verify your address and contact information before placing an order. Changes after dispatch may not be possible.' },
    { title: 'Tracking', body: 'When tracking information is available, it can be viewed from the Orders section of your account.' },
  ] },
  contact: { title: 'Contact PRIYASA', intro: 'Need help with an order, account, payment, delivery or return? Start with the relevant support flow below.', blocks: [
    { title: 'Order support', body: 'Sign in and open My Orders to view order details, tracking, cancellation and return options when available.' },
    { title: 'Account support', body: 'For sign-in or profile issues, use the secure OTP login flow and then open Account.' },
    { title: 'General support', body: 'Email support: support@priyasa.com. Include your order number when your request concerns an existing order. Never include an OTP, password or full payment credentials.' },
  ] },
  faq: { title: 'Frequently Asked Questions', intro: 'Quick answers for common shopping, account, payment and delivery questions.', blocks: [
    { title: 'How do I sign in?', body: 'Use your mobile number and the OTP sent by PRIYASA. Your authenticated session is kept in a secure server-side cookie.' },
    { title: 'How can I track my order?', body: 'Open Account → Orders and select the relevant order to see available tracking information.' },
    { title: 'Can I return an item?', body: 'Open the order and use the return option when the product and order are eligible under the applicable policy.' },
    { title: 'How are refunds processed?', body: 'Approved refunds are sent through the applicable payment/refund workflow. Bank or card processing times may vary.' },
    { title: 'How do I receive shopping notifications?', body: 'Use the notification permission card on the home page. You can allow browser notifications and register the device for PRIYASA shopping messages.' },
    { title: 'Can I stop notifications?', body: 'You can disable browser notification permission in your browser settings. PRIYASA also respects the notification preference stored for the shopping device where supported.' },
  ] },
};

export default function ContentPage({ pageKey }: { pageKey: keyof typeof defaults }) {
  const fallback = defaults[pageKey];
  const [content, setContent] = useState(fallback);
  const [open, setOpen] = useState<number | null>(pageKey === 'faq' ? 0 : null);
  useEffect(() => {
    let active = true;
    void api<CmsPayload>(`/storefront/cms/${pageKey}`).then((payload) => {
      if (!active) return;
      const data = payload?.data || payload;
      if (data && (data.title || data.description || data.blocks)) setContent({ title: data.title || fallback.title, intro: data.description || fallback.intro, blocks: Array.isArray(data.blocks) && data.blocks.length ? data.blocks : fallback.blocks });
    }).catch(() => undefined);
    return () => { active = false; };
  }, [pageKey, fallback.title, fallback.intro, fallback.blocks]);
  return <main className="contentPage"><div className="contentHero"><span className="eyebrow">PRIYASA · INFORMATION</span><h1>{content.title}</h1><p>{content.intro}</p></div><div className="contentLayout"><aside className="contentNav"><strong>Quick links</strong>{Object.entries(defaults).map(([key, value]) => <a key={key} href={`/${key}`}>{value.title}</a>)}</aside><article className="contentBody">{content.blocks.map((block, index) => <section className={pageKey === 'faq' ? 'faqItem' : 'contentSection'} key={`${block.title}-${index}`}>{pageKey === 'faq' ? <><button className="faqQuestion" onClick={() => setOpen(open === index ? null : index)} aria-expanded={open === index}>{block.title}<span>{open === index ? '−' : '+'}</span></button>{open === index && <div className="faqAnswer">{block.body && <p>{block.body}</p>}{block.items && <ul>{block.items.map(item => <li key={item}>{item}</li>)}</ul>}</div>}</> : <><h2>{block.title}</h2>{block.body && <p>{block.body}</p>}{block.items && <ul>{block.items.map(item => <li key={item}>{item}</li>)}</ul>}</>}</section>)}</article></div></main>;
}
