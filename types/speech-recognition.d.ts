// Type declarations for Web Speech API and Three.js integration
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    webkitAudioContext: typeof AudioContext;
  }
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
  readonly resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars?: any;
  interimResults: boolean;
  lang: string;
  maxAlternatives?: number;
  onaudioend?: (event: Event) => void;
  onaudiostart?: (event: Event) => void;
  onend?: (event: Event) => void;
  onerror?: (event: SpeechRecognitionErrorEvent) => void;
  onnomatch?: (event: Event) => void;
  onresult?: (event: SpeechRecognitionEvent) => void;
  onsoundend?: (event: Event) => void;
  onsoundstart?: (event: Event) => void;
  onspeechend?: (event: Event) => void;
  onspeechstart?: (event: Event) => void;
  onstart?: (event: Event) => void;
  abort(): void;
  start(): void;
  stop(): void;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

export {};
