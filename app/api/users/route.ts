import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username } = body;

        if (!username || typeof username !== 'string' || username.trim() === '') {
            return NextResponse.json({ error: 'Username is required and must be a non-empty string' }, { status: 400 });
        }

        const newUser = await prisma.users.create({
            data: {
                username: username.trim(),
            },
        });

        return NextResponse.json(newUser, { status: 201 });
    } catch (error: any) {
        console.error("Error creating user:", error);

        if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
            return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
        }

        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
