// src/types/queryTypes.ts
export interface PostQueryInput {
    content: string;
    creatorId: string;
}

export interface AnswerQueryInput {
    queryId: number;
    content: string;
    answerCreatorId: number;
}

export interface PostQueryInput {
    content: string;
    tags: string[]; // Array of tag names
}

