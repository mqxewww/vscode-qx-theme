type Listener<T> = (payload: T) => void;
type Patch<T> = { -readonly [K in keyof T]?: T[K] };

enum Status {
  Draft = "draft",
  Published = "published",
  Archived = "archived",
}

interface Entity {
  readonly id: number;
  status: Status;
}

interface Repository<T extends Entity> {
  find(id: number): T | undefined;
  save(item: T): Promise<void>;
}

const MAX_ITEMS = 100;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const defaults = { status: Status.Draft } as const;

function logged<This, Args extends unknown[], Return>(
  method: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
) {
  return function (this: This, ...args: Args): Return {
    console.log(`→ ${String(context.name)}(${args.length} args)`);
    return method.call(this, ...args);
  };
}

/**
 * In-memory repository that notifies its listeners on every save.
 * @typeParam T - Stored entity
 */
export class MemoryRepository<T extends Entity> implements Repository<T> {
  readonly #items = new Map<number, T>();
  private listeners: Listener<T>[] = [];

  find(id: number): T | undefined {
    return this.#items.get(id);
  }

  @logged
  async save(item: T): Promise<void> {
    if (this.#items.size >= MAX_ITEMS) {
      throw new RangeError(`Repository is full (${MAX_ITEMS} items)`);
    }
    this.#items.set(item.id, item);
    this.listeners.forEach((listener) => listener(item));
  }

  update(id: number, patch: Patch<T>): T | undefined {
    const item = this.find(id);
    return item && { ...item, ...patch };
  }

  subscribe(listener: Listener<T>): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((other) => other !== listener);
    };
  }
}

interface Article extends Entity {
  title: string;
  slug: string;
  tags?: readonly string[];
}

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

const articles = new MemoryRepository<Article>();
articles.subscribe(({ title, status }) => console.log(`Saved "${title}" as ${status}\n`));

void articles.save({ id: 1, title: "Hello, world", slug: "hello-world", ...defaults });
