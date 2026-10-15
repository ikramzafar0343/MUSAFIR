export type ProductImage = {
  readonly url: string;
  readonly alt: string;
  readonly order: number;
};

export type ProductColor = {
  readonly name: string;
  readonly hex: string;
};

export type ProductRecord = {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly sku: string;
  readonly category: string;
  readonly categories: readonly string[];
  readonly price: number;
  readonly originalPrice: number | null;
  readonly discount: number;
  readonly discountType: string;
  readonly description: {
    readonly intro: string;
    readonly detail: string;
    readonly highlights: string[];
  };
  readonly specifications: {
    readonly composition: string;
    readonly care: string;
    readonly includes: string;
  };
  readonly returnPolicy: string;
  readonly sizes: string[];
  readonly tileColor: string | null;
  readonly colors: readonly ProductColor[];
  readonly images: readonly ProductImage[];
  readonly variants: readonly unknown[];
  readonly bestSeller: boolean;
  readonly stock: number;
  readonly lowStockThreshold: number;
  readonly rating: number;
  readonly reviewCount: number;
  readonly status: string;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly effectivePrice: number;
};

export type SerializedProduct = ProductRecord & {
  readonly _id: string;
};
