// frontend/src/app/api/user/favorites/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Inizializza Prisma Client una sola volta
let prisma: PrismaClient;
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // @ts-ignore
  if (!global.prisma) {
    // @ts-ignore
    global.prisma = new PrismaClient();
  }
  // @ts-ignore
  prisma = global.prisma;
}

// GET: Fetch user's favorite investment tips
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const favorites = await prisma.userFavorite.findMany({
      where: { userId: session.user.id },
      include: {
        investmentTip: true, // Include details of the favorited investment tip
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(favorites.map(fav => fav.investmentTip), { status: 200 });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ message: 'Error fetching favorites' }, { status: 500 });
  }
}

// POST: Add an investment tip to user's favorites
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { investmentTipId } = await req.json();

    if (!investmentTipId) {
      return NextResponse.json({ message: 'InvestmentTip ID is required' }, { status: 400 });
    }

    // Check if the tip exists
    const tipExists = await prisma.investmentTip.findUnique({
      where: { id: investmentTipId },
    });

    if (!tipExists) {
      return NextResponse.json({ message: 'InvestmentTip not found' }, { status: 404 });
    }

    // Check if already favorited
    const existingFavorite = await prisma.userFavorite.findUnique({
      where: {
        userId_investmentTipId: {
          userId: session.user.id,
          investmentTipId: investmentTipId,
        },
      },
    });

    if (existingFavorite) {
      return NextResponse.json({ message: 'Already favorited' }, { status: 409 }); // 409 Conflict
    }

    const newFavorite = await prisma.userFavorite.create({
      data: {
        userId: session.user.id,
        investmentTipId: investmentTipId,
      },
      include: {
        investmentTip: true,
      }
    });

    return NextResponse.json(newFavorite.investmentTip, { status: 201 });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json({ message: 'Error adding favorite' }, { status: 500 });
  }
}

// DELETE: Remove an investment tip from user's favorites
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { investmentTipId } = await req.json();

    if (!investmentTipId) {
      return NextResponse.json({ message: 'InvestmentTip ID is required' }, { status: 400 });
    }

    await prisma.userFavorite.delete({
      where: {
        userId_investmentTipId: {
          userId: session.user.id,
          investmentTipId: investmentTipId,
        },
      },
    });

    return NextResponse.json({ message: 'Favorite removed successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error removing favorite:', error);
    if (error.code === 'P2025') { // Prisma error code for record not found
        return NextResponse.json({ message: 'Favorite not found or already removed' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Error removing favorite' }, { status: 500 });
  }
}