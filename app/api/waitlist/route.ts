import { NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/providers/database/pool";

const WaitlistSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  email: z.string().email("Please enter a valid email address").max(255, "Email is too long"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = WaitlistSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 },
      );
    }

    const { name, email } = result.data;

    await pool.query(
      `INSERT INTO waitlist (name, email) VALUES ($1, $2)`,
      [name, email.toLowerCase()],
    );

    return NextResponse.json(
      { message: "You've been added to the waitlist!" },
      { status: 201 },
    );
  } catch (error: any) {
    // Postgres unique constraint violation
    if (error?.code === "23505") {
      return NextResponse.json(
        { message: "You're already on the waitlist!" },
        { status: 409 },
      );
    }

    console.error("Waitlist signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
