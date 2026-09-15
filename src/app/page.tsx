import DynamicHome from '@/components/DynamicHome';
import { getStorefrontHome } from '@/lib/storefront';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const home = await getStorefrontHome();

  if (!home) {
    return (
      <main className="homeUnavailable">
        <span className="eyebrow">PRIYASA</span>
        <h1>Storefront temporarily unavailable</h1>
        <p>We could not load the live storefront configuration. Please try again shortly.</p>
      </main>
    );
  }

  return <DynamicHome home={home} />;
}
