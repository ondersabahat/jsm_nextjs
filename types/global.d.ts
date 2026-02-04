import { NextResponse } from "next/server";

export type ActionResponse<T = null> = {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: Record<string, string[]>;
  };
  status?: number;
};

export type SuccessResponse<T = null> = ActionResponse<T> & { success: true };
export type ErrorResponse = ActionResponse<undefined> & { success: false };

export type APIErrorResponse = NextResponse<ErrorResponse>;
export type APIResponse<T = null> = NextResponse<SuccessResponse<T> | ErrorResponse>;

declare global {
  interface Tag {
    _id: string;
    name: string;
    questions?: number;
  }

  interface Author {
    _id: string;
    name: string;
    image: string;
  }

  interface Question {
    _id: string;
    title: string;
    content: string;
    tags: Tag[];
    author: Author;
    createdAt: Date;
    upvotes: number;
    downvotes: number;
    answers: number;
    views: number;
  }

  interface RouteParams {
    params: Promise<Record<string, string>>;
    searchParams: Promise<Record<string, string>>;
  }

  interface PaginatedSearchParams {
    page?: number;
    pageSize?: number;
    query?: string;
    filter?: string;
    sort?: string;
  }

  interface Answer {
    _id: string;
    content: string;
    author: Author;
    createdAt: Date;
    upvotes: number;
    downvotes: number;
    question: string;
  }

  interface Collection {
    _id: string;
    author: string | User;
    question: Question;
  }

  interface User {
    _id: string;
    name: string;
    username: string;
    email: string;
    bio?: string;
    image?: string;
    location?: string;
    portfolio?: string;
    reputation?: number;
    createdAt: Date;
  }

  interface Badges {
    GOLD: number;
    SILVER: number;
    BRONZE: number;
  }

  interface Job {
    id?: string;
    employer_name?: string;
    employer_logo?: string | undefined;
    employer_website?: string;
    job_employment_type?: string;
    job_title?: string;
    job_description?: string;
    job_apply_link?: string;
    job_city?: string;
    job_state?: string;
    job_country?: string;
  }

  interface Country {
    name: {
      common: string;
    };
  }

  interface GlobalSearchedItem {
    id: string;
    type: "question" | "answer" | "user" | "tag";
    title: string;
  }
}
