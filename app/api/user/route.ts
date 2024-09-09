import {NextRequest, NextResponse} from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

/**
 * The code in this file is used to find users inside our database.
 * It also lets us know if a user is authorized and has a valid or invalid token for signing in.
 */

const prisma = new PrismaClient();

function getUserIdFromToken(token: string){
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
            userId: number;
        }
        return decoded.userId;
    }catch(error){
        return null;
    }
}

export async function GET(req: Request){
    console.log("process.env.ARCJET_KEY!=",process.env.ARCJET_KEY!)
    const authHeader = req.headers.get('Authorization');
    if(!authHeader || !authHeader.startsWith('Bearer ')){
        return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const token = authHeader.split(' ')[1];
    const userId = getUserIdFromToken(token);

    if(!userId){
        return NextResponse.json({error: 'Invalid token'}, {status: 401});
    }

    const user = await prisma.user.findUnique({
        where: {id: userId},
        select: {
            name: true,
            email: true,
            accountNumber: true,
            balance: true
        },
    })

    if(!user){
        return NextResponse.json({error: 'User not found'}, {status: 404});
    }

    return NextResponse.json(user);
}