export const nextId = (items: { id: number }[]) => Math.max(0, ...items.map((item) => item.id)) + 1;
export const matches = (value: string, search: string) => value.toLocaleLowerCase("fr").includes(search.trim().toLocaleLowerCase("fr"));
export const emailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
