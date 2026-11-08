import { For, Show, createMemo, createSignal } from 'solid-js';

interface Row {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  active: boolean;
}

type SortKey = 'name' | 'email' | 'role';

function compareRows(a: Row, b: Row, key: SortKey, ascending: boolean): number {
  const left = a[key];
  const right = b[key];
  if (left === right) {
    return 0;
  }
  const order = left < right ? -1 : 1;
  return ascending ? order : -order;
}

function RoleBadge(props: { role: Row['role'] }) {
  const label = createMemo(() => {
    switch (props.role) {
      case 'admin':
        return 'Administrator';
      case 'editor':
        return 'Editor';
      default:
        return 'Viewer';
    }
  });
  return <span class={`badge badge-${props.role}`}>{label()}</span>;
}

function SearchBox(props: { value: string; onInput: (value: string) => void }) {
  return (
    <label class="search">
      <span>Search</span>
      <input
        type="search"
        value={props.value}
        onInput={(event) => props.onInput(event.currentTarget.value)}
        placeholder="Name or email"
      />
    </label>
  );
}

function HeaderCell(props: {
  label: string;
  key: SortKey;
  sortKey: SortKey;
  ascending: boolean;
  onSort: (key: SortKey) => void;
}) {
  const active = () => props.sortKey === props.key;
  return (
    <th aria-sort={active() ? (props.ascending ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => props.onSort(props.key)}>
        {props.label}
        <Show when={active()}>{props.ascending ? ' ▲' : ' ▼'}</Show>
      </button>
    </th>
  );
}

function Pagination(props: { page: number; pages: number; onPage: (page: number) => void }) {
  const pages = createMemo(() => {
    const result: number[] = [];
    for (let index = 0; index < props.pages; index += 1) {
      result.push(index);
    }
    return result;
  });
  return (
    <nav class="pagination">
      <button disabled={props.page === 0} onClick={() => props.onPage(props.page - 1)}>
        Previous
      </button>
      <For each={pages()}>
        {(page) => (
          <button
            aria-current={page === props.page ? 'page' : undefined}
            onClick={() => props.onPage(page)}
          >
            {page + 1}
          </button>
        )}
      </For>
      <button disabled={props.page >= props.pages - 1} onClick={() => props.onPage(props.page + 1)}>
        Next
      </button>
    </nav>
  );
}

export default function UserTable(props: { rows: Row[]; pageSize?: number }) {
  const [query, setQuery] = createSignal('');
  const [sortKey, setSortKey] = createSignal<SortKey>('name');
  const [ascending, setAscending] = createSignal(true);
  const [page, setPage] = createSignal(0);
  const pageSize = () => props.pageSize ?? 20;

  const filtered = createMemo(() => {
    const needle = query().trim().toLowerCase();
    if (needle === '') {
      return props.rows;
    }
    const result: Row[] = [];
    for (const row of props.rows) {
      if (row.name.toLowerCase().includes(needle) || row.email.toLowerCase().includes(needle)) {
        result.push(row);
      }
    }
    return result;
  });

  const sorted = createMemo(() => {
    const key = sortKey();
    const order = ascending();
    return filtered()
      .slice()
      .sort((a, b) => compareRows(a, b, key, order));
  });

  const pages = createMemo(() => Math.max(1, Math.ceil(sorted().length / pageSize())));
  const visible = createMemo(() => sorted().slice(page() * pageSize(), (page() + 1) * pageSize()));

  function sortBy(key: SortKey): void {
    if (sortKey() === key) {
      setAscending(!ascending());
    } else {
      setSortKey(key);
      setAscending(true);
    }
    setPage(0);
  }

  return (
    <section class="users">
      <SearchBox
        value={query()}
        onInput={(value) => {
          setQuery(value);
          setPage(0);
        }}
      />
      <table>
        <thead>
          <tr>
            <HeaderCell
              label="Name"
              key="name"
              sortKey={sortKey()}
              ascending={ascending()}
              onSort={sortBy}
            />
            <HeaderCell
              label="Email"
              key="email"
              sortKey={sortKey()}
              ascending={ascending()}
              onSort={sortBy}
            />
            <HeaderCell
              label="Role"
              key="role"
              sortKey={sortKey()}
              ascending={ascending()}
              onSort={sortBy}
            />
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <For each={visible()}>
            {(row) => (
              <tr classList={{ inactive: !row.active }}>
                <td>{row.name}</td>
                <td>
                  <a href={`mailto:${row.email}`}>{row.email}</a>
                </td>
                <td>
                  <RoleBadge role={row.role} />
                </td>
                <td>{row.active ? 'Active' : 'Disabled'}</td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
      <Show when={pages() > 1}>
        <Pagination page={page()} pages={pages()} onPage={setPage} />
      </Show>
    </section>
  );
}
