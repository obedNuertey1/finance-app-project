import arcjet, {protectSignup} from '@arcjet/next';
import {NextResponse, NextRequest} from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * This route has the logic for letting users sign up for an account on the platform.
 * It also has ArcJet protection for blocking bots and invalid emails. Like before, there is rate limiting, too, as well as various error handling to cater to different use cases.
 */

const prisma = new PrismaClient();

// Initialize ArcJet with the protectSignup rule
const aj = arcjet({
    key: process.env.ARCJET_KEY!,
    rules: [
        protectSignup({
            email: {
                mode: 'LIVE',
                block: ['DISPOSABLE', 'INVALID', 'NO_MX_RECORDS'],
            },
            bots: {
                mode: 'LIVE', // Actively block invalid, disposable, or no MX record emails
                // @ts-ignore
                block: ['AUTOMATED']
            },
            rateLimit: {
                mode: 'LIVE', // Actively enforce rate limits
                interval: '2m', // Sliding window of 2 minutes
                max: 5, // Maximum 5 submissions in the interval
            }
        })
    ]
});

export async function POST(req: NextRequest){
    console.log("process.env.ARCJET_KEY!=",process.env.ARCJET_KEY!)
    // Parse: the request body
    const {name, email, password} = await req.json();

    // Apply Arcjet protection to the signup route
    const decision = await aj.protect(req, {email});

    if(decision.isDenied()){
        if(decision.reason.isEmail()){
            let message: string;
            if(decision.reason.emailTypes.includes('INVALID')){
                message = 'Email address format is invalid. Is there a typo?';
            }else if(decision.reason.emailTypes.includes('DISPOSABLE')){
                message = 'We do not allow disposable email addresses.';
            }else if(decision.reason.emailTypes.includes('NO_MX_RECORDS')){
                message = "Your email domain does not have an MX record. Is there a typo";
            }else{
                message = 'Invalid email address';
            }
            return NextResponse.json({message,reason: decision.reason}, {status: 400});
        }
    }else if( decision.reason.isRateLimit()){
        const reset = decision.reason.resetTime;

        if(reset === undefined){
            return NextResponse.json(
                {
                    message: "Too many requests. Please try again later.",
                reason: decision.reason,
                },
                {status: 429}
            );
        }
    }else{
        return NextResponse.json({message: 'Forbidden'}, {status: 403})
    }

    // Process with signup logic
    const hashedPassword = bcrypt.hashSync(password, 10);

    try{
        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                accountNumber: `ACC${Math.floor(Math.random() * 1000000)}`
            },
        });
        return NextResponse.json({message: 'User created successfully!'});
    }catch(error){
        return NextResponse.json({
            error: 'User already exists'
        }, {status: 400});
    }
}