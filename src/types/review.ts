export type ReviewRequest = {
  title: string;
  ratings: number;
  comment: string;
};

export type Review = {
  id: number;
  title: string | null;
  ratings: number;
  comment: string | null;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    profileImage: string | null;
  };
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    imageUrl: string | null;
    totalSold?: number;
  };
  createdAt: string;
  updatedAt: string;
};

export type ReviewPage = {
  content: Review[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
};
