export interface DealProduct {
  id: number;
  oemName: string;
  productName: string;
  skuName: string;
  licenseCount: number | '';
  planType: string;
  planDuration: number | '';
  pr_skuprice: number;
  pr_shivaamiprice: number;
  shivaamisubtotal: number;
  skuDiscount?: number | '';
}