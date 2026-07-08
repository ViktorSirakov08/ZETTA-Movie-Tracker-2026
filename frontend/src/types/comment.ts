export interface CommentUser {
  id: string;
  username: string;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  user?: CommentUser;
  mediaId: string;
  createdAt: string;
}
