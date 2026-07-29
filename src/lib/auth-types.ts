export type AppRole =
  | "ADMIN"
  | "USER"
  | "AGENT"
  | "SUPERVISOR"
  | "EXECUTIVE";

export interface AppSession {
  user: {
    id: string;
    name: string;
    email: string;
    role: AppRole;
    department: string | null;
  };
  source: "development" | "sinergy";
}
