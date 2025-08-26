/**
 * Ready Player Me Avatar Creation Service
 * Implements the complete workflow for creating 3D avatars from selfies
 */

export interface AvatarCreationRequest {
  base64Image: string;
  gender?: 'male' | 'female';
  bodyType?: 'halfbody' | 'fullbody';
  outfitId?: string;
}

export interface RPMUser {
  id: string;
  name?: string;
}

export interface AvatarDraft {
  id: string;
  userId: string;
  partner: string;
  bodyType: string;
  gender?: string;
  modelUrl?: string;
}

export interface AvatarCreationResponse {
  data: {
    id: string;
    userId: string;
    partner: string;
    bodyType: string;
    gender: string;
    modelUrl: string;
  };
}

class AvatarService {
  private readonly apiKey: string;
  private readonly subdomain: string;
  private readonly baseUrl = 'https://api.readyplayer.me/v2';

  constructor() {
    this.apiKey = process.env.RPM_API_KEY!;
    this.subdomain = process.env.NEXT_PUBLIC_RPM_SUBDOMAIN!;
    
    if (!this.apiKey) {
      throw new Error('RPM_API_KEY is required');
    }
    if (!this.subdomain) {
      throw new Error('NEXT_PUBLIC_RPM_SUBDOMAIN is required');
    }
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-API-KEY': this.apiKey,
    };
  }

  /**
   * Step 1: Create a guest user
   */
  async createGuestUser(name?: string): Promise<RPMUser> {
    const response = await fetch(`${this.baseUrl}/users`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        data: {
          name: name || 'Guest User',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create guest user: ${error}`);
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Step 2: Create avatar draft with selfie
   */
  async createAvatarDraft(
    userId: string,
    request: AvatarCreationRequest
  ): Promise<AvatarDraft> {
    const payload = {
      data: {
        userId,
        partner: this.subdomain,
        bodyType: request.bodyType || 'fullbody',
        base64Image: request.base64Image,
        ...(request.gender && { gender: request.gender }),
        ...(request.outfitId && {
          assets: {
            outfit: request.outfitId,
          },
        }),
      },
    };

    const response = await fetch(`${this.baseUrl}/avatars`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create avatar draft: ${error}`);
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Step 3: Save avatar draft to make it permanent
   */
  async saveAvatarDraft(avatarId: string): Promise<AvatarDraft> {
    const response = await fetch(`${this.baseUrl}/avatars/${avatarId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to save avatar draft: ${error}`);
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Step 4: Get the 3D model URL
   */
  getModelUrl(avatarId: string): string {
    return `https://models.readyplayer.me/${avatarId}.glb`;
  }

  /**
   * Complete workflow: Create avatar from selfie
   */
  async createAvatarFromSelfie(
    request: AvatarCreationRequest,
    userName?: string
  ): Promise<{
    user: RPMUser;
    avatar: AvatarDraft;
    modelUrl: string;
  }> {
    try {
      // Step 1: Create guest user
      console.log('Creating guest user...');
      const user = await this.createGuestUser(userName);
      
      // Step 2: Create avatar draft
      console.log('Creating avatar draft...');
      const draft = await this.createAvatarDraft(user.id, request);
      
      // Step 3: Save avatar draft
      console.log('Saving avatar draft...');
      const avatar = await this.saveAvatarDraft(draft.id);
      
      // Step 4: Get model URL
      const modelUrl = this.getModelUrl(avatar.id);
      
      return {
        user,
        avatar,
        modelUrl,
      };
    } catch (error) {
      console.error('Avatar creation failed:', error);
      throw error;
    }
  }

  /**
   * Utility: Convert file to base64
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  }

  /**
   * Utility: Convert image URL to base64
   */
  static async imageUrlToBase64(imageUrl: string): Promise<string> {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  }
}

export default AvatarService;