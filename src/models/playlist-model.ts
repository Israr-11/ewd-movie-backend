export interface PlaylistMovie {
    MovieId: number;
    AddedDate: string;
    Order: number;
}

export interface Playlist {
    Id: number;
    UserId: string;
    Title: string;
    Description: string;
    Movies: PlaylistMovie[];
    CreatedDate: string;
    UpdatedDate: string;
}
