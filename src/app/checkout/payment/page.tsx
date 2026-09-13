import {Suspense} from 'react';
import PaymentContent from './PaymentContent';

function PaymentSkeleton(){
  return <main className="checkoutPage"><section className="emptyState"><span className="eyebrow">PRIYASA / PAYMENT</span><h1>Preparing payment</h1><p>Loading secure payment…</p></section></main>;
}

export default function PaymentPage(){
  return <Suspense fallback={<PaymentSkeleton />}><PaymentContent /></Suspense>;
}
