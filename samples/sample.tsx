declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export {};

type Variant = "primary" | "secondary";

interface ButtonProps {
  label: string;
  variant?: Variant;
  disabled?: boolean;
  onClick: () => void;
}

interface ListProps<T> {
  items: readonly T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => unknown;
  emptyText?: string;
}

interface User {
  id: string;
  name: string;
  isOnline: boolean;
}

const MAX_VISIBLE = 5;

export function Button({ label, variant = "primary", disabled = false, onClick }: ButtonProps) {
  return (
    <button type="button" className={`btn btn--${variant}`} disabled={disabled} onClick={onClick}>
      {label}
    </button>
  );
}

export function List<T>({ items, getKey, renderItem, emptyText = "Nothing here yet." }: ListProps<T>) {
  if (items.length === 0) {
    return <p className="list__empty">{emptyText}</p>;
  }

  return (
    <ul className="list">
      {items.slice(0, MAX_VISIBLE).map((item) => (
        <li key={getKey(item)}>{renderItem(item)}</li>
      ))}
      {items.length > MAX_VISIBLE && <li className="list__more">+{items.length - MAX_VISIBLE} more</li>}
    </ul>
  );
}

export function TeamPanel({ users, onRefresh }: { users: User[]; onRefresh: () => void }) {
  return (
    <>
      <h2 style={{ marginBottom: 8 }}>Team ({users.length})</h2>
      <List
        items={users}
        getKey={(user) => user.id}
        renderItem={(user) => <span className={user.isOnline ? "online" : "offline"}>{user.name}</span>}
      />
      <Button label="Refresh" variant="secondary" onClick={onRefresh} />
    </>
  );
}
