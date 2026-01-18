import type { MaterialCardDto } from "../types/library";

export const materialCards: MaterialCardDto[] = [
    {
        id: "m1",
        title: "Clean Code",
        authors: "Robert C. Martin",
        genre: "Software",
        year: "2008",
        coverUrl: null,
        totalCopies: 6,
        availableCopies: 3,
    },
    {
        id: "m2",
        title: "Design Patterns",
        authors: "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
        genre: "Software",
        year: "1994",
        coverUrl: null,
        totalCopies: 4,
        availableCopies: 1,
    },
    {
        id: "m3",
        title: "The Pragmatic Programmer",
        authors: "Andrew Hunt, David Thomas",
        genre: "Software",
        year: "1999",
        coverUrl: null,
        totalCopies: 5,
        availableCopies: 0,
    },
    {
        id: "m4",
        title: "Мастер и Маргарита",
        authors: "М.А. Булгаков",
        genre: "Fiction",
        year: "1967",
        coverUrl: null,
        totalCopies: 8,
        availableCopies: 6,
    },
];
