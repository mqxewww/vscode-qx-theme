/**
 * Delays a call until no new call happened for `delay` milliseconds.
 * @param {(...args: unknown[]) => void} callback
 * @param {number} [delay=200]
 * @returns {(...args: unknown[]) => void}
 */
export function debounce(callback, delay = 200) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => callback(...args), delay);
  };
}

const API_URL = "https://api.example.com/v1";
const EMAIL_PATTERN = /^[\w.+-]+@[\w-]+\.[a-z]{2,}$/i;

export class HttpError extends Error {
  static #count = 0;

  constructor(status, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    HttpError.#count++;
  }

  get isClientError() {
    return this.status >= 400 && this.status < 500;
  }

  static get count() {
    return HttpError.#count;
  }
}

export async function fetchUser(id, { signal } = {}) {
  const response = await fetch(`${API_URL}/users/${encodeURIComponent(id)}`, { signal });
  if (!response.ok) {
    throw new HttpError(response.status, `Request failed: ${response.statusText}`);
  }

  const { name, email, roles = [] } = await response.json();
  return {
    name: name?.trim() ?? "Anonymous",
    email: EMAIL_PATTERN.test(email) ? email : null,
    isAdmin: roles.includes("admin"),
  };
}

function* range(start, end, step = 1) {
  for (let value = start; value < end; value += step) {
    yield value;
  }
}

const evens = [...range(0, 10)].filter((n) => n % 2 === 0);
console.log("Even numbers:\t%o", evens, typeof evens, evens instanceof Array);
