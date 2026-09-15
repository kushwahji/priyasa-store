export type HomeSection = {
  id: number | string;
  key: string;
  type: string;
  sort_order?: number;
  is_active?: boolean;
  title?: string | null;
  subtitle?: string | null;
  content?: Record<string, any>;
};

export type StorefrontHome = {
  schema_version: string;
  version: number;
  page: { key: string; type: string };
  store: Record<string, any>;
  theme: {
    key: string;
    name?: string;
    type?: string;
    version?: number;
    tokens?: Record<string, any>;
    assets?: Record<string, any>;
    decorations?: Record<string, any>;
    features?: Record<string, boolean>;
  };
  announcement?: Record<string, any>;
  header?: Record<string, any>;
  navigation?: { items?: Array<Record<string, any>> };
  collections?: Record<string, any>;
  sections: HomeSection[];
  footer?: Record<string, any>;
  tracking?: Record<string, any>;
};

const BASE = (process.env.PRIYASA_API_BASE_URL || '').replace(/\/$/, '');

export async function getStorefrontHome(): Promise<StorefrontHome | null> {
  if (!BASE) return null;
  try {
    const response = await fetch(`${BASE}/storefront/home`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60, tags: ['storefront-home'] },
    });
    if (!response.ok) return null;
    const body = await response.json();
    return body?.success ? body.data : null;
  } catch {
    return null;
  }
}
