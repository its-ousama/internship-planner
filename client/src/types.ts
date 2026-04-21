export type Priority = "high" | "medium" | "low";
export type Status = "pending" | "scratched";

export interface Task {
  id: number;
  title: string;
  date: string;
  status: Status;
  priority: Priority;
  color: string;
  created_at: string;
}

export interface Concept {
  term: string;
  def: string;
}

export interface TopicConnect {
  id: string;
  why: string;
}

export interface Topic {
  id: number;
  slug: string;
  name: string;
  abbr: string;
  icon: string;
  color: string;
  category: string;
  description: string;
  analogy?: string;
  concepts: Concept[];
  connects: TopicConnect[];
}