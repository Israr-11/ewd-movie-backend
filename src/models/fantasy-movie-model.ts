export interface CastMember {
    Name: string;
    Role: string;
    Description: string;
}

export interface FantasyMovie {
    Id: number;
    UserId: string;
    Title: string;
    Overview: string;
    Genres: string[];
    ReleaseDate: string;
    Runtime: number;
    ProductionCompanies: string[];
    PosterUrl: string;
    Cast: CastMember[];
    CreatedDate: string;
}
