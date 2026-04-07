import User from "@/models/User";
import { currentUser } from "@clerk/nextjs/server"; // getAuth ki jagah currentUser behtar hai data ke liye
import connectDB from "@/config/db";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        // 1. Clerk se complete user data lein (sirf ID nahi)
        const clerkUser = await currentUser();

        if (!clerkUser) {
            return NextResponse.json({ success: false, message: 'Not Authorized' });
        }

        await connectDB();

        // 2. Database mein check karein
        let user = await User.findById(clerkUser.id);

        // 3. Agar user DB mein nahi hai, toh usey create karein (Required fields ke sath)
        if (!user) {
            user = await User.create({
                _id: clerkUser.id,
                name: `${clerkUser.firstName} ${clerkUser.lastName}`,
                email: clerkUser.emailAddresses[0].emailAddress,
                imageUrl: clerkUser.imageUrl,
                cartItems: {}
            });
            console.log("New user synced to MongoDB");
        }

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error("Sync Error:", error.message);
        return NextResponse.json({ success: false, message: error.message });
    }
}