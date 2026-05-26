import NextAuth from "next-auth";
import { shoeAuthOptions } from "@/lib/shoe-auth";

const handler = NextAuth(shoeAuthOptions);
export { handler as GET, handler as POST };
