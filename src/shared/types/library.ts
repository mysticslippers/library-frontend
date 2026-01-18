export type Role = "READER" | "LIBRARIAN" | "ADMIN";
export type BookingStatus = "ACTIVE" | "CANCELLED" | "EXPIRED" | "COMPLETED";
export type IssuanceStatus = "OPEN" | "RETURNED" | "OVERDUE";
export type FineState = "UNPAID" | "PAID" | "CANCELLED";

export type Person = {
    id: string;
    surname?: string;
    name?: string;
    middleName?: string | null;
    birthDate?: string;
    gender?: string;
    role: Role;
};

export type AuthUser = {
    id: string;
    role: Role;
    identifier: string;
    personId?: string;
    libraryId?: string;
};

export type Author = {
    id: string;
    surname: string;
    name: string;
    middleName?: string | null;
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

export type Library = {
    id: string;
    address?: unknown;
    status?: string;
    numberStaff?: number;
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

export type Issuance = {
    id: string;
    bookingId: string;
    issuanceDate: string;
    status: IssuanceStatus;
};

export type LibraryCard = {
    id: string;
    readerId: string;
    status?: string;
    numberOfBookings?: number;
};

export type Fine = {
    id: string;
    libraryCardId: string;
    issuanceId: string;
    description: string;
    dueDate: string; // date
    paymentDate?: string | null;
    state: FineState;
};

export type MaterialCardDto = {
    id: string;
    title: string;
    authors: string;
    genre?: string | null;
    year?: string | null;
    coverUrl?: string | null;
    totalCopies: number;
    availableCopies?: number;
};

export type MaterialDetailsDto = {
    material: Material;
    authors: Author[];
    libraries?: { library: Library; availableCopies?: number }[];
};

export type BookingViewDto = {
    id: string;
    status: BookingStatus;
    bookingDate: string;
    bookingDeadline: string;
    material: Pick<Material, "id" | "title" | "isbn">;
    libraryId: string;
};

export type IssuanceViewDto = {
    id: string;
    status: IssuanceStatus;
    issuanceDate: string;
    booking: BookingViewDto;
};

export type FineViewDto = {
    id: string;
    state: FineState;
    description: string;
    dueDate: string;
    paymentDate?: string | null;
    issuanceId: string;
    amount?: number;
};
