export type NetworkId = "devnet" | "mainnet";

export interface XPost {
  postId: string;
  username: string;
  authorId: string;
  impressions: number;
  likes: number;
  retweets: number;
  replies: number;
  createdAt: string;
  text: string;
  url: string;
}

export interface LeaderboardEntry {
  postId: string;
  username: string;
  impressions: number;
  createdAt: string;
  url: string;
  text: string;
  wallet: string;
  excluded: boolean;
}

export type TokenKind = "spl" | "sol";

export interface Recipient {
  id: string;
  username: string;
  wallet: string;
  amount: string;
}

export type TxPhase = "idle" | "pending" | "sent" | "confirmed" | "failed";

export interface AirdropResult {
  recipientId: string;
  username: string;
  wallet: string;
  phase: TxPhase;
  signature?: string;
  error?: string;
}
