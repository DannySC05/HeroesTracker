export interface HeroImageCandidate {
  id: string;
  name: string;
  fullName: string | null;
  publisher: string | null;
  imageUrl: string;
}

export interface HeroImageProvider {
  search(name: string): Promise<HeroImageCandidate[]>;
}

export interface HeroImageSearchResult {
  candidates: HeroImageCandidate[];
  automaticSelectionId: string | null;
}
