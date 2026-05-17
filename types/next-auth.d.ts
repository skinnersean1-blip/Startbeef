import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    username: string;
    handle: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      username: string;
      handle: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    handle: string | null;
  }
}
