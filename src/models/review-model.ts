export interface Review {
    //Id: number;
    MovieId: number;
    ReviewId: Number; //This will act as unique id for each review
    Content: string;
    ReviewDate: string;
    Rating: number;
    UserId: string;
    ReviewerEmail: string;
}
