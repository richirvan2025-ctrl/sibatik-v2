export type AppRole =
  | "ADMIN"
  | "USER"
  | "AGENT"
  | "SUPERVISOR"
  | "EXECUTIVE"
  | "MAHASISWA";

export interface AppSession {
  user: {
    id: string;
    name: string;
    email: string | null;
    role: AppRole;
    department: string | null;
  };
  source: "development" | "sinergy";
}
