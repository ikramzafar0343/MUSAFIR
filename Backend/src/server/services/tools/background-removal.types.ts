export type BackgroundRemovalInput = {
  readonly buffer: Buffer;
  readonly mimeType: string;
};

export type BackgroundRemovalResult = {
  readonly png: Buffer;
  readonly width: number;
  readonly height: number;
  readonly provider: string;
};

export interface BackgroundRemovalProvider {
  readonly id: string;
  removeBackground(input: BackgroundRemovalInput, signal?: AbortSignal): Promise<BackgroundRemovalResult>;
}
