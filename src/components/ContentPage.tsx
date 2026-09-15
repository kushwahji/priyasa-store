'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

type Block = { title?: string; body?: string; items?: string[] };
type CmsPayload = {
  data?: { title?: string; description?: string; blocks?: Block[]; sections?: Block[] };
  title?: string;
  description?: string;
  blocks?: Block[];
  sections?: Block[];
};

type PageDefinition = { title: string; intro: string; blocks: Block[] };

const pages: Record<string, PageDefinition> = {
  about: {
    title: 'About PRIYASA',
    intro: 'Fashion that inspires confidence — timeless ethnic and contemporary western styles designed for the modern Indian woman.',
    blocks: [
      { title: 'Welcome to PRIYASA', body: 'Founded in 2025, PRIYASA is an Indian fashion label created to make elegant, comfortable and affordable clothing accessible to every woman.' },
      { title: 'Inspired by tradition. Designed for today.', body: 'Our collections bring together ethnic elegance and contemporary western fashion for work, celebrations, casual outings and everyday life. We focus on wearable silhouettes, carefully selected fabrics and details that feel as good as they look.' },
      { title: 'Our vision', body: 'To become one of India’s most loved fashion brands by combining quality, comfort, modern design and accessible pricing.' },
      { title: 'Our mission', body: 'To help women express their individuality with confidence through thoughtfully designed fashion that works across occasions.' },
      { title: 'Why women choose PRIYASA', items: ['Premium-quality fabrics and careful finishing', 'Fashion-forward styles at accessible prices', 'Reliable delivery across India', 'A simple 7-day return experience for eligible products', 'Secure shopping, checkout and customer support'] },
      { title: 'Our promise', body: 'Every collection is created with attention to quality and comfort. We want every PRIYASA purchase to feel clear, dependable and worth coming back for.' },
      { title: 'Business information', items: ['Brand: PRIYASA', 'Founded: 2025', 'Business type: Online apparel retail', 'Website: priyasa.com', 'Service area: India'] },
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    intro: 'These terms explain the rules for using PRIYASA, placing orders and accessing our services.',
    blocks: [
      { title: '1. Introduction', body: 'By accessing PRIYASA or using our services, you agree to these Terms & Conditions, our Privacy Policy and other policies published on the website.' },
      { title: '2. Eligibility and account information', body: 'You must be legally able to enter an agreement and provide accurate information. Keep your account and authentication information secure and notify us if you believe your account has been compromised.' },
      { title: '3. Product information', body: 'We work to keep product descriptions, sizes, colours, images and availability accurate. Display differences can cause colours to appear slightly different from the physical product.' },
      { title: '4. Pricing and offers', body: 'Prices, discounts, promotions and availability may change. The applicable price and charges shown at checkout are the basis for an order placed through the storefront.' },
      { title: '5. Orders and payment', body: 'Orders are subject to product availability, payment authorization and applicable security checks. PRIYASA may cancel an order where there is a stock issue, pricing or technical error, suspected misuse or another legitimate operational reason.' },
      { title: '6. Shipping and delivery', body: 'Delivery estimates depend on destination, inventory, carrier and service conditions. Customers are responsible for providing an accurate delivery address and contact details.' },
      { title: '7. Returns and refunds', body: 'Eligible products can be returned within the applicable return window and condition requirements. Refunds are processed after the return is received and approved through the applicable payment workflow.' },
      { title: '8. Cancellation', body: 'Where cancellation is supported, an order may be cancelled before dispatch. After dispatch, the applicable return process may be required.' },
      { title: '9. Privacy', body: 'Personal information is handled according to the PRIYASA Privacy Policy. Payment credentials are processed through authorized payment providers and should never be shared with support staff.' },
      { title: '10. Intellectual property', body: 'PRIYASA branding, content, product imagery, graphics, software and other materials are protected by applicable intellectual-property laws. Unauthorised commercial use is prohibited.' },
      { title: '11. User conduct', items: ['Use the service only for lawful purposes', 'Do not attempt unauthorised access or interfere with service security', 'Do not submit misleading, harmful or abusive content', 'Do not misuse promotions, accounts or payment systems'] },
      { title: '12. Limitation of liability', body: 'To the extent permitted by law, PRIYASA is not responsible for indirect or consequential losses arising from circumstances outside reasonable operational control, including third-party logistics disruption or force majeure events.' },
      { title: '13. Changes to these terms', body: 'We may update these terms when our services, legal obligations or operating practices change. The updated version will be published on the website.' },
      { title: '14. Governing law', body: 'These terms are governed by the applicable laws of India. Disputes are subject to the jurisdiction of the appropriate Indian courts.' },
      { title: '15. Contact', body: 'For questions about these terms, contact PRIYASA support at support@priyasa.com.' },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'We respect your trust and explain below what information PRIYASA may use, why we use it and what choices you have.',
    blocks: [
      { title: 'Information we collect', items: ['Name and contact details', 'Shipping and billing address', 'Account, order and return information', 'Payment status and transaction references processed through payment providers', 'Device, browser, IP and service-interaction information used for security and analytics'] },
      { title: 'How we use information', items: ['Create and secure your account', 'Process orders, payments, delivery and returns', 'Provide order and service communications', 'Provide customer support', 'Improve performance, reliability and shopping experience', 'Send optional promotional communications when you have opted in'] },
      { title: 'Payments and security', body: 'Payment-sensitive information is handled through authorized payment providers. We use controlled service boundaries and security measures appropriate to the information processed. Never share OTPs, passwords or full payment credentials with anyone.' },
      { title: 'Notifications and marketing', body: 'Browser or app notifications require the relevant permission. Promotional communications are optional and should respect your communication preferences. You can withdraw promotional consent through the available preference or unsubscribe mechanism.' },
      { title: 'Sharing and service providers', body: 'Information may be processed by service providers that help us operate payments, delivery, communications, analytics, security and customer support. We do not sell personal information to advertisers.' },
      { title: 'Your choices and rights', body: 'You may request help with accessing or updating your information, account deletion or privacy-related questions by contacting support. Some information may need to be retained where required for legal, accounting, security or transaction purposes.' },
      { title: 'Policy updates', body: 'We may update this policy as our services, technology or legal requirements change. The latest version will be published here.' },
    ],
  },
  returns: {
    title: 'Return & Refund Policy',
    intro: 'A clear return process for eligible PRIYASA purchases, with the applicable rules shown against the product or order.',
    blocks: [
      { title: '1. Return window', body: 'PRIYASA currently provides a 7-day return window for eligible products from the delivery date. Product-specific exclusions or conditions may apply and are shown where applicable.' },
      { title: '2. Eligibility', items: ['The item must correspond to the order', 'The product should be unused and in its original condition', 'Original tags, packaging and accessories should be retained where applicable', 'Hygiene-sensitive, final-sale or otherwise excluded products may not be returnable'] },
      { title: '3. How to start a return', body: 'Open the relevant order from your account and use the available return/support option. Provide the order details and reason requested so the case can be reviewed and tracked.' },
      { title: '4. Damaged, defective or incorrect items', body: 'Report a damaged, defective, missing or incorrect item as soon as possible, ideally with clear photographs. We will review the case and provide the applicable resolution instructions.' },
      { title: '5. Refunds', body: 'Approved refunds are processed through the applicable payment or refund workflow. The time for the amount to appear can vary by payment method and financial institution.' },
      { title: '6. Exchanges', body: 'Where an exchange is supported for the product, size or colour, the available option will be shown during the return workflow. Availability is subject to stock.' },
      { title: '7. Return shipping', body: 'Return shipping treatment depends on the reason for return and the applicable order policy. Any applicable charges or deductions will be communicated during the return process.' },
      { title: '8. Policy updates', body: 'PRIYASA may update this policy from time to time. The version published on this page applies to the relevant purchase, subject to applicable law.' },
    ],
  },
  shipping: {
    title: 'Shipping & Delivery',
    intro: 'Reliable delivery across India with shipping availability and charges calculated from the destination, cart and current shipping rules.',
    blocks: [
      { title: 'Delivery estimates', body: 'Where available, checkout provides an estimated delivery date. Actual delivery can vary with destination, inventory, carrier capacity, weather and other service conditions.' },
      { title: 'Shipping charges', body: 'Applicable shipping charges and free-shipping thresholds are displayed during shopping or checkout before an order is confirmed.' },
      { title: 'Delivery address', body: 'Please verify your name, phone number, PIN code and complete address before placing an order. Changes after dispatch may not be possible.' },
      { title: 'Order tracking', body: 'When tracking is available, sign in and open My Orders to view the latest shipment information.' },
      { title: 'Delivery exceptions', body: 'A carrier may contact you when additional information is needed. Failed delivery attempts, incorrect addresses or restricted service areas can extend delivery time.' },
      { title: 'Customer support', body: 'If a shipment is delayed beyond the expected window, use the order support flow or contact support@priyasa.com with your order number.' },
    ],
  },
  contact: {
    title: 'Contact PRIYASA',
    intro: 'Need help with an order, account, payment, delivery or return? Use the secure order flow first, or contact our support team.',
    blocks: [
      { title: 'Order support', body: 'Sign in and open My Orders to view order details, delivery tracking, cancellation and eligible return options.' },
      { title: 'Account support', body: 'For sign-in or profile issues, use the secure OTP login flow and then open Account.' },
      { title: 'Customer support', items: ['Email: support@priyasa.com', 'Phone: +91 7987610989', 'Address: KM34 JP Noida, GB Nagar 201304, Uttar Pradesh, India'] },
      { title: 'When contacting us', body: 'Include your order number when your request concerns an existing order. Never send an OTP, password, CVV, PIN or complete card/bank credentials.' },
      { title: 'Support links', items: ['Orders and tracking', 'Returns & refunds', 'Shipping & delivery', 'Frequently asked questions'] },
    ],
  },
  faq: {
    title: 'Frequently Asked Questions',
    intro: 'Quick answers for common PRIYASA shopping, account, payment, delivery and return questions.',
    blocks: [
      { title: 'How do I sign in?', body: 'Use your mobile number and the OTP sent by PRIYASA. The storefront keeps the authenticated session in a secure server-side cookie.' },
      { title: 'How can I find a product?', body: 'Use Search, Shop or the category navigation. Product discovery can be filtered by category, price, availability and other supported attributes.' },
      { title: 'How can I track my order?', body: 'Open Account → Orders and select the relevant order. Tracking information appears when it has been provided by the delivery workflow.' },
      { title: 'Can I cancel an order?', body: 'Cancellation is available only while the order is in a cancellable state. Once dispatched, the applicable return process may be required.' },
      { title: 'Can I return an item?', body: 'Eligible purchases can generally be returned within the applicable 7-day window. Check the order/product return option for the exact eligibility.' },
      { title: 'How are refunds processed?', body: 'Approved refunds are sent through the applicable payment/refund workflow. Bank or card processing time can vary.' },
      { title: 'How do I receive shopping notifications?', body: 'On the home page, use the PRIYASA notification permission card. You can allow browser notifications and choose the shopping reminder categories presented there.' },
      { title: 'How do I stop notifications?', body: 'You can disable browser notification permission in your browser settings. PRIYASA also respects the notification preferences supported by the registered shopping device.' },
      { title: 'How do I contact support?', body: 'Email support@priyasa.com or use the Contact page. For order-related questions, include the order number but never include OTPs or payment credentials.' },
    ],
  },
};

const quickLinks = [
  ['About PRIYASA', '/about'],
  ['Contact us', '/contact'],
  ['FAQs', '/faq'],
  ['Shipping & delivery', '/shipping'],
  ['Return & refund policy', '/return-policy'],
  ['Terms & conditions', '/terms'],
  ['Privacy policy', '/privacy'],
] as const;

export default function ContentPage({ pageKey }: { pageKey: keyof typeof pages }) {
  const fallback = pages[pageKey];
  const [content, setContent] = useState<PageDefinition>(fallback);
  const [open, setOpen] = useState<number | null>(pageKey === 'faq' ? 0 : null);

  const fallbackSignature = useMemo(() => JSON.stringify(fallback), [fallback]);

  useEffect(() => {
    let active = true;
    setContent(fallback);
    setOpen(pageKey === 'faq' ? 0 : null);
    void api<CmsPayload>(`/storefront/cms/${pageKey}`).then((payload) => {
      if (!active) return;
      const data = payload?.data || payload;
      const blocks = Array.isArray(data?.blocks) && data.blocks.length ? data.blocks : data?.sections;
      if (data && (data.title || data.description || blocks?.length)) {
        setContent({
          title: data.title || fallback.title,
          intro: data.description || fallback.intro,
          blocks: Array.isArray(blocks) && blocks.length ? blocks : fallback.blocks,
        });
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, [pageKey, fallbackSignature]);

  return (
    <main className="contentPage">
      <div className="contentBreadcrumb"><Link href="/">Home</Link><span>›</span><span>{content.title}</span></div>
      <header className="contentHero">
        <span className="eyebrow">PRIYASA · {pageKey === 'faq' ? 'HELP CENTRE' : 'INFORMATION'}</span>
        <h1>{content.title}</h1>
        <p>{content.intro}</p>
      </header>
      <div className="contentLayout">
        <aside className="contentNav" aria-label="Information navigation">
          <strong>QUICK LINKS</strong>
          {quickLinks.map(([label, href]) => <Link className={href === `/${pageKey}` || (pageKey === 'returns' && href === '/return-policy') ? 'active' : ''} key={href} href={href}>{label}<span>›</span></Link>)}
        </aside>
        <article className="contentBody">
          {content.blocks.map((block, index) => (
            pageKey === 'faq' ? (
              <section className="faqItem" key={`${block.title}-${index}`}>
                <button className="faqQuestion" onClick={() => setOpen(open === index ? null : index)} aria-expanded={open === index}>
                  <span>{block.title || `Question ${index + 1}`}</span><b>{open === index ? '−' : '+'}</b>
                </button>
                {open === index && <div className="faqAnswer">{block.body && <p>{block.body}</p>}{block.items && <ul>{block.items.map(item => <li key={item}>{item}</li>)}</ul>}</div>}
              </section>
            ) : (
              <section className="contentSection" key={`${block.title}-${index}`}>
                <div className="contentSectionIndex">{String(index + 1).padStart(2, '0')}</div>
                <div><h2>{block.title || `Information ${index + 1}`}</h2>{block.body && <p>{block.body}</p>}{block.items && <ul>{block.items.map(item => <li key={item}>{item}</li>)}</ul>}</div>
              </section>
            )
          ))}
          <div className="contentSupportCard"><strong>Need more help?</strong><p>Our support team can help with an order, delivery, return or account question.</p><div><Link href="/contact">Contact PRIYASA</Link><Link href="/faq">View FAQs</Link></div></div>
        </article>
      </div>
    </main>
  );
}
