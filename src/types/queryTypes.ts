// src/types/queryTypes.ts
export interface PostQueryInput {
    content: string;
}

export interface AnswerQueryInput {
    queryId: number;
    content: string;
}

export interface PostQueryInput {
    content: string;
    tags: string[]; // Array of tag names
}

