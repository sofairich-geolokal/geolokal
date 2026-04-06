import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const { username, password } = await request.json();

  try {
    //Find user in DB (Checking both username and password_hash)
    const user = await prisma.user.findFirst({
      where: { 
        username: username,
        password_hash: password // In real apps, use bcrypt to compare
      }
    });

    // TEMPORARY MOCK FOR TESTING RUKHSAR:
    // if (username === "Rukhsar" && password === "Rukhsar@123") {
    //   return NextResponse.json({ success: true });
    // }

    return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}