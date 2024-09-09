import {NextRequest, NextResponse} from 'next/server';
import jwt from 'jsonwebtoken';

/**
 * This route generates JWT tokens for different users and is dependent on their user ID.
 * It is done automatically when we create a user and sign in.
 * Its purpose in this file is to use Curl commands to add money to a user's bank account.
 */

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(request: NextRequest){
    console.log("process.env.ARCJET_KEY!=",process.env.ARCJET_KEY!)
    try{
        const {userId} = await request.json();

        if(typeof userId !== 'number'){
            return NextResponse.json({error: 'Invalid userId'}, {status: 400});
        }

        const token = jwt.sign({userId}, JWT_SECRET, {expiresIn: '1h'}); // Token expires in 1 hour
        return NextResponse.json({token}, {status: 200})
    }catch(error){
        return NextResponse.json({error: 'An error occurred'}, {status: 500});
    }
}