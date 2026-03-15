import { Inngest } from "inngest";
import connectDB from "./db";
import User from "@/models/User";
import Order from "@/models/Order";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "quickcart-next" });

// 1. Sync User Creation - (Failure rate fix karne ke liye findByIdAndUpdate use kiya hai)
export const syncUserCreation = inngest.createFunction(
  { id: 'sync-user-from-clerk' },
  { event: 'clerk/user.created' },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data
    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + ' ' + last_name,
      imageUrl: image_url
    }
    await connectDB()
    // .create ki jagah ye use karein taaki duplicate error na aaye
    await User.findByIdAndUpdate(id, userData, { upsert: true })
  }
)

// 2. Sync User Updation - (Same as your code)
export const syncUserUpdation = inngest.createFunction(
  { id: 'update-user-from-clerk' },
  { event: 'clerk/user.updated' },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data
    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + ' ' + last_name,
      imageUrl: image_url
    }
    await connectDB()
    await User.findByIdAndUpdate(id, userData)
  }
)

// 3. Sync User Deletion - (High failure fix karne ke liye check lagaya hai)
export const syncUserDeletion = inngest.createFunction(
  { id: 'delete-user-with-clerk' },
  { event: 'clerk/user.deleted' },
  async ({ event }) => {
    const { id } = event.data
    await connectDB()
    // Pehle check karega user hai ya nahi, phir delete karega taaki fail na ho
    const user = await User.findById(id)
    if (user) {
      await User.findByIdAndDelete(id)
    }
  }
)

// 4. Create User Order - (Same as your code)
export const createUserOrder = inngest.createFunction(
  {
    id: 'create-user-order',
    batchEvents: {
      maxSize: 5,
      timeout: '5s'
    }
  },
  { event: 'order/created' },
  async ({ events }) => {
    const orders = events.map((event) => {
      return {
        userId: event.data.userId,
        items: event.data.items,
        amount: event.data.amount,
        address: event.data.address,
        date: event.data.date
      }
    })

    await connectDB()
    await Order.insertMany(orders)

    return { success: true, processed: orders.length };
  }
)