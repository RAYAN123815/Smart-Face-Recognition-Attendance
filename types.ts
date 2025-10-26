export interface User {
  id: string;
  name: string;
  images: {
    front: string; // base64
    left: string; // base64
    right: string; // base64
  };
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  name: string;
  day: string; // e.g., "Monday"
  timestamp: string; // ISO string
  status: "Present";
}

export type Tab = "register" | "attend" | "summary" | "admin";

export type Angle = "front" | "left" | "right";