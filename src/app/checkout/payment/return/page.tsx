import {Suspense} from 'react';
import PaymentReturnContent from './PaymentReturnContent';

function ReturnSkeleton(){
  return <main className="checkoutPage"><section className="emptyState"><span className="eyebrow">PRIYASA / ORDER</span><h1>Confirming your order</h1><p>Checking payment status…</p></section></main>;
}

export default function PaymentReturn(){
  return <Suspense fallback={<ReturnSkeleton />}><PaymentReturnContent /></Suspense>;
}
