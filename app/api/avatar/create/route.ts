import { NextRequest, NextResponse } from 'next/server';
import AvatarService from '@/lib/avatar-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { base64Image, gender, bodyType, outfitId, userName } = body;

    if (!base64Image) {
      return NextResponse.json(
        { error: 'base64Image is required' },
        { status: 400 }
      );
    }

    const avatarService = new AvatarService();
    
    const result = await avatarService.createAvatarFromSelfie(
      {
        base64Image,
        gender,
        bodyType: bodyType || 'fullbody',
        outfitId,
      },
      userName
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Avatar creation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create avatar',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}