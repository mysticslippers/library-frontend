import type { AuthUser, Role } from "../types/library";

type StoredUser = {
    id: string;
    identifier: string;
    password: string;
    role: Role;
    createdAt: string;
    personId?: string;
    libraryId?: string;
};

type Session = { token: string; userId: string; createdAt: string };

type ResetTokenRecord = {
    token: string;
    identifier: string;
    expiresAt: number;
};

const LS_USERS = "lib.users";
const LS_SESSION = "lib.session";
const LS_RESET_TOKENS = "lib.resetTokens";

function uuid() {
    return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
}

function readJson<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function writeJson<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getUsers(): StoredUser[] {
    return readJson<StoredUser[]>(LS_USERS, []);
}

function setUsers(users: StoredUser[]) {
    writeJson(LS_USERS, users);
}

function getResetTokens(): ResetTokenRecord[] {
    return readJson<ResetTokenRecord[]>(LS_RESET_TOKENS, []);
}

function setResetTokens(tokens: ResetTokenRecord[]) {
    writeJson(LS_RESET_TOKENS, tokens);
}

function normalizeIdentifier(identifier: string) {
    return identifier.trim().toLowerCase();
}

function toAuthUser(u: StoredUser): AuthUser {
    return {
        id: u.id,
        role: u.role,
        identifier: u.identifier,
        personId: u.personId,
        libraryId: u.libraryId,
    };
}

export function ensureSeedUsers() {
    const users = getUsers();
    const adminIdentifier = "admin@lib.com";
    const exists = users.some((u) => normalizeIdentifier(u.identifier) === normalizeIdentifier(adminIdentifier));
    if (exists) return;

    const admin: StoredUser = {
        id: uuid(),
        identifier: normalizeIdentifier(adminIdentifier),
        password: "Admin1234",
        role: "LIBRARIAN",
        createdAt: new Date().toISOString(),
        libraryId: "1",
    };

    setUsers([admin, ...users]);
}

export function getCurrentSession(): { token: string; user: AuthUser } | null {
    const session = readJson<Session | null>(LS_SESSION, null);
    if (!session) return null;

    const user = getUsers().find((u) => u.id === session.userId);
    if (!user) return null;

    return { token: session.token, user: toAuthUser(user) };
}

export function logout() {
    localStorage.removeItem(LS_SESSION);
}


export function registerReader(email: string, password: string) {
    const users = getUsers();
    const identifier = normalizeIdentifier(email);

    if (users.some((u) => normalizeIdentifier(u.identifier) === identifier)) {
        throw new Error("IDENTIFIER_ALREADY_EXISTS");
    }

    const user: StoredUser = {
        id: uuid(),
        identifier,
        password,
        role: "READER",
        createdAt: new Date().toISOString(),
    };

    setUsers([user, ...users]);
    return toAuthUser(user);
}

export function login(identifierRaw: string, password: string) {
    const users = getUsers();
    const identifier = normalizeIdentifier(identifierRaw);

    const user = users.find((u) => normalizeIdentifier(u.identifier) === identifier);

    if (!user || user.password !== password) {
        throw new Error("INVALID_CREDENTIALS");
    }

    const session: Session = { token: uuid(), userId: user.id, createdAt: new Date().toISOString() };
    writeJson(LS_SESSION, session);

    return { token: session.token, user: toAuthUser(user) };
}

export function requestPasswordReset(emailRaw: string) {
    const users = getUsers();
    const identifier = normalizeIdentifier(emailRaw);
    const userExists = users.some((u) => normalizeIdentifier(u.identifier) === identifier);

    const token = uuid();
    const expiresAt = Date.now() + 15 * 60 * 1000;

    if (userExists) {
        const tokens = getResetTokens().filter((t) => t.expiresAt > Date.now());
        tokens.push({ token, identifier, expiresAt });
        setResetTokens(tokens);
    }

    return { ok: true, token: userExists ? token : null };
}

export function resetPassword(token: string, newPassword: string) {
    const tokens = getResetTokens().filter((t) => t.expiresAt > Date.now());
    const record = tokens.find((t) => t.token === token);
    if (!record) throw new Error("INVALID_OR_EXPIRED_TOKEN");

    const users = getUsers();
    const idx = users.findIndex((u) => normalizeIdentifier(u.identifier) === normalizeIdentifier(record.identifier));
    if (idx === -1) throw new Error("INVALID_OR_EXPIRED_TOKEN");

    users[idx] = { ...users[idx], password: newPassword };
    setUsers(users);

    setResetTokens(tokens.filter((t) => t.token !== token));
    return { ok: true };
}
