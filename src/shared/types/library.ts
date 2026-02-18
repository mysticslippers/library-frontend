export type Role = "READER" | "LIBRARIAN" | "ADMIN";

export type BookingStatus = "PENDING" | "RESERVED" | "ISSUED" | "CANCELLED";

export type IssuanceStatus = "OPEN" | "RETURNED" | "OVERDUE";
export type FineState = "UNPAID" | "PAID" | "CANCELLED";

export type AuthUser = {
    id: string;
    role: Role;
    identifier: string;
    personId?: string;
    libraryId?: string;
};

export type Material = {
    id: string;
    title: string;
    publishingHouse?: string | null;
    publicationYear?: string | null;
    genre?: string | null;
    language?: string | null;
    isbn?: string | null;
    copies: number;
};

export type Booking = {
    id: string;
    readerId: string;
    librarianId?: string | null;
    libraryId: string;
    materialId: string;
    bookingDate: string;
    bookingDeadline: string;
    status: BookingStatus;
};

export type MaterialCardDto = {
    description: string;
    id: string;
    title: string;
    authors: string;
    genre?: string | null;
    year?: string | null;
    coverUrl?: string | null;
    totalCopies: number;
    availableCopies?: number;
};

export type BookingViewDto = {
    id: string;
    status: BookingStatus;
    bookingDate: string;
    bookingDeadline: string;
    material: Pick<Material, "id" | "title" | "isbn">;
    libraryId: string;
};
