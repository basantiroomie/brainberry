// Type definitions for Puter.js
declare global {
  interface Window {
    puter: {
      ai: {
        txt2speech: (text: string, options?: {
          voice?: string;
          rate?: number;
          pitch?: number;
          volume?: number;
        }) => Promise<{
          audioUrl: string;
          text: string;
        }>;
      };
    };
  }
}

export interface PuterTTSResponse {
  audioUrl: string;
  text: string;
}

export interface PuterTTSOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export {};
