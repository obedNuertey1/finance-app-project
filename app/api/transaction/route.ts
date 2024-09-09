import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

/**
 * This is another one of the POST request routes used for sending money from one user account to another.
 * It can check to see whether an account exists and is valid and tell if a user has enough balance in their account to send.
 * Error handling is set up to check for different scenarious.
 */

const prisma = new PrismaClient();

function getUserIdFromToken(token: string) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
    };
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  const userId = getUserIdFromToken(token);
  if (!userId) {
    return NextResponse.json(
      {
        error: "Invalid token",
      },
      { status: 401 }
    );
  }

  const { recipientAccount, amount } = await req.json();

  const sender = await prisma.user.findUnique({
    where: { id: userId },
  });
  const recipient = await prisma.user.findUnique({
    where: { accountNumber: recipientAccount },
  });

  if (!sender || !recipient) {
    return NextResponse.json({ error: "Account not found" });
  }

  if (sender.balance < amount) {
    return NextResponse.json(
      {
        error: "Insufficient balance",
      },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: sender.id },
    data: { balance: { decrement: amount } },
  });

  await prisma.user.update({
    where: { id: recipient.id },
    data: { balance: { increment: amount } },
  });

  return NextResponse.json({ message: "Transaction successfull" });
}
