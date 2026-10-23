export type Category = {
  id: number;
  name: string;
  slug: string;
  image: string;
  createdAt: string;
  updatedAt: string;
};

export type CategoryApiResponse = {
  message: string;
  success: boolean;
  data: Category[];
  timestamp: string;
};

export type SubCategory = {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
  categoryName: string;
  createdAt: string;
  updatedAt: string;
};

export type SubCategoryApiResponse = {
  message: string;
  success: boolean;
  data: SubCategory[];
  timestamp: string;
};
