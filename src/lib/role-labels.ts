/** Role names shared by server and client code (no server imports here). */
export type Role = "student" | "mentor" | "admin";

export const ROLE_LABEL: Record<Role, string> = { student: "Ученик", mentor: "Ментор", admin: "Администратор" };

export const homeFor = (role: Role) => (role === "admin" ? "/admin" : role === "mentor" ? "/mentor" : "/dashboard");
